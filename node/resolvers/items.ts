import { Logger } from '@vtex/api'

import { SearchGraphQL } from '../clients/searchGraphQL'
import { fixImageUrl } from '../utils/image'
import { addOptionsForItems } from '../utils/attachmentsHelpers'
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
    } = args

    const { checkout } = clients
    const shouldUpdateMarketingData =
      Object.keys(marketingData ?? {}).length > 0

    const { items: previousItems } = await checkout.orderForm(orderFormId!)
    const cleanItems = items.map(({ options, ...rest }) => rest)
    const withOptions = items.filter(
      ({ options }) => !!options && options.length > 0
    )

    /**
     * Always be sure to make these requests in the same order you use
     * while spreading their properties, since the second one will always
     * contain the most recent orderForm.
     */
    let newOrderForm = await checkout.addItem(
      orderFormId!,
      cleanItems,
      salesChannel
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

      return checkout.orderForm(orderFormId!)
    }

    return newOrderForm
  },

  updateItems: async (
    _: unknown,
    args: {
      orderItems: OrderFormItemInput[]
      splitItem: boolean
    } & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const { clients, vtex } = ctx
    const { orderFormId = vtex.orderFormId, orderItems, splitItem } = args
    const { checkout } = clients

    if (orderItems.some((item: OrderFormItemInput) => !item.index)) {
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

      orderItems.forEach((item: OrderFormItemInput) => {
        if (!item.index && item.uniqueId) {
          item.index = idToIndex[item.uniqueId]
        }
      })
    }

    const newOrderForm = await clients.checkout.updateItems(
      orderFormId!,
      orderItems,
      splitItem
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
