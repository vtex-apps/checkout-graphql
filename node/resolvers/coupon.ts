import { getNewOrderForm, getLastOrderFormMessage } from './orderForm'

export const getMarketingData = (orderForm: any) => {
  const newMarketingData = orderForm.marketingData || { coupon: '' }

  return {
    ...newMarketingData,
    message: getLastOrderFormMessage(orderForm.messages),
  }
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
