import shippingEstimate from '@vtex/estimate-calculator'

const ESTIMATE_TYPES = {
  'm': 'MINUTE',
  'h': 'HOUR',
  'd': 'DAY',
  'bd': 'BUSINESS_DAY',
}

interface ParentObj {
  estimate: String
  shippingEstimate: String
}

export default function resolver(parentObj: ParentObj) {
  const estimate = parentObj.estimate || parentObj.shippingEstimate
  if (!estimate) return null

  const value = shippingEstimate.getShippingEstimateQuantity(estimate)
  const type = shippingEstimate.getShippingEstimateUnit(estimate)

  return {
    value,
    type: ESTIMATE_TYPES[type],
  }
}