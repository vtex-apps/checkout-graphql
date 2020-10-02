import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'

import {
  addressHasGeocoordinates,
  filterDeliveryOptions,
  getSelectedDeliveryAddress,
} from './address'
import {
  getFormattedDeliveryOptions,
  hasDeliveryOption,
} from './delivery-options'
import { Clients } from '../clients'

export const getShippingData = (
  address: CheckoutAddress,
  logisticsInfo: LogisticsInfo[] | null
) => {
  const selectedAddresses = [address]
  const hasGeocoordinates = addressHasGeocoordinates(address)
  const logisticsInfoWithAddress =
    logisticsInfo?.map((li: LogisticsInfo) => ({
      ...li,
      addressId: address.addressId,
    })) ?? []

  const requestPayload = {
    logisticsInfo: logisticsInfoWithAddress,
    selectedAddresses,
    ...(hasGeocoordinates ? { clearAddressIfPostalCodeNotFound: false } : {}),
  }

  return requestPayload
}

export const selectDeliveryOption = ({
  shippingData,
  deliveryOptionId,
}: {
  shippingData: ShippingData
  deliveryOptionId: string
}) => {
  const logisticsInfoWithSelectedDeliveryOption = shippingData.logisticsInfo.map(
    (li: LogisticsInfo) => ({
      ...li,
      selectedSla: hasDeliveryOption(li.slas, deliveryOptionId)
        ? deliveryOptionId
        : li.selectedSla,
    })
  )

  const deliveryAddress = getSelectedDeliveryAddress(
    shippingData.selectedAddresses
  )

  if (!deliveryAddress) {
    return shippingData
  }

  return getShippingData(
    deliveryAddress,
    logisticsInfoWithSelectedDeliveryOption
  )
}

export const selectAddress = ({
  shippingData,
  address,
}: {
  shippingData: ShippingData
  address: CheckoutAddress
}): ShippingData => {
  return {
    ...shippingData,
    selectedAddresses: [address],
  }
}

export const getShippingInfo = async ({
  clients,
  orderForm,
}: {
  clients: Clients
  orderForm: CheckoutOrderForm
}) => {
  const logisticsInfo =
    orderForm.shippingData && orderForm.shippingData.logisticsInfo

  const countries = uniq(
    flatten(logisticsInfo ? logisticsInfo.map(item => item.shipsTo) : [])
  )

  const availableAddresses =
    (orderForm.shippingData && orderForm.shippingData.availableAddresses) || []

  const selectedAddress =
    orderForm.shippingData &&
    getSelectedDeliveryAddress(orderForm.shippingData.selectedAddresses)

  const availableItemsLogisticsInfo = logisticsInfo
    ? logisticsInfo.filter((item: LogisticsInfo) => item.slas.length)
    : []

  const deliveryOptions = uniqBy(
    flatten(
      availableItemsLogisticsInfo.map((item: LogisticsInfo) => item.slas)
    ),
    'id'
  )

  // Since at this time Shipping does not show Pickup Points or
  // Scheduled Delivery/Pickup Options we are filtering from results.
  // Also we will filter deliveryOptions which does not apply to all LogisticsInfo.
  const filteredDeliveryOptions = filterDeliveryOptions(
    deliveryOptions,
    availableItemsLogisticsInfo
  )

  const updatedDeliveryOptions = getFormattedDeliveryOptions(
    filteredDeliveryOptions,
    availableItemsLogisticsInfo
  )

  const selectedDeliveryOption = updatedDeliveryOptions.find(
    option => option.isSelected
  )

  const shippingTotalizer = orderForm.totalizers.find(
    totalizer => totalizer.id === 'Shipping'
  )

  if (
    selectedDeliveryOption &&
    shippingTotalizer &&
    selectedDeliveryOption.price !== shippingTotalizer.value
  ) {
    const newShippingData = selectDeliveryOption({
      deliveryOptionId: selectedDeliveryOption.id,
      shippingData: orderForm.shippingData,
    })

    await clients.checkout.updateOrderFormShipping(
      orderForm.orderFormId,
      newShippingData
    )

    const difference = selectedDeliveryOption.price - shippingTotalizer.value
    shippingTotalizer.value = selectedDeliveryOption.price
    orderForm.value += difference
  }

  return {
    availableAddresses,
    countries,
    deliveryOptions: updatedDeliveryOptions,
    selectedAddress,
  }
}