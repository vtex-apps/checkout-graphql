import { AddressType, DELIVERY, PICKUP_IN_POINT } from '../constants'

export function getSelectedAddress(selectedAddresses: CheckoutAddress[]) {
  return selectedAddresses.find((address: CheckoutAddress) => {
    const isPickup = address.addressType === AddressType.PICKUP
    const isInStore = address.addressType === AddressType.INSTORE

    return !isPickup && !isInStore
  })
}

export function addressHasGeocoordinates(address: CheckoutAddress) {
  return address?.geoCoordinates && address.geoCoordinates.length > 0
}

export function filterDeliveryOptions(
  deliveryOptions: SLA[],
  logisticsInfo: LogisticsInfo[]
) {
  return deliveryOptions.filter(deliveryOption => {
    const deliveryOptionIsInEveryLogisticsInfo = logisticsInfo.every(
      (li: LogisticsInfo) => li.slas.some(sla => sla.id === deliveryOption.id)
    )

    return (
      (deliveryOption.deliveryChannel === DELIVERY ||
        deliveryOption.deliveryChannel === PICKUP_IN_POINT) &&
      deliveryOption.availableDeliveryWindows.length === 0 &&
      deliveryOptionIsInEveryLogisticsInfo
    )
  })
}
