import {
  getShippingData,
  selectDeliveryOption,
  selectAddress,
} from '../utils/shipping'
import { AddressType } from '../constants'

const addressTypes = new Set<string>([
  AddressType.COMMERCIAL,
  AddressType.GIFT_REGISTRY,
  AddressType.INSTORE,
  AddressType.PICKUP,
  AddressType.RESIDENTIAL,
  AddressType.SEARCH,
])

export const root = {
  Address: {
    addressType: ({ addressType }: CheckoutAddress) => {
      if (addressTypes.has(addressType)) {
        return addressType as AddressType
      }

      return null
    },
  },
}

export const mutations = {
  estimateShipping: async (
    _: unknown,
    { address }: { address: CheckoutAddress },
    ctx: Context
  ) => {
    const {
      clients,
      vtex: { orderFormId },
    } = ctx
    const { checkout } = clients

    const orderForm = await checkout.orderForm()
    const logisticsInfo =
      orderForm.shippingData && orderForm.shippingData.logisticsInfo
    const shippingData = getShippingData(address, logisticsInfo)

    const newOrderForm = await checkout.updateOrderFormShipping(
      orderFormId!,
      {
        ...shippingData,
        clearAddressIfPostalCodeNotFound: false,
      },
    )

    return newOrderForm
  },

  selectDeliveryOption: async (
    _: unknown,
    { deliveryOptionId }: { deliveryOptionId: string },
    ctx: Context
  ) => {
    const {
      clients,
      vtex: { orderFormId },
    } = ctx
    const { checkout } = clients

    const orderForm = await checkout.orderForm()
    const newShippingData = selectDeliveryOption({
      deliveryOptionId,
      shippingData: orderForm.shippingData,
    })

    const newOrderForm = await checkout.updateOrderFormShipping(
      orderFormId!,
      {
        ...newShippingData,
        clearAddressIfPostalCodeNotFound: false,
      },
    )

    return newOrderForm
  },

  updateSelectedAddress: async (
    _: unknown,
    { input }: { input: CheckoutAddress },
    ctx: Context
  ) => {
    const {
      clients: { checkout },
      vtex: { orderFormId },
    } = ctx

    const orderForm = await checkout.orderForm()

    const newShippingData = selectAddress({
      address: input,
      shippingData: orderForm.shippingData,
    })

    const newOrderForm = await checkout.updateOrderFormShipping(
      orderFormId!,
      {
        ...newShippingData,
        clearAddressIfPostalCodeNotFound: false,
      },
    )

    return newOrderForm
  },
}
