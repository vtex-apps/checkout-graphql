export const queries = {
  shippingSLA: (_: any, args: any, ctx: Context) => {
    const checkout = ctx.clients.checkout
    return checkout.simulation(args)
  },
}