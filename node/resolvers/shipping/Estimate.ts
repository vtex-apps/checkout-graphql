import shippingEstimate from '@vtex/estimate-calculator'

const ESTIMATE_TYPES = {
  'm': 'MINUTE',
  'h': 'HOUR',
  'd': 'DAY',
  'bd': 'BUSINESS_DAY',
}

interface ParentObj {
  estimate: String
}

export default function resolver(parentObj: ParentObj) {
  if (!parentObj.estimate) return null

  const value = shippingEstimate.getShippingEstimateQuantity(parentObj.estimate)
  const type = shippingEstimate.getShippingEstimateUnit(parentObj.estimate)

  return {
    value,
    type: ESTIMATE_TYPES[type],
  }
}