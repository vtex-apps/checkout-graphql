import { map } from 'bluebird'

import { SearchGraphQL } from '../clients/searchGraphQL'
import { fixImageUrl } from '../utils/image'
import { addOptionsForItems } from '../utils/attachmentsHelpers'

const GOCOMMERCE = 'gocommerce'

const getProductInfo = async (
  platform: string,
  item: OrderFormItem,
  searchGraphQL: SearchGraphQL
) => {
  let response

  if (platform === GOCOMMERCE) {
    const slug = item.detailUrl.split('/')[1]
    response = await searchGraphQL.product({ slug })
  } else {
    response = await searchGraphQL.product({
      identifier: {
        field: 'id',
        value: item.productId,
      },
    })
  }

  return response.data!.product
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

export const adjustItems = (
  platform: string,
  items: OrderFormItem[],
  searchGraphQL: SearchGraphQL
) =>
  map(items, async (item: OrderFormItem) => {
    const product = await getProductInfo(platform, item, searchGraphQL)

    return {
      ...item,
      imageUrls: fixImageUrl(item.imageUrl, platform),
      name: product.productName,
      skuSpecifications: getVariations(item.id, product.items),
    }
  })

export const mutations = {
  addToCart: async (
    _: unknown,
    {
      items,
      marketingData = {},
    }: {
      items: OrderFormItemInput[]
      marketingData: Partial<OrderFormMarketingData>
    },
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients,
      vtex: { orderFormId },
    } = ctx
    const { checkout } = clients
    const shouldUpdateMarketingData = Object.keys(marketingData).length > 0

    const { items: previousItems } = await checkout.orderForm()
    const cleanItems = items.map(({ options, ...rest }) => rest)
    const withOptions = items.filter(
      ({ options }) => !!options && options.length > 0
    )

    const newOrderForm = await checkout.addItem(orderFormId!, cleanItems)
    const { marketingData: newMarketingData } = shouldUpdateMarketingData
      ? await checkout.updateOrderFormMarketingData(orderFormId!, marketingData)
      : { marketingData: {} }

    await addOptionsForItems(
      withOptions,
      checkout,
      { ...newOrderForm, ...newMarketingData, orderFormId: orderFormId! },
      previousItems
    )

    return withOptions.length === 0
      ? { ...newOrderForm, ...newMarketingData }
      : checkout.orderForm()
  },

  updateItems: async (
    _: unknown,
    { orderItems }: { orderItems: OrderFormItemInput[] },
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients,
      vtex: { orderFormId },
    } = ctx
    const { checkout } = clients

    if (orderItems.some((item: OrderFormItemInput) => !item.index)) {
      const orderForm = await checkout.orderForm()

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
      orderItems
    )

    return newOrderForm
  },
}
