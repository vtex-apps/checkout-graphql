import {
  getShippingData,
  selectShippingOption,
  selectAddress,
} from '../utils/shipping'
import { AddressType, DELIVERY, PICKUP_IN_POINT } from '../constants'
import { OrderFormIdArgs } from '../utils/args'

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
    args: { address: CheckoutAddress } & OrderFormIdArgs,
    ctx: Context
  ) => {
    const { clients, vtex } = ctx
    const { checkout } = clients
    const { orderFormId = vtex.orderFormId, address } = args

    const orderForm = await checkout.orderForm(orderFormId!)
    const logisticsInfo =
      orderForm.shippingData && orderForm.shippingData.logisticsInfo
    const shippingData = getShippingData(address, logisticsInfo)

    const newOrderForm = await checkout.updateOrderFormShipping(orderFormId!, {
      ...shippingData,
      clearAddressIfPostalCodeNotFound: false,
    })

    return newOrderForm
  },

  selectDeliveryOption: async (
    _: unknown,
    args: { deliveryOptionId: string } & OrderFormIdArgs,
    ctx: Context
  ) => {
    const { clients, vtex } = ctx
    const { checkout } = clients
    const { orderFormId = vtex.orderFormId, deliveryOptionId } = args

    const orderForm = await checkout.orderForm(orderFormId!)
    const newShippingData = selectShippingOption({
      slaId: deliveryOptionId,
      shippingData: orderForm.shippingData,
      deliveryChannel: DELIVERY,
    })

    const newOrderForm = await checkout.updateOrderFormShipping(orderFormId!, {
      ...newShippingData,
      clearAddressIfPostalCodeNotFound: false,
    })

    return newOrderForm
  },

  selectPickupOption: async (
    _: unknown,
    args: { pickupOptionId: string, itemId: string } & OrderFormIdArgs,
    ctx: Context
  ) => {
    const { clients, vtex } = ctx
    const { checkout } = clients
    const { orderFormId = vtex.orderFormId, pickupOptionId, itemId } = args

    const orderForm = await checkout.orderForm(orderFormId!)
    const newShippingData = selectShippingOption({
      slaId: pickupOptionId,
      itemId,
      shippingData: orderForm.shippingData,
      deliveryChannel: PICKUP_IN_POINT,
    })

    const newOrderForm = await checkout.updateOrderFormShipping(orderFormId!, {
      ...newShippingData,
      clearAddressIfPostalCodeNotFound: false,
    })

    return newOrderForm
  },

  updateSelectedAddress: async (
    _: unknown,
    args: { input: CheckoutAddress } & OrderFormIdArgs,
    ctx: Context
  ) => {
    const {
      clients: { checkout },
      vtex,
    } = ctx
    const { orderFormId = vtex.orderFormId, input } = args

    const orderForm = await checkout.orderForm(orderFormId!)

    const newShippingData = selectAddress({
      address: input,
      shippingData: orderForm.shippingData,
    })

    const newOrderForm = await checkout.updateOrderFormShipping(orderFormId!, {
      ...newShippingData,
      clearAddressIfPostalCodeNotFound: false,
    })

    return newOrderForm
  },
}
