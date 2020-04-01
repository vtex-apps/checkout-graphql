import { AddressType, DELIVERY } from '../constants'

export function getSelectedDeliveryAddress(
  selectedAddresses: CheckoutAddress[]
) {
  return selectedAddresses.find((address: CheckoutAddress) => {
    const isCommercial = address.addressType === AddressType.COMMERCIAL
    const isResidential = address.addressType === AddressType.RESIDENTIAL
    const iGiftRegistry = address.addressType === AddressType.GIFT_REGISTRY

    return isCommercial || isResidential || iGiftRegistry
  })
}

export function addressHasGeocoordinates(address: CheckoutAddress) {
  return address?.geoCoordinates && address.geoCoordinates.length > 0
}

export function filterDeliveryOptions(
  deliveryOptions: SLA[],
  logisticsInfo: LogisticsInfo[]
) {
  return deliveryOptions.filter((deliveryOption: SLA) => {
    const deliveryOptionIsInEveryLogisticsInfo =
      logisticsInfo &&
      logisticsInfo.length > 0 &&
      logisticsInfo.every((li: LogisticsInfo) =>
        li.slas.some(sla => sla.id === deliveryOption.id)
      )

    return (
      deliveryOption.deliveryChannel === DELIVERY &&
      deliveryOption.availableDeliveryWindows.length === 0 &&
      deliveryOptionIsInEveryLogisticsInfo
    )
  })
}
