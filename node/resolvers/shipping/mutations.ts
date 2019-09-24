import { getNewOrderForm } from '../orderForm'
import { getShippingData, selectDeliveryOption } from './utils/shipping'

export const estimateShippingMutation = async (
  _: any,
  { address }: { address: CheckoutAddress },
  ctx: Context
) => {
  const {
    clients: { checkout, shipping, searchGraphQL },
    vtex: { orderFormId },
  } = ctx

  const orderForm = await checkout.orderForm()
  const logisticsInfo =
    orderForm.shippingData && orderForm.shippingData.logisticsInfo
  const shippingData = getShippingData(address, logisticsInfo)

  const newOrderForm = await shipping.shippingAttachmentRequest(
    orderFormId!,
    shippingData
  )

  return getNewOrderForm({
    checkout,
    newOrderForm,
    searchGraphQL,
  })
}

export const selectDeliveryOptionMutation = async (
  _: any,
  { deliveryOptionId }: { deliveryOptionId: string },
  ctx: Context
) => {
  const {
    clients: { checkout, shipping, searchGraphQL },
    vtex: { orderFormId },
  } = ctx

  const orderForm = await checkout.orderForm()
  const newShippingData = selectDeliveryOption({
    deliveryOptionId,
    shippingData: orderForm.shippingData,
  })

  const newOrderForm = await shipping.shippingAttachmentRequest(
    orderFormId!,
    newShippingData
  )

  return getNewOrderForm({
    checkout,
    newOrderForm,
    searchGraphQL,
  })
}
