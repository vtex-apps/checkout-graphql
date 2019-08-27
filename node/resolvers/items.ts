import { map } from 'bluebird'

import { StoreGraphQL } from '../clients/storeGraphQL'
import { fixImageUrl } from '../utils/image'

const getSkuSpecifications = (skuId: string, skuList: any[]) => {
  const matchedSku = skuList.find((sku: any) => sku.itemId === skuId)
  if (!matchedSku) {
    return []
  }
  return matchedSku.skuSpecifications
}

export const adjustItems = (items: OrderFormItem[], storeGraphQL: StoreGraphQL) =>
  map(items, async (item: OrderFormItem) => {
    const response = await storeGraphQL.product({
      identifier: {
        field: 'id',
        value: item.productId,
      },
    })

    const { product } = response.data!

    return {
      ...item,
      imageUrl: fixImageUrl(item.imageUrl)!,
      name: product.productName,
      skuSpecifications: getSkuSpecifications(item.id, product.items),
    }
  })

export const mutations = {
  updateItems: async (
    _: any,
    { orderItems }: { orderItems: OrderFormItemInput[] },
    ctx: Context
  ): Promise<OrderForm> => {
    const {
      clients: { checkout, storeGraphQL },
      vtex: { orderFormId },
    } = ctx
    const orderForm = await checkout.updateItems(orderFormId!, orderItems)

    const adjustedItems = await adjustItems(orderForm.items, storeGraphQL)

    return {
      ...orderForm,
      items: adjustedItems,
    }
  },
}
