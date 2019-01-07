import Parcel from './Parcel'
import Addresses from './Addresses'
import ShippingOptions from './ShippingOptions'
import PickupOptions from './PickupOptions'
import Estimate from './Estimate'
import Price from '../Price'
import Seller from '../Seller'

const resolverMap = {
  Shipping: {
    addresses: Addresses,
    options: ShippingOptions,
    parcels: Parcel,
  },
  Parcel: {
    seller: Seller,
  },
  DeliveryOption: {
    price: Price,
    estimate: Estimate,
  },
  PickupOption: {
    price: Price,
    estimate: Estimate,
  },
  Pickup: {
    pickupOptions: PickupOptions,
  },
  ShippingOption: {
    __resolveType: (shippingOption, context, info) => {
      return 'DeliveryOption'
    },
  },
}

export default resolverMap