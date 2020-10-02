import {  getShippingInfoForSimulation } from "../utils/shipping"

export const queries = {
  shippingSLA: async (_: any, args: any, ctx: Context) => {
    const checkout = ctx.clients.checkout
    const simulationData = await checkout.simulation(args) as CheckoutOrderForm['shippingData']

    console.log({ simulationData })
    return getShippingInfoForSimulation(simulationData)
  },
}