import { Segment } from '@vtex/api'
import { map } from 'bluebird'
import crypto from 'crypto'

import { SearchGraphQL } from '../clients/searchGraphQL'
import { fixImageUrl } from '../utils/image'
import { getNewOrderForm } from './orderForm'

const hashMD5 = (text: string) => {
  const hash = crypto.createHash('md5')
  return hash.update(text).digest('hex')
}

const toSpecificationIOMessage =
  async (field: string, segment: Segment, content: string, id: string) => ({
    content,
    from: await segment.getSegmentByToken(null).then(x => x.cultureInfo),
    id: `Specification-id.${id}::${field}`,
  })

const getVariations = (skuId: string, skuList: any[], segment: Segment) => {
  const matchedSku = skuList.find((sku: any) => sku.itemId === skuId)
  if (!matchedSku) {
    return []
  }
  return matchedSku.variations.map((variation: any) => ({
    fieldName: toSpecificationIOMessage(
      'fieldName',
      segment,
      variation.name,
      hashMD5(variation.name)
    ),
    fieldValues: variation.values.map(
      (value: string) => toSpecificationIOMessage(
        'fieldValue',
        segment,
        value,
        hashMD5(value)
      )
    ),
  }))
}

export const adjustItems = (
  items: OrderFormItem[],
  searchGraphQL: SearchGraphQL,
  segment: Segment
) =>
  map(items, async (item: OrderFormItem) => {
    const response = await searchGraphQL.product({
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
      skuSpecifications: getVariations(item.id, product.items, segment),
    }
  })

export const mutations = {
  updateItems: async (
    _: any,
    { orderItems }: { orderItems: OrderFormItemInput[] },
    ctx: Context
  ): Promise<OrderForm> => {
    const {
      clients: { checkout, searchGraphQL, segment },
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
      checkout,
      newOrderForm,
      searchGraphQL,
      segment,
    })
  },
}
