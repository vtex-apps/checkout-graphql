import { StoreGraphQL } from '../clients/storeGraphQL'
import { adjustItems } from './items'
import { getShippingInfo } from './shipping'

export const getNewOrderForm = async ({
  newOrderForm,
  storeGraphQL,
}: {
  newOrderForm: CheckoutOrderForm
  storeGraphQL: StoreGraphQL
}) => {
  return {
    items: await adjustItems(newOrderForm.items, storeGraphQL),
    marketingData: newOrderForm.marketingData,
    shipping: getShippingInfo(newOrderForm),
    totalizers: newOrderForm.totalizers,
    value: newOrderForm.value,
  }
}

export const queries = {
  orderForm: async (_: any, __: any, ctx: Context): Promise<OrderForm> => {
    const {
      clients: { checkout, storeGraphQL },
    } = ctx

    const newOrderForm = await checkout.orderForm()

    return getNewOrderForm({
      newOrderForm,
      storeGraphQL,
    })
  },
}
