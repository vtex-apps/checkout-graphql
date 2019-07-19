export const queries = {
  cart: async (_: any, __: any, ctx: Context) => {
    const { clients: { checkout } } = ctx
    const orderForm = await checkout.orderForm()
    return {
      id: orderForm.orderFormId,
    }
  },
}