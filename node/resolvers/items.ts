import { map } from 'bluebird'

import { StoreGraphQL } from '../clients/storeGraphQL'
import { fixImageUrl } from '../utils/image'
import { getNewOrderForm } from './orderForm'

const getSkuSpecifications = (skuId: string, skuList: any[]) => {
  const matchedSku = skuList.find((sku: any) => sku.itemId === skuId)
  if (!matchedSku) {
    return []
  }
  return matchedSku.skuSpecifications
}

export const adjustItems = (
  items: OrderFormItem[],
  storeGraphQL: StoreGraphQL
) =>
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
  ): Promise<Partial<OrderForm>> => {
    const {
      clients: { checkout, storeGraphQL },
      vtex: { orderFormId },
    } = ctx

    if (orderItems.some((item: OrderFormItemInput) => !item.index)) {
      const orderForm = await checkout.orderForm()

      const idToIndex = orderForm.items.reduce(
        (acc: Record<string, number>, item: OrderFormItem, index: number) => {
          acc[item.uniqueId] = index
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

    const newOrderForm = await checkout.updateItems(orderFormId!, orderItems)

    return getNewOrderForm({
      newOrderForm,
      storeGraphQL,
    })
  },
}
