import { adjustItems } from "./items"
import { getShippingInfo } from "./shipping"

export const getNewOrderForm = async ({
  newOrderForm,
  items,
  shipping,
  storeGraphQL,
}: {
  newOrderForm: CheckoutOrderForm
  items?: OrderFormItem[]
  shipping?: Shipping
  storeGraphQL: any
}) => {
  return {
    items: items || (await adjustItems(newOrderForm.items, storeGraphQL)),
    marketingData: newOrderForm.marketingData,
    shipping: shipping || getShippingInfo(newOrderForm),
    totalizers: newOrderForm.totalizers,
    value: newOrderForm.value,
  }
}

export const queries = {
  orderForm: async (_: any, __: any, ctx: Context): Promise<OrderForm> => {
    const {
      clients: { checkout, storeGraphQL },
    } = ctx

    const orderForm = await checkout.orderForm()

    return getNewOrderForm({
      items: await adjustItems(orderForm.items, storeGraphQL),
      newOrderForm: orderForm,
      shipping: getShippingInfo(orderForm),
      storeGraphQL,
    })
  },
}
