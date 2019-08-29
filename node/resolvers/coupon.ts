import { adjustItems } from './items'

export const mutations = {
  insertCoupon: async (_: any, args: any, ctx: Context) => {
    const {
      clients: { checkout, storeGraphQL },
      vtex: { orderFormId },
    } = ctx
    const orderForm = await checkout.insertCoupon(orderFormId!, args.text)

    return {
      ...orderForm,
      items: adjustItems(orderForm.items, storeGraphQL),
    }
  },
}
