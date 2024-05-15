import { Logger } from '@vtex/api'

import { SearchGraphQL } from '../clients/searchGraphQL'
import { fixImageUrl } from '../utils/image'
import { addOptionsForItems } from '../utils/attachmentsHelpers'
import { generateSubscriptionDataEntry } from '../utils/subscriptions'
import { OrderFormIdArgs } from '../utils/args'

const getProductInfo = async (
  item: OrderFormItem,
  searchGraphQL: SearchGraphQL,
  logger: Logger
) => {
  try {
    const response = await searchGraphQL.product(item.productId)

    return response
  } catch (err) {
    if (Math.floor(Math.random() * 100) === 0) {
      logger.warn({
        message: 'Error when communicating with vtex.search-graphql',
        error: err,
      })
    }
    return null
  }
}

const getVariations = (skuId: string, skuList: any[]) => {
  const matchedSku = skuList.find((sku: any) => sku.itemId === skuId)
  if (!matchedSku) {
    return []
  }
  return matchedSku.variations.map((variation: any) => ({
    fieldName: variation.name,
    fieldValues: variation.values || [],
  }))
}

export const root = {
  Item: {
    name: async (item: OrderFormItem, _: unknown, ctx: Context) => {
      const {
        vtex: { logger },
        clients: { searchGraphQL },
      } = ctx

      const product = await getProductInfo(item, searchGraphQL, logger)

      return product?.productName ?? item.name
    },
    skuName: async (item: OrderFormItem, _: unknown, ctx: Context) => {
      const {
        vtex: { logger },
        clients: { searchGraphQL },
      } = ctx

      const product = await getProductInfo(item, searchGraphQL, logger)

      return (
        product?.items.find(({ itemId }) => itemId === item.id)?.name ??
        item.skuName
      )
    },
    imageUrls: (item: OrderFormItem, _: unknown, ctx: Context) => {
      return fixImageUrl(item.imageUrl, ctx.vtex.platform)
    },
    skuSpecifications: async (
      item: OrderFormItem,
      _: unknown,
      ctx: Context
    ) => {
      const {
        vtex: { logger },
        clients: { searchGraphQL },
      } = ctx

      const product = await getProductInfo(item, searchGraphQL, logger)

      return getVariations(item.id, product?.items ?? [])
    },
    productSpecificationGroups: async (
      item: OrderFormItem,
      _: unknown,
      ctx: Context
    ) => {
      const {
        vtex: { logger },
        clients: { searchGraphQL },
      } = ctx

      const product = await getProductInfo(item, searchGraphQL, logger)

      return product?.specificationGroups ?? []
    },
  },
}

