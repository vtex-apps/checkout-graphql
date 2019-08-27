export const mutations = {
  insertCoupon: async (_: any, args: any, ctx: Context) => {
    const {
      clients: { checkout },
      vtex: { orderFormId },
    } = ctx
    const orderForm = await checkout.insertCoupon(orderFormId!, args.text)

    return { code: orderForm!.marketingData!.coupon! }
  },
}
