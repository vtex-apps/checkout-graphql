import {
  estimateShippingMutation,
  selectDeliveryOptionMutation,
} from './mutations'

export const mutations = {
  estimateShipping: estimateShippingMutation,
  selectDeliveryOption: selectDeliveryOptionMutation,
}

enum AddressType {
  residential = 'residential',
  commercial = 'commercial',
  inStore = 'inStore',
  giftRegistry = 'giftRegistry',
  pickup = 'pickup',
  search = 'search',
}

const addressTypes = new Set<string>([
  AddressType.commercial,
  AddressType.giftRegistry,
  AddressType.inStore,
  AddressType.pickup,
  AddressType.residential,
  AddressType.search,
])

export const Address = {
  addressType: ({ addressType }: CheckoutAddress) => {
    if (addressTypes.has(addressType)) {
      return addressType as AddressType
    }

    return null
  },
}
