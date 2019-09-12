import { StoreGraphQL } from '../clients/storeGraphQL'
import { Checkout } from '../clients/checkout'
import { adjustItems } from './items'
import { getShippingInfo } from './shipping'
import { fillMessages } from './messages'

export const getNewOrderForm = async ({
  newOrderForm,
  checkout,
  storeGraphQL,
}: {
  newOrderForm: CheckoutOrderForm
  checkout: Checkout
  storeGraphQL: StoreGraphQL
}) => {
  const { orderFormId, messages } = newOrderForm

  const newMessages = fillMessages(messages)

  if (messages.length) {
    checkout.clearMessages(orderFormId)
  }

  return {
    items: await adjustItems(newOrderForm.items, storeGraphQL),
    shipping: getShippingInfo(newOrderForm),
    totalizers: newOrderForm.totalizers,
    value: newOrderForm.value,
    marketingData: newOrderForm.marketingData,
    messages: newMessages,
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
      checkout,
      storeGraphQL,
    })
  },
}
