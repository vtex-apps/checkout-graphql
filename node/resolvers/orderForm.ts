import { StoreGraphQL } from '../clients/storeGraphQL'
import { adjustItems } from './items'
import { getShippingInfo } from './shipping'
import { fillMessages } from './messages'

export const getNewOrderForm = async ({
  newOrderForm,
  storeGraphQL,
}: {
  newOrderForm: CheckoutOrderForm
  storeGraphQL: StoreGraphQL
}) => {
  const { couponMessages } = fillMessages(newOrderForm)

  return {
    items: await adjustItems(newOrderForm.items, storeGraphQL),
    shipping: getShippingInfo(newOrderForm),
    totalizers: newOrderForm.totalizers,
    value: newOrderForm.value,
    couponMessages,
  }
}

export const queries = {
  orderForm: async (
    _: any,
    __: any,
    ctx: Context
  ): Promise<Partial<OrderForm>> => {
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
