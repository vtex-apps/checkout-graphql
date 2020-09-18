import { AddressType, DELIVERY, PICKUP_IN_STORE } from '../constants'
import { EMPTY_ORDER_FORM } from './orderForm'
import { Clients } from '../clients'

const SLA = {
  deliveryIds: [],
  deliveryWindow: null,
  listPrice: 0,
  lockTTL: null,
  pickupDistance: 0,
  pickupPointId: null,
  pickupStoreInfo: {
    additionalInfo: null,
    address: null,
    dockId: null,
    friendlyName: null,
    isPickupStore: false,
  },
  polygonName: null,
  shippingEstimateDate: null,
  tax: 0,
}

export const pickupSLA = {
  ...SLA,
  availableDeliveryWindows: [],
  deliveryChannel: PICKUP_IN_STORE,
  id: 'pickup-SLA',
  name: 'pickup-SLA',
  price: 100,
  shippingEstimate: '1d',
}

export const deliverySLA = {
  ...SLA,
  availableDeliveryWindows: [],
  deliveryChannel: DELIVERY,
  id: 'delivery-SLA',
  name: 'delivery-SLA',
  price: 100,
  shippingEstimate: '1db',
}

const deliveryIdOne = {
  courierId: '1',
  warehouseId: '1',
  dockId: '1',
  courierName: 'PAC',
  quantity: 1,
}

const deliveryId = {
  courierId: '1',
  warehouseId: '1a105fe',
  dockId: '1fd8f86',
  courierName: 'PAC',
  quantity: 1,
}

export const deliverySLAWithDeliveryIdOne = {
  ...SLA,
  availableDeliveryWindows: [],
  deliveryChannel: DELIVERY,
  id: 'delivery-SLA',
  name: 'delivery-SLA',
  price: 100,
  shippingEstimate: '1db',
  deliveryIds: [deliveryIdOne],
}

export const deliverySLAWithDeliveryId = {
  ...SLA,
  availableDeliveryWindows: [],
  deliveryChannel: DELIVERY,
  id: 'delivery-SLA',
  name: 'delivery-SLA',
  price: 100,
  shippingEstimate: '1db',
  deliveryIds: [deliveryId],
}

export const deliverySLAExpress = {
  ...SLA,
  availableDeliveryWindows: [],
  deliveryChannel: DELIVERY,
  id: 'delivery-SLA-Express',
  name: 'delivery-SLA-Express',
  price: 600,
  shippingEstimate: '1h',
}

export const scheduledDeliverySLA = {
  ...SLA,
  availableDeliveryWindows: [{}],
  deliveryChannel: DELIVERY,
  id: 'scheduled-delivery-SLA',
  name: 'scheduled-delivery-SLA',
  price: 100,
  shippingEstimate: '1bd',
}

export const deliveryAddress = {
  addressId: 'test',
  addressType: AddressType.RESIDENTIAL,
  city: '',
  complement: '',
  country: 'BRA',
  geoCoordinates: [],
  neighborhood: '',
  number: '',
  postalCode: '222071060',
  receiverName: '',
  reference: null,
  state: '',
  street: '',
}

export const ORDER_FORM_WITH_PICKUPS = {
  ...EMPTY_ORDER_FORM,
  shippingData: {
    address: null,
    availableAddresses: [deliveryAddress],
    logisticsInfo: [
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId',
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA, pickupSLA],
      },
    ],
    pickupPoints: [],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_SCHEDULED_DELIVERY = {
  ...EMPTY_ORDER_FORM,
  shippingData: {
    address: null,
    availableAddresses: [deliveryAddress],
    logisticsInfo: [
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId',
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA, scheduledDeliverySLA],
      },
    ],
    pickupPoints: [],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_SCHEDULED_DELIVERY_AND_PICKUPS = {
  ...EMPTY_ORDER_FORM,
  shippingData: {
    address: null,
    availableAddresses: [deliveryAddress],
    logisticsInfo: [
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId',
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA, scheduledDeliverySLA, pickupSLA],
      },
    ],
    pickupPoints: [],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_DIFFERENT_SLAS_BETWEEN_LOGISTICS_INFO = {
  ...EMPTY_ORDER_FORM,
  shippingData: {
    address: null,
    availableAddresses: [deliveryAddress],
    logisticsInfo: [
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId',
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA],
      },
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId',
        itemIndex: 1,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA, deliverySLAExpress],
      },
    ],
    pickupPoints: [],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_DUPLICATED_SLAS_WITH_DIFFERENT_DELIVERY_IDS = {
  ...EMPTY_ORDER_FORM,
  shippingData: {
    address: null,
    availableAddresses: [deliveryAddress],
    logisticsInfo: [
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId',
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLAWithDeliveryId],
      },
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId',
        itemIndex: 1,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLAWithDeliveryIdOne, deliverySLAExpress],
      },
    ],
    pickupPoints: [],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_EMPTY_LOGISTICS_INFO = {
  ...EMPTY_ORDER_FORM,
  shippingData: {
    address: null,
    availableAddresses: [deliveryAddress],
    logisticsInfo: [
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId',
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: null,
        shipsTo: ['BRA', 'GBR'],
        slas: [],
      },
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId',
        itemIndex: 1,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: null,
        shipsTo: ['BRA', 'GBR'],
        slas: [],
      },
    ],
    pickupPoints: [],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_UNAVAILABLE_ITEM_LOGISTICS_INFO = {
  ...EMPTY_ORDER_FORM,
  shippingData: {
    address: null,
    availableAddresses: [deliveryAddress],
    logisticsInfo: [
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId',
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [],
      },
      {
        addressId: deliveryAddress.addressId,
        deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_STORE }],
        itemId: 'testId2',
        itemIndex: 0,
        selectedDeliveryChannel: DELIVERY,
        selectedSla: deliverySLA.id,
        shipsTo: ['BRA', 'GBR'],
        slas: [deliverySLA, pickupSLA],
      },
    ],
    pickupPoints: [],
    selectedAddresses: [deliveryAddress],
  },
}

export const ORDER_FORM_WITH_EMPTY_SHIPPING_DATA = {
  ...EMPTY_ORDER_FORM,
}

export const clients = ({
  checkout: {
    updateOrderFormShipping: jest.fn(),
  },
} as unknown) as Clients
