export const queries = {}

export const mutations = {
  estimateShipping: async (_: any, address: AddressInput, ctx: Context) => {
    const { clients: { checkout, shipping } } = ctx

    const orderForm = await checkout.orderForm()
    const logisticsInfo = orderForm.shippingData && orderForm.shippingData.logisticsInfo
    const shippingData = getShippingData(address, logisticsInfo)

    const newOrderForm = await shipping.estimateShipping(orderForm.orderFormId, shippingData)

    return newOrderForm
  },
}

const getShippingData = (address: AddressInput, logisticsInfo: LogisticsInfo[]) => {
  const selectedAddresses = [address]
  const hasGeocoordinates = address && address.geoCoordinates && address.geoCoordinates.length > 0
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
