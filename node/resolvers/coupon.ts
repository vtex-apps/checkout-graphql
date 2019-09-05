import { getNewOrderForm } from './orderForm'

export const getMarketingData = (marketingData: any) => {
  return marketingData || { coupon: '' }
}

export const mutations = {
  insertCoupon: async (_: any, args: any, ctx: Context) => {
    const {
      clients: { checkout, storeGraphQL },
      vtex: { orderFormId },
    } = ctx
    const newOrderForm = await checkout.insertCoupon(orderFormId!, args.text)

    return getNewOrderForm({
      newOrderForm,
      storeGraphQL,
    })
  },
}
