import { AxiosError } from 'axios'

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
    const [, slug] = item.detailUrl.split('/')
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
  Promise.all(
    items.map(async (item: OrderFormItem) => {
      try {
        const product = await getProductInfo(platform, item, searchGraphQL)

        return {
          ...item,
          imageUrls: fixImageUrl(item.imageUrl, platform),
          name: product.productName,
          skuSpecifications: getVariations(item.id, product.items),
        }
      } catch (err) {
        if ('config' in err) {
          const axiosError = err as AxiosError

          // if we didn't find the product, it's likely that
          // it is unavailable, so we will return null and filter
          // it out later
          if (axiosError.code === '404') {
            return null
          }
        }

        // if we did found the product, but there still an error,
        // we should throw because it is not expected
        throw err
      }
    })
  ).then(resolvedItems => resolvedItems.filter(item => item != null))

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

    /**
     * Always be sure to make these requests in the same order you use
     * while spreading their properties, since the second one will always
     * contain the most recent orderForm.
     */
    const newOrderForm = await checkout.addItem(orderFormId!, cleanItems)
    const newOrderFormWithMarketingData = shouldUpdateMarketingData
      ? await checkout.updateOrderFormMarketingData(orderFormId!, marketingData)
      : newOrderForm

    if (withOptions && withOptions.length > 0) {
      await addOptionsForItems(
        withOptions,
        checkout,
        {
          ...newOrderFormWithMarketingData,
          orderFormId: orderFormId!,
        },
        previousItems
      )

      return checkout.orderForm()
    }

    return newOrderFormWithMarketingData
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
