import { getShippingInfo } from '../utils/shipping'

export const queries = {
  shippingSLA: async (_: any, args: any, ctx: Context) => {
    const { checkout } = ctx.clients
    const shippingData = (await checkout.simulation(
      args
    )) as CheckoutOrderForm['shippingData']

    // Here we mock an Order Form object to use getShippingInfo
    const orderForm = {
      orderFormId: '',
      value: 0,
      shippingData: {
        ...shippingData,
        selectedAddresses: [],
      },
      totalizers: [],
    } as Pick<
      CheckoutOrderForm,
      'shippingData' | 'totalizers' | 'orderFormId' | 'value'
    >

    return getShippingInfo({ clients: ctx.clients, orderForm })
  },
}
