import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import { getNewOrderForm } from './orderForm'

const getShippingData = (
  address: AddressInput,
  logisticsInfo: LogisticsInfo[]
) => {
  const selectedAddresses = [address]
  const hasGeocoordinates =
    address && address.geoCoordinates && address.geoCoordinates.length > 0
  const logisticsInfoWithAddress = logisticsInfo.map((li: LogisticsInfo) => ({
    ...li,
    addressId: address.addressId,
  }))

  const requestPayload = {
    logisticsInfo: logisticsInfoWithAddress,
    selectedAddresses,
    ...(hasGeocoordinates ? { clearAddressIfPostalCodeNotFound: false } : {}),
  }

  return requestPayload
}

export const getShippingInfo = (orderForm: CheckoutOrderForm) => {
  const logisticsInfo =
    orderForm.shippingData && orderForm.shippingData.logisticsInfo

  const countries = uniq(
    flatten(logisticsInfo ? logisticsInfo.map(item => item.shipsTo) : [])
  )
  const selectedAddress =
    (orderForm.shippingData && orderForm.shippingData.selectedAddresses[0]) ||
    {}
  const deliveryOptions = uniq(
    flatten(logisticsInfo ? logisticsInfo.map(item => item.slas) : [])
  )

  const updatedDeliveryOptions = deliveryOptions.map(sla => {
    let price = sla.price

    const isSelected = logisticsInfo.some(li => li.selectedSla === sla.id)

    logisticsInfo.forEach((li: LogisticsInfo) => {
      const currentSla = li.slas.find(liSla => liSla.id === sla.id)

      if (currentSla) {
        price += currentSla.price
      }
    })

    return {
      estimate: sla.shippingEstimate,
      id: sla.id,
      isSelected,
      price,
    }
  })

  return {
    countries,
    deliveryOptions: updatedDeliveryOptions,
    selectedAddress,
  }
}

export const mutations = {
  estimateShipping: async (
    _: any,
    { address }: { address: AddressInput },
    ctx: Context
  ) => {
    const {
      clients: { checkout, shipping, storeGraphQL },
      vtex: { orderFormId },
    } = ctx

    const orderForm = await checkout.orderForm()
    const logisticsInfo =
      orderForm.shippingData && orderForm.shippingData.logisticsInfo
    const shippingData = getShippingData(address, logisticsInfo)

    const newOrderForm = await shipping.estimateShipping(
      orderFormId!,
      shippingData
    )

    return getNewOrderForm({
      checkout,
      newOrderForm,
      storeGraphQL,
    })
  },
}
