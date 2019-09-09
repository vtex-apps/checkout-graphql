import { StoreGraphQL } from '../clients/storeGraphQL'
import { adjustItems } from './items'
import { getShippingInfo } from './shipping'
import { getMarketingData } from './coupon'

export const getLastOrderFormMessage = (messages: any[]) => {
  const lastMessage = messages.length
    ? messages.pop()
    : { status: '', text: '' }

  return lastMessage
}

export const getNewOrderForm = async ({
  newOrderForm,
  storeGraphQL,
}: {
  newOrderForm: CheckoutOrderForm
  storeGraphQL: StoreGraphQL
}) => {
  return {
    items: await adjustItems(newOrderForm.items, storeGraphQL),
    marketingData: getMarketingData(newOrderForm),
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
