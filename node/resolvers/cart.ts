export const queries = {
  cart: async (root, args, ctx) => {
    const { dataSources: { checkout } } = ctx
    ctx.orderForm = await checkout.orderForm()
  
    return {
      ...ctx.orderForm,
    }
  }
}

export const resolvers = {
  Cart: {
    // Return non nullable value, so its field resolvers do their work
    shipping: () => ({}),
  }
}