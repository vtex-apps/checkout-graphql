import { isPickup } from '@vtex/delivery-packages/dist/delivery-channel'
import {
  getLeanShippingOptions,
  getOptionsDetails,
} from '@vtex/lean-shipping-calculator'

import { CHEAPEST, FASTEST } from './constants'

export default function optionsResolver(root, args, ctx) {
  const orderForm = ctx.orderForm

  if (!orderForm.shippingData) {
    return null
  }

  return {
    delivery: getDeliveryOptions(orderForm),
    pickups: orderForm.shippingData.pickupPoints.map(mapPickupPoint)
  }
}

function mapPickupPoint(pickupPoint) {
  return {
    id: pickupPoint.id,
    name: pickupPoint.friendlyName,
    additionalInfo: pickupPoint.additionalInfo,
    address: pickupPoint.address,
    businessHours: pickupPoint.businessHours,
  }
}

function getDeliveryOptions(orderForm) {
  const logisticsInfo = orderForm.shippingData.logisticsInfo || []

  const deliveryOptions = getLeanShippingOptions({ logisticsInfo })
  const deliveryOptionsDetails = getOptionsDetails({
    ...(deliveryOptions.cheapest ?
      { [CHEAPEST]: deliveryOptions.cheapest }
      : {}
    ),
    ...(deliveryOptions.fastest ?
      { [FASTEST]: deliveryOptions.fastest }
      : {}
    ),
  })

  return {
    cheapest: mapLeanShippingOption(
      deliveryOptionsDetails.find((option) => option.id === CHEAPEST),
    ),
    fastest: mapLeanShippingOption(
      deliveryOptionsDetails.find((option) => option.id === FASTEST),
    ),
  }
}

function mapLeanShippingOption(option) {
  if (!option) return null

  return {
    numberOfParcels: option.packagesLength,
    price: option.price,
    estimate: option.shippingEstimate,
  }
}