import {  getShippingInfo } from "../utils/shipping"

export const queries = {
  shippingSLA: async (_: any, args: any, ctx: Context) => {
    const checkout = ctx.clients.checkout
    const shippingData = await checkout.simulation(args) as CheckoutOrderForm['shippingData']

    // Here we mock an Order Form object to use getShippingInfo
    const orderForm = {
      orderFormId: '',
      shippingData: {
        ...shippingData,
        selectedAddresses: []
      },
      totalizers: []
    } as unknown as CheckoutOrderForm

    return await getShippingInfo({ clients: ctx.clients, orderForm})
  },
}