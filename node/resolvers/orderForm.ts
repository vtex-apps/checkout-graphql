import { Checkout } from '../clients/checkout'
import { SearchGraphQL } from '../clients/searchGraphQL'
import { adjustItems } from './items'
import { fillMessages } from './messages'
import { getShippingInfo } from './shipping/utils/shipping'

export const getNewOrderForm = async ({
  checkout,
  newOrderForm,
  searchGraphQL,
}: {
  checkout: Checkout
  newOrderForm: CheckoutOrderForm
  searchGraphQL: SearchGraphQL
}) => {
  const { orderFormId, messages } = newOrderForm

  const newMessages = fillMessages(messages)

  if (messages.length) {
    checkout.clearMessages(orderFormId)
  }

  return {
    items: await adjustItems(newOrderForm.items, searchGraphQL),
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
      clients: { checkout, searchGraphQL },
    } = ctx

    const newOrderForm = await checkout.orderForm()

    return getNewOrderForm({
      checkout,
      newOrderForm,
      searchGraphQL,
    })
  },
}
