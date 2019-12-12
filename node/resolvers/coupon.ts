import { getNewOrderForm } from './orderForm'

export const mutations = {
  insertCoupon: async (_: any, args: any, ctx: Context) => {
    const {
      clients,
      vtex: { orderFormId, platform },
    } = ctx
    const newOrderForm =
      await clients.checkout.insertCoupon(orderFormId!, args.text)

    return getNewOrderForm({
      clients,
      newOrderForm,
      platform,
    })
  },
}
