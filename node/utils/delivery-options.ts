export function getFormattedDeliveryOptions(
  deliveryOptions: SLA[],
  logisticsInfo: LogisticsInfo[] | null
) {
  return deliveryOptions.map((sla: SLA) => {
    let price = 0

    const isSelected = logisticsInfo
      ? logisticsInfo.some((li: LogisticsInfo) => li.selectedSla === sla.id)
      : false

    if (logisticsInfo) {
      logisticsInfo.forEach((li: LogisticsInfo) => {
        const currentSla = li.slas.find(liSla => liSla.id === sla.id)

        if (currentSla) {
          price += currentSla.price
        }
      })
    }

    return {
      estimate: sla.shippingEstimate,
      id: sla.id,
      isSelected,
      price,
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
