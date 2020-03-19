import { prop, propOr } from 'ramda'

import { adjustItems } from './items'
import { fillMessages } from './messages'
import { getShippingInfo } from './shipping/utils/shipping'

export const root = {
  OrderForm: {
    id: prop('orderFormId'),
    marketingData: propOr({}, 'marketingData'),
    messages: (orderForm: CheckoutOrderForm, _: unknown, ctx: Context) => {
      const {
        clients: { checkout },
      } = ctx

      const newMessages = fillMessages(orderForm.messages)

      if (orderForm.messages) {
        checkout.clearMessages(orderForm.orderFormId)
      }

      return newMessages
    },
    items: (orderForm: CheckoutOrderForm, _: unknown, ctx: Context) => {
      const {
        clients: { searchGraphQL },
        vtex: { platform },
      } = ctx

      return adjustItems(platform, orderForm.items, searchGraphQL)
    },
    shipping: (orderForm: CheckoutOrderForm, _: unknown, ctx: Context) => {
      return getShippingInfo({ orderForm, shipping: ctx.clients.shipping })
    },
  },
}

export const queries = {
  orderForm: async (
    _: unknown,
    __: unknown,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const { clients } = ctx

    const newOrderForm = await clients.checkout.orderForm()

    return newOrderForm
  },
}

interface MutationUpdateOrderFormProfileArgs {
  input: UserProfileInput
}

interface MutationUpdateClientPreferencesDataArgs {
  input: ClientPreferencesDataInput
}

export const mutations = {
  updateOrderFormProfile: async (
    _: unknown,
    { input }: MutationUpdateOrderFormProfileArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients: { checkout },
      vtex: { orderFormId },
    } = ctx

    const orderFormWithProfile = await checkout.updateOrderFormProfile(
      orderFormId!,
      input
    )

    return orderFormWithProfile
  },
  updateClientPreferencesData: async (
    _: unknown,
    { input }: MutationUpdateClientPreferencesDataArgs,
    ctx: Context
  ) => {
    const {
      clients: { checkout },
      vtex: { orderFormId },
    } = ctx

    const updatedOrderForm = await checkout.updateOrderFormClientPreferencesData(
      orderFormId!,
      input
    )

    return updatedOrderForm
  },
}
