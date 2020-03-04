import { getShippingData, selectDeliveryOption } from './utils/shipping'

export const estimateShippingMutation = async (
  _: unknown,
  { address }: { address: CheckoutAddress },
  ctx: Context
) => {
  const {
    clients,
    vtex: { orderFormId },
  } = ctx
  const { checkout, shipping } = clients

  const orderForm = await checkout.orderForm()
  const logisticsInfo =
    orderForm.shippingData && orderForm.shippingData.logisticsInfo
  const shippingData = getShippingData(address, logisticsInfo)

  const newOrderForm = await shipping.shippingAttachmentRequest(
    orderFormId!,
    shippingData
  )

  return newOrderForm
}

export const selectDeliveryOptionMutation = async (
  _: unknown,
  { deliveryOptionId }: { deliveryOptionId: string },
  ctx: Context
) => {
  const {
    clients,
    vtex: { orderFormId },
  } = ctx
  const { checkout, shipping } = clients

  const orderForm = await checkout.orderForm()
  const newShippingData = selectDeliveryOption({
    deliveryOptionId,
    shippingData: orderForm.shippingData,
  })

  const newOrderForm = await shipping.shippingAttachmentRequest(
    orderFormId!,
    newShippingData
  )

  return newOrderForm
}
