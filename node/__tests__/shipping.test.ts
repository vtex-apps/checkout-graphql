import {
  deliveryAddress,
  ORDER_FORM_WITH_DIFFERENT_SLAS_BETWEEN_LOGISTICS_INFO,
  ORDER_FORM_WITH_DUPLICATED_SLAS_WITH_DIFFERENT_DELIVERY_IDS,
  ORDER_FORM_WITH_EMPTY_LOGISTICS_INFO,
  ORDER_FORM_WITH_EMPTY_SHIPPING_DATA,
  ORDER_FORM_WITH_PICKUPS,
  ORDER_FORM_WITH_SCHEDULED_DELIVERY,
  ORDER_FORM_WITH_SCHEDULED_DELIVERY_AND_PICKUPS,
  ORDER_FORM_WITH_UNAVAILABLE_ITEM_LOGISTICS_INFO,
  clients,
} from '../__fixtures__/shipping'
import { getShippingInfo } from '../utils/shipping'

describe('Shipping Resolvers', () => {
  describe('getShippingInfo', () => {
    it('should get shipping info handling empty shippingData', async () => {
      const expectedResult = {
        availableAddresses: [],
        countries: [],
        deliveryOptions: [],
        pickupOptions: [],
        selectedAddress: undefined,
      }

      expect(
        await getShippingInfo({
          clients,
          orderForm: ORDER_FORM_WITH_EMPTY_SHIPPING_DATA,
        })
      ).toEqual(expectedResult)
    })

    it('should get shipping info handling empty logisticsInfo', async () => {
      const expectedResult = {
        availableAddresses: [deliveryAddress],
        countries: ['BRA', 'GBR'],
        deliveryOptions: [],
        pickupOptions: [],
        selectedAddress: deliveryAddress,
      }

      expect(
        await getShippingInfo({
          clients,
          orderForm: ORDER_FORM_WITH_EMPTY_LOGISTICS_INFO,
        })
      ).toEqual(expectedResult)
    })

    it('should get shipping info', async () => {
      const expectedResult = {
        availableAddresses: [deliveryAddress],
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            deliveryChannel: 'delivery',
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
            sla: {
              availableDeliveryWindows: [],
              deliveryChannel: 'delivery',
              deliveryIds: [],
              deliveryWindow: null,
              id: 'delivery-SLA',
              listPrice: 0,
              lockTTL: null,
              name: 'delivery-SLA',
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
              price: 100,
              shippingEstimate: '1db',
              shippingEstimateDate: null,
              tax: 0,
            },
          },
        ],
        pickupOptions: [
          {
            additionalInfo: null,
            address: null,
            deliveryChannel: 'pickup-in-point',
            estimate: '1d',
            friendlyName: null,
            id: 'pickup-SLA',
            isSelected: false,
            price: 100,
            storeDistance: 0,
            transitTime: undefined,
            businessHours: [
              {
                dayNumber: '1to5',
                closed: true,
                openingTime: '',
                closingTime: '',
              },
              { dayNumber: 6, closed: true, openingTime: '', closingTime: '' },
              { dayNumber: 0, closed: true, openingTime: '', closingTime: '' },
            ],
          },
        ],
        selectedAddress: deliveryAddress,
      }

      expect(
        await getShippingInfo({ clients, orderForm: ORDER_FORM_WITH_PICKUPS })
      ).toEqual(expectedResult)
    })

    it('should get shipping info removing scheduled delivery SLAs', async () => {
      const expectedResult = {
        availableAddresses: [deliveryAddress],
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            deliveryChannel: 'delivery',
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
            sla: {
              availableDeliveryWindows: [],
              deliveryChannel: 'delivery',
              deliveryIds: [],
              deliveryWindow: null,
              id: 'delivery-SLA',
              listPrice: 0,
              lockTTL: null,
              name: 'delivery-SLA',
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
              price: 100,
              shippingEstimate: '1db',
              shippingEstimateDate: null,
              tax: 0,
            },
          },
        ],
        pickupOptions: [],
        selectedAddress: deliveryAddress,
      }

      expect(
        await getShippingInfo({
          clients,
          orderForm: ORDER_FORM_WITH_SCHEDULED_DELIVERY,
        })
      ).toEqual(expectedResult)
    })

    it('should get shipping info with delivery and pickup SLAs but removing scheduled delivery ones', async () => {
      const expectedResult = {
        availableAddresses: [deliveryAddress],
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            deliveryChannel: 'delivery',
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
            sla: {
              availableDeliveryWindows: [],
              deliveryChannel: 'delivery',
              deliveryIds: [],
              deliveryWindow: null,
              id: 'delivery-SLA',
              listPrice: 0,
              lockTTL: null,
              name: 'delivery-SLA',
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
              price: 100,
              shippingEstimate: '1db',
              shippingEstimateDate: null,
              tax: 0,
            },
          },
        ],
        pickupOptions: [
          {
            additionalInfo: null,
            address: null,
            deliveryChannel: 'pickup-in-point',
            estimate: '1d',
            friendlyName: null,
            id: 'pickup-SLA',
            isSelected: false,
            price: 100,
            storeDistance: 0,
            transitTime: undefined,
            businessHours: [
              {
                dayNumber: '1to5',
                closed: true,
                openingTime: '',
                closingTime: '',
              },
              { dayNumber: 6, closed: true, openingTime: '', closingTime: '' },
              { dayNumber: 0, closed: true, openingTime: '', closingTime: '' },
            ],
          },
        ],
        selectedAddress: deliveryAddress,
      }

      expect(
        await getShippingInfo({
          clients,
          orderForm: ORDER_FORM_WITH_SCHEDULED_DELIVERY_AND_PICKUPS,
        })
      ).toEqual(expectedResult)
    })

    it('should get shipping info removing SLAs which does not exist in all logisticsInfo', async () => {
      const expectedResult = {
        availableAddresses: [deliveryAddress],
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            deliveryChannel: 'delivery',
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 200,
            sla: {
              availableDeliveryWindows: [],
              deliveryChannel: 'delivery',
              deliveryIds: [],
              deliveryWindow: null,
              id: 'delivery-SLA',
              listPrice: 0,
              lockTTL: null,
              name: 'delivery-SLA',
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
              price: 100,
              shippingEstimate: '1db',
              shippingEstimateDate: null,
              tax: 0,
            },
          },
        ],
        pickupOptions: [],
        selectedAddress: deliveryAddress,
      }

      expect(
        await getShippingInfo({
          clients,
          orderForm: ORDER_FORM_WITH_DIFFERENT_SLAS_BETWEEN_LOGISTICS_INFO,
        })
      ).toEqual(expectedResult)
    })

    it('should get shipping info removing duplicated SLAs which have different delivery ids', async () => {
      const expectedResult = {
        availableAddresses: [deliveryAddress],
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            deliveryChannel: 'delivery',
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 200,
            sla: {
              availableDeliveryWindows: [],
              deliveryChannel: 'delivery',
              deliveryIds: [
                {
                  courierId: '1',
                  courierName: 'PAC',
                  dockId: '1fd8f86',
                  quantity: 1,
                  warehouseId: '1a105fe',
                },
              ],
              deliveryWindow: null,
              id: 'delivery-SLA',
              listPrice: 0,
              lockTTL: null,
              name: 'delivery-SLA',
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
              price: 100,
              shippingEstimate: '1db',
              shippingEstimateDate: null,
              tax: 0,
            },
          },
        ],
        pickupOptions: [],
        selectedAddress: deliveryAddress,
      }

      expect(
        await getShippingInfo({
          clients,
          orderForm: ORDER_FORM_WITH_DUPLICATED_SLAS_WITH_DIFFERENT_DELIVERY_IDS,
        })
      ).toEqual(expectedResult)
    })

    it('should get shipping info without empty deliveryOptions', async () => {
      const expectedResult = {
        availableAddresses: [deliveryAddress],
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            deliveryChannel: 'delivery',
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
            sla: {
              availableDeliveryWindows: [],
              deliveryChannel: 'delivery',
              deliveryIds: [],
              deliveryWindow: null,
              id: 'delivery-SLA',
              listPrice: 0,
              lockTTL: null,
              name: 'delivery-SLA',
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
              price: 100,
              shippingEstimate: '1db',
              shippingEstimateDate: null,
              tax: 0,
            },
          },
        ],
        pickupOptions: [
          {
            additionalInfo: null,
            estimate: '1d',
            address: null,
            deliveryChannel: 'pickup-in-point',
            friendlyName: null,
            id: 'pickup-SLA',
            isSelected: false,
            price: 100,
            storeDistance: 0,
            transitTime: undefined,
            businessHours: [
              {
                dayNumber: '1to5',
                closed: true,
                openingTime: '',
                closingTime: '',
              },
              { dayNumber: 6, closed: true, openingTime: '', closingTime: '' },
              { dayNumber: 0, closed: true, openingTime: '', closingTime: '' },
            ],
          },
        ],
        selectedAddress: deliveryAddress,
      }

      expect(
        await getShippingInfo({
          clients,
          orderForm: ORDER_FORM_WITH_UNAVAILABLE_ITEM_LOGISTICS_INFO,
        })
      ).toEqual(expectedResult)
    })
  })
})
