export const mutations = {
  insertCoupon: async (_: any, args: any, ctx: Context) => {
    const {
      clients,
      vtex: { orderFormId },
    } = ctx

    const newOrderForm = await clients.checkout.insertCoupon(
      orderFormId!,
      args.text
    )

    return newOrderForm
  },
}
