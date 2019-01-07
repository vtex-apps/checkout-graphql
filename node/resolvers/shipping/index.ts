import Parcel from './Parcel'
import Addresses from './Addresses'
import ShippingOptions from './ShippingOptions'
import Estimate from './Estimate'
import Price from '../Price'

const resolverMap = {
  Shipping: {
    addresses: Addresses,
    options: ShippingOptions,
    parcels: Parcel,
  },
  DeliveryOption: {
    price: Price,
    estimate: Estimate,
  },
  ShippingOption: {
    __resolveType: (shippingOption, context, info) => {
      return 'DeliveryOption'
    },
  },
}

export default resolverMap