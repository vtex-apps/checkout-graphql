export const queries = {
  cart: async (_: any, __: any, ctx: Context) => {
    const { clients: { checkout } } = ctx
    const orderForm = await checkout.orderForm()
    return {
      items: orderForm.items,
      storePreferencesData: orderForm.storePreferencesData,
    }
  },
}

export const mutations = {
  updateItems: async (_: any, { orderItems }: { orderItems: ItemInput[]}, ctx: Context) => {
    const { clients: { checkout }, vtex: { orderFormId } } = ctx
    const orderForm = await checkout.updateItems(orderFormId!, orderItems)
    return {
      items: orderForm.items,
    }
  },
}
