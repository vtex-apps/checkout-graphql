import { Checkout } from '../clients/checkout'
import { StoreGraphQL } from '../clients/storeGraphQL'
import { adjustItems } from './items'
import { fillMessages } from './messages'
import { getShippingInfo } from './shipping'

export const getNewOrderForm = async ({
  checkout,
  newOrderForm,
  storeGraphQL,
}: {
  checkout: Checkout
  newOrderForm: CheckoutOrderForm
  storeGraphQL: StoreGraphQL
}) => {
  const { orderFormId, messages } = newOrderForm

  const newMessages = fillMessages(messages)

  if (messages.length) {
    checkout.clearMessages(orderFormId)
  }

  return {
    items: await adjustItems(newOrderForm.items, storeGraphQL),
    marketingData: newOrderForm.marketingData,
    messages: newMessages,
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
      checkout,
      newOrderForm,
      storeGraphQL,
    })
  },
}
