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

  const shippingData = orderForm.shippingData
  const logisticsInfo = shippingData.logisticsInfo || []

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
    delivery: {
      cheapest: mapLeanShippingOption(
        deliveryOptionsDetails.find((option) => option.id === CHEAPEST),
        orderForm,
      ),
      fastest: mapLeanShippingOption(
        deliveryOptionsDetails.find((option) => option.id === FASTEST),
        orderForm,
      ),
    }
  }
}

function mapLeanShippingOption(option, orderForm) {
  if (!option) return null

  return {
    numberOfParcels: option.packagesLength,
    price: option.price,
    estimate: option.shippingEstimate,
  }
}