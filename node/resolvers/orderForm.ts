import { adjustItems } from './items'

export const queries = {
  orderForm: async (_: any, __: any, ctx: Context): Promise<OrderForm> => {
    const {
      clients: { checkout, storeGraphQL },
    } = ctx

    const orderForm = await checkout.orderForm()

    return {
      ...orderForm,
      items: await adjustItems(orderForm.items, storeGraphQL),
    }
  },
}
