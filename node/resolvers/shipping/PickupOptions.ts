import { getLatestSla } from '@vtex/estimate-calculator'

interface PickupOption {
  shippingEstimate: string
  price: number
  id: string
}

export default function resolver(parentObj, args, ctx) : PickupOption[] {
  const pickupPointId = parentObj.id
  const logisticsInfo = ctx.orderForm.shippingData.logisticsInfo

  const pickupOptions : Record<string,PickupOption> = logisticsInfo.reduce((acc, li) => {
    const pickupSlas = li.slas.filter(sla => sla.pickupPointId === pickupPointId)

    return pickupSlas.reduce((acc, sla) => {
      if (acc[sla.id]) {
        const { shippingEstimate } = getLatestSla([sla, acc[sla.id]])

        return {
          ...acc,
          [sla.id]: {
            ...acc[sla.id],
            shippingEstimate,
            price: acc[sla.id].price + sla.price,
            tax: acc[sla.id].tax + sla.tax,
          }
        }
      }

      return {
        ...acc,
        [sla.id]: sla,
      }
    }, acc)
  }, {})

  return Object.values(pickupOptions)
}