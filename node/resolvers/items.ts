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
    logger.warn({
      message: 'Error when communicating with vtex.search-graphql',
      error: err,
    })
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

    // Filter only the items with options and ensure that they have a proper index property
    const withOptions = items.reduce((acc: OrderFormItemInput[], item: OrderFormItemInput, currentIndex: number) => {
      if (item.options && item.options.length > 0) {
        return [ ...acc, { ...item, index: item.index ?? currentIndex } ]
      }

      return acc
    }, [])

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

    if (cleanItems.some((item: OrderFormItemInput) => !item.index)) {
      const orderForm = await checkout.orderForm(orderFormId!)

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
      })
    }

    const newOrderForm = await clients.checkout.updateItems(
      orderFormId!,
      cleanItems,
      splitItem,
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
