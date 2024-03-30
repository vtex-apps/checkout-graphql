import { PICKUP_IN_POINT } from '../constants/index'

export function getFormattedDeliveryOptions(
  deliveryOptions: SLA[],
  logisticsInfo: LogisticsInfo[] | null
) {
  return deliveryOptions.map(sla => {
    let price = 0
    let tax = 0

    const isSelected =
      logisticsInfo?.some(li => li.selectedSla === sla.id) ?? false

    logisticsInfo?.forEach(li => {
      const currentSla = li.slas.find(liSla => liSla.id === sla.id)

      if (currentSla) {
        price += currentSla.price
        tax += currentSla.tax
      }
    })

    return {
      estimate: sla.shippingEstimate,
      id: sla.id,
      isSelected,
      price,
      tax,
      deliveryChannel: sla.deliveryChannel,
      sla,
      ...(sla.deliveryChannel === PICKUP_IN_POINT
        ? { pickupPointId: sla.pickupPointId }
        : {}),
    }
  })
}

export function hasDeliveryOption(
  deliveryOptions: SLA[],
  deliveryOptionId: string
) {
  return deliveryOptions.some(
    (deliveryOption: SLA) => deliveryOption.id === deliveryOptionId
  )
}