export const mutations = {
  addToCart: async (
    _: unknown,
    args: {
      items: OrderFormItemInput[]
      marketingData: Partial<OrderFormMarketingData>
      salesChannel?: string
      allowedOutdatedData?: string[]
    } & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients,
      vtex,
      vtex: { logger },
    } = ctx
    const {
      orderFormId = vtex.orderFormId,
      items,
      marketingData = {},
      salesChannel,
      allowedOutdatedData,
    } = args

    const { checkout } = clients
    const shouldUpdateMarketingData =
      Object.keys(marketingData ?? {}).length > 0

    const { items: previousItems } = await checkout.orderForm(orderFormId!)
    const cleanItems = items.map(
      ({ options, index, uniqueId, ...rest }) => rest
    )

    const withOptions = items
      .map((item, currentIndex) => ({
        ...item,
        index: item.index ?? currentIndex,
      }))
      .filter(({ options }) => !!options && options.length > 0)

    /**
     * Always be sure to make these requests in the same order you use
     * while spreading their properties, since the second one will always
     * contain the most recent orderForm.
     */
    let newOrderForm = await checkout.addItem(
      orderFormId!,
      cleanItems,
      salesChannel,
      allowedOutdatedData
    )

    try {
      if (shouldUpdateMarketingData) {
        newOrderForm = await checkout.updateOrderFormMarketingData(
          orderFormId!,
          marketingData
        )
      }
    } catch (err) {
      logger.error({
        message: 'Error when updating orderForm marketing data.',
        id: orderFormId,
        graphqlArgs: marketingData,
        originalError: err,
      })
    }

    if (withOptions && withOptions.length > 0) {
      await addOptionsForItems(
        withOptions,
        checkout,
        {
          ...newOrderForm,
          orderFormId: orderFormId!,
        },
        previousItems
      )

      const subscriptionOptionsOnly = withOptions
        .map(itemWithOptions => ({
          itemIndex: (itemWithOptions.index as number) + previousItems.length,
          options: itemWithOptions.options as AssemblyOptionInput[],
        }))
        .filter(item =>
          item.options.some(option =>
            option.assemblyId.includes('vtex.subscription')
          )
        )

      const newSubscriptionDataEntries = generateSubscriptionDataEntry(
        subscriptionOptionsOnly
      )

      if (newSubscriptionDataEntries.length > 0) {
        const updatedSubscriptionData = {
          subscriptions: newOrderForm.subscriptionData
            ? newOrderForm.subscriptionData.subscriptions.concat(
                newSubscriptionDataEntries
              )
            : newSubscriptionDataEntries,
        }

        await checkout.updateSubscriptionDataField(
          orderFormId!,
          updatedSubscriptionData
        )
      }

      return checkout.orderForm(orderFormId!)
    }

    return newOrderForm
  },

  updateItems: async (
    _: unknown,
    args: {
      orderItems: OrderFormItemInput[]
      splitItem: boolean
      allowedOutdatedData?: string[]
    } & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const { clients, vtex } = ctx
    const {
      orderFormId = vtex.orderFormId,
      orderItems,
      splitItem,
      allowedOutdatedData,
    } = args
    const { checkout } = clients

    const cleanItems = orderItems.map(({ id, ...rest }) => rest)

    // Validating subscriptions
    let subscriptions
    if (orderItems.length === 1 && orderItems[0].index !== undefined) {
      const { items } = await checkout.orderForm(orderFormId!)
      const itemToUpdate = items[orderItems[0].index]

      subscriptions = itemToUpdate.attachments?.some(attachment =>
        attachment.name?.includes('vtex.subscription')
      )
    }

    if (cleanItems.some((item: OrderFormItemInput) => !item.index)) {
      const orderForm = await checkout.orderForm(orderFormId!)

      const hasAssemblyOptions = orderForm.itemMetadata.items.some(
        item => item.assemblyOptions && item.assemblyOptions.length > 0
      )

      const idToIndex = orderForm.items.reduce(
        (acc: Record<string, number>, item: OrderFormItem, index: number) => {
          if (acc[item.uniqueId] === undefined) {
            acc[item.uniqueId] = index
          }
          return acc
        },
        {} as Record<string, number>
      )

      cleanItems.forEach((item: OrderFormItemInput) => {
        if (!item.index && item.uniqueId) {
          item.index = idToIndex[item.uniqueId]
        }

        if (!item.uniqueId && item.index !== undefined && item.index !== null) {
          const uniqueId =
            item.index !== undefined && item.index !== null
              ? orderForm.items[item.index].uniqueId
              : item.uniqueId
          item.uniqueId = uniqueId
        }
      })

      // Add validation to check if the item with assembly has the quantity sent
      if (hasAssemblyOptions) {
        const matchedItems = cleanItems
          .map(cleanItem => {
            const matchedItem = orderForm.items.find(
              item => item.uniqueId === cleanItem.uniqueId
            )

            if (matchedItem) {
              return {
                id: matchedItem.id,
                quantity:
                  cleanItem.quantity !== undefined ? cleanItem.quantity : null,
                seller: matchedItem.seller,
              }
            }
            return null
          })
          .filter(item => item !== null) as Array<{
          id: string
          quantity: number
          seller: string
        }>

        const orderFormSimulation = await checkout.simulation({
          country: orderForm.shippingData?.address?.country ?? '',
          items: matchedItems,
          postalCode: orderForm.shippingData?.address?.postalCode ?? '',
          geoCoordinates: orderForm.shippingData?.address?.geoCoordinates,
        })

        matchedItems.forEach(matchedItem => {
          const cleanItem = cleanItems.find(
            item =>
              item.index !== undefined &&
              orderForm.items[item.index].id === matchedItem.id
          )
          if (cleanItem) {
            const orderFormSimulationItem =
              orderFormSimulation.items[cleanItem.index!]
            if (
              orderFormSimulationItem &&
              orderFormSimulationItem.quantity < matchedItem.quantity
            ) {
              // Update the quantity in case the quantity is not available
              cleanItem.quantity = orderFormSimulationItem.quantity
            }
          }
        })
      }
    }

    const newOrderForm = await clients.checkout.updateItems(
      orderFormId!,
      cleanItems,
      subscriptions ? false : splitItem,
      allowedOutdatedData
    )

    return newOrderForm
  },
  addItemOffering: async (
    _: unknown,
    args: { offeringInput: OfferingInput } & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const { clients, vtex } = ctx
    const { offeringInput, orderFormId = vtex.orderFormId } = args

    const newOrderForm = await clients.checkout.addItemOffering(
      orderFormId!,
      offeringInput.itemIndex,
      offeringInput.offeringId,
      offeringInput.offeringInfo
    )

    return newOrderForm
  },
  removeItemOffering: async (
    _: unknown,
    args: { offeringInput: OfferingInput } & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const { clients, vtex } = ctx
    const { offeringInput, orderFormId = vtex.orderFormId } = args

    const newOrderForm = await clients.checkout.removeItemOffering(
      orderFormId!,
      offeringInput.itemIndex,
      offeringInput.offeringId
    )

    return newOrderForm
  },
  addBundleItemAttachment: async (
    _: unknown,
    args: {
      bundleItemAttachmentInput: BundleItemAttachmentInput
    } & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const { clients, vtex } = ctx
    const { bundleItemAttachmentInput, orderFormId = vtex.orderFormId } = args

    const newOrderForm = await clients.checkout.addBundleItemAttachment(
      orderFormId!,
      bundleItemAttachmentInput.itemIndex,
      bundleItemAttachmentInput.bundleItemId,
      bundleItemAttachmentInput.attachmentName,
      bundleItemAttachmentInput.attachmentContent
    )

    return newOrderForm
  },
  removeBundleItemAttachment: async (
    _: unknown,
    args: {
      bundleItemAttachmentInput: BundleItemAttachmentInput
    } & OrderFormIdArgs,
    ctx: Context
  ) => {
    const { clients, vtex } = ctx
    const { bundleItemAttachmentInput, orderFormId = vtex.orderFormId } = args

    const { data } = await clients.checkout.removeBundleItemAttachment(
      orderFormId!,
      bundleItemAttachmentInput.itemIndex,
      bundleItemAttachmentInput.bundleItemId,
      bundleItemAttachmentInput.attachmentName,
      bundleItemAttachmentInput.attachmentContent
    )

    return data
  },
  setManualPrice: async (
    _: unknown,
    args: { input: { itemIndex: number; price: number } } & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const { clients, vtex } = ctx
    const {
      input: { itemIndex, price },
      orderFormId = vtex.orderFormId,
    } = args

    const newOrderForm = await clients.checkoutAdmin.setManualPrice(
      orderFormId!,
      itemIndex,
      price
    )

    return newOrderForm
  },
}

interface OfferingInput {
  itemIndex: number
  offeringId: string
  offeringInfo: unknown
}

interface BundleItemAttachmentInput {
  itemIndex: number
  bundleItemId: string
  attachmentName: string
  attachmentContent: unknown
}
