import { ADDRESS_TYPES, DELIVERY, PICKUP_IN_STORE } from '../../constants'

const pickupSLA = {
  availableDeliveryWindows: [],
  deliveryChannel: PICKUP_IN_STORE,
  id: 'pickup-SLA',
  price: 100,
  shippingEstimate: '1d',
}

const deliverySLA = {
  availableDeliveryWindows: [],
  deliveryChannel: DELIVERY,
  id: 'delivery-SLA',
  price: 100,
  shippingEstimate: '1db',
}

const deliverySLAExpress = {
  availableDeliveryWindows: [],
  deliveryChannel: DELIVERY,
  id: 'delivery-SLA-Express',
  price: 600,
  shippingEstimate: '1h',
}

const scheduledDeliverySLA = {
  availableDeliveryWindows: [{}],
  deliveryChannel: DELIVERY,
  id: 'scheduled-delivery-SLA',
  price: 100,
  shippingEstimate: '1bd',
}

export const deliveryAddress = {
  addressId: 'test',
  addressType: ADDRESS_TYPES.RESIDENTIAL,
  country: 'BRA',
  postalCode: '222071060',
}

export const ORDER_FORM_WITH_PICKUPS = {
  shippingData: {
    availableAddress: [deliveryAddress],
    logisticsInfo: [
      {
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA, pickupSLA],
      },
    ],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_SCHEDULED_DELIVERY = {
  shippingData: {
    availableAddress: [deliveryAddress],
    logisticsInfo: [
      {
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA, scheduledDeliverySLA],
      },
    ],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_SCHEDULED_DELIVERY_AND_PICKUPS = {
  shippingData: {
    availableAddress: [deliveryAddress],
    logisticsInfo: [
      {
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA, scheduledDeliverySLA, pickupSLA],
      },
    ],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_DIFFERENT_SLAS_BETWEEN_LOGISTICS_INFO = {
  shippingData: {
    availableAddress: [deliveryAddress],
    logisticsInfo: [
      {
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA],
      },
      {
        itemIndex: 1,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA, deliverySLAExpress],
      },
    ],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_EMPTY_LOGISTICS_INFO = {
  shippingData: {
    availableAddress: [deliveryAddress],
    logisticsInfo: [
      {
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: null,
        shipsTo: ['BRA', 'GBR'],
        slas: [],
      },
      {
        itemIndex: 1,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: null,
        shipsTo: ['BRA', 'GBR'],
        slas: [],
      },
    ],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_EMPTY_SHIPPING_DATA = {}
