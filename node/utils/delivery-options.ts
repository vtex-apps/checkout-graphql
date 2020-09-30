export function getFormattedDeliveryOptions(
  deliveryOptions: SLA[],
  logisticsInfo: LogisticsInfo[] | null
) {
  return deliveryOptions.map(sla => {
    let price = 0

    const isSelected =
      logisticsInfo?.some(li => li.selectedSla === sla.id) ?? false

    logisticsInfo?.forEach(li => {
      const currentSla = li.slas.find(liSla => liSla.id === sla.id)

      if (currentSla) {
        price += currentSla.price
      }
    })

    return {
      estimate: sla.shippingEstimate,
      id: sla.id,
      isSelected,
      price,
      deliveryChannel: sla.deliveryChannel,
      sla,
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
