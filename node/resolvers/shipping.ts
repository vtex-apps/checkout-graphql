import { getShippingData, selectDeliveryOption } from '../utils/shipping'

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
      shippingData
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
      newShippingData
    )

    return newOrderForm
  },
}
