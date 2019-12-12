import { Clients } from '../clients'
import { adjustItems } from './items'
import { fillMessages } from './messages'
import { getShippingInfo } from './shipping/utils/shipping'

export const getNewOrderForm = async ({
  clients,
  newOrderForm,
  platform,
}: {
  clients: Clients
  newOrderForm: CheckoutOrderForm
  platform: string
}) => {
  const { orderFormId, messages } = newOrderForm
  const { checkout, searchGraphQL } = clients

  const newMessages = fillMessages(messages)

  if (messages.length) {
    checkout.clearMessages(orderFormId)
  }

  return {
    canEditData: newOrderForm.canEditData,
    items: await adjustItems(platform, newOrderForm.items, searchGraphQL),
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
      clients,
      vtex: { platform },
    } = ctx

    const newOrderForm = await clients.checkout.orderForm()

    return getNewOrderForm({
      clients,
      newOrderForm,
      platform,
    })
  },
}
