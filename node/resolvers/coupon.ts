import { getNewOrderForm } from './orderForm'

export const getMarketingData = (orderForm: any) => {
  return orderForm.marketingData || { coupon: '' }
}

export const mutations = {
  insertCoupon: async (_: any, args: any, ctx: Context) => {
    const {
      clients: { checkout, storeGraphQL },
      vtex: { orderFormId },
    } = ctx
    const newOrderForm = await checkout.insertCoupon(orderFormId!, args.text)
    checkout.clearMessages(orderFormId!)

    return getNewOrderForm({
      newOrderForm,
      storeGraphQL,
    })
  },
}
