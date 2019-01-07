import parcelify from '@vtex/delivery-packages'
import { isPickup } from '@vtex/delivery-packages/dist/delivery-channel'
import { hasDeliveryWindows } from '@vtex/delivery-packages/dist/sla'

export default function resolver(root, args, ctx) {
  const orderForm = ctx.orderForm

  if (!orderForm.shippingData) {
    return null
  }

  const parcels = parcelify(orderForm)

  return parcels.map(parcel => {
    return {
      address: parcel.address,
      items: parcel.items,
      pickupName: parcel.pickupFriendlyName,
      selectedOption: getSelectedOption(orderForm, parcel),
      seller: orderForm.sellers.find(seller => seller.id === parcel.seller),
    }
  })
}

function getSelectedOption(orderForm, parcel) {
  const scheduledParams = hasDeliveryWindows(parcel.selectedSlaObj)
    ? { selectedTimeFrame: null, timeFrames: [] }
    : { selectedTimeFrame: null, timeFrames: [] }

  return {
    ...(isPickup(parcel) ? { id: parcel.selectedSla } : {}),
    ...scheduledParams,
    price: parcel.price,
    estimate: parcel.shippingEstimate,
  }
}
