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
  const { checkout, searchGraphQL, shipping } = clients

  const newMessages = fillMessages(messages)

  if (messages.length) {
    checkout.clearMessages(orderFormId)
  }

  return {
    id: newOrderForm.orderFormId,
    canEditData: newOrderForm.canEditData,
    items: await adjustItems(platform, newOrderForm.items, searchGraphQL),
    marketingData: newOrderForm.marketingData,
    messages: newMessages,
    shipping: getShippingInfo({
      orderForm: newOrderForm,
      shipping,
    }),
    totalizers: newOrderForm.totalizers,
    value: newOrderForm.value,
    paymentData: newOrderForm.paymentData,
  }
}

export const queries = {
  orderForm: async (
    _: unknown,
    __: unknown,
    ctx: Context
  ): Promise<OrderForm> => {
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

export const mutations = {
  updateOrderFormProfile: async (
    _: unknown,
    { email }: { email: string },
    ctx: Context
  ): Promise<OrderForm> => {
    const {
      clients: { checkout },
      vtex: { orderFormId },
    } = ctx

    const orderFormWithProfile = await checkout.updateOrderFormProfile(
      orderFormId!,
      { email }
    )

    return orderFormWithProfile
  },
}
