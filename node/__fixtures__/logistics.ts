/**
 * Shared factories for logistics primitives used across the test suite.
 *
 * `CheckoutAddress`, `SLA` and `LogisticsInfo` are large nominal types: every
 * required field has to be supplied even when a test only cares about one or
 * two of them. Keeping the boilerplate here ensures that when a required
 * field is added to any of these types we only need to update one place —
 * otherwise every test that hand-builds an instance would silently drift.
 *
 * Each factory accepts a `Partial<T>` of overrides so individual tests can
 * specialize only the fields they care about.
 */

import { AddressType, DELIVERY, PICKUP_IN_POINT } from '../constants'

export const makeAddress = (
  overrides: Partial<CheckoutAddress> = {}
): CheckoutAddress => ({
  addressId: 'addr-1',
  addressType: AddressType.RESIDENTIAL,
  city: 'SP',
  complement: '',
  country: 'BRA',
  geoCoordinates: [],
  isDisposable: false,
  neighborhood: '',
  number: '',
  postalCode: '00000000',
  receiverName: '',
  reference: null,
  state: 'SP',
  street: 'Rua A',
  ...overrides,
})

export const makeSLA = (overrides: Partial<SLA> = {}): SLA => ({
  id: 'sla-1',
  name: 'sla-1',
  deliveryChannel: DELIVERY,
  shippingEstimate: '1bd',
  shippingEstimateDate: null,
  price: 100,
  listPrice: 0,
  tax: 0,
  pickupStoreInfo: {
    additionalInfo: null,
    address: null,
    dockId: null,
    friendlyName: null,
    isPickupStore: false,
  },
  pickupPointId: null,
  pickupDistance: 0,
  polygonName: null,
  lockTTL: null,
  deliveryIds: [],
  availableDeliveryWindows: [],
  deliveryWindow: null,
  transitTime: null,
  ...overrides,
})

export const makeLogisticsInfo = (
  overrides: Partial<LogisticsInfo> = {}
): LogisticsInfo => ({
  addressId: 'addr-1',
  deliveryChannels: [{ id: DELIVERY }, { id: PICKUP_IN_POINT }],
  itemId: 'item-1',
  itemIndex: 0,
  shipsTo: ['BRA'],
  slas: [],
  selectedDeliveryChannel: null,
  selectedSla: null,
  ...overrides,
})
