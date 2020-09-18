import {
  deliveryAddress,
  deliverySLA, 
  pickupSLA,
  scheduledDeliverySLA,
  deliverySLAExpress,
  deliverySLAWithDeliveryIdOne,
  deliverySLAWithDeliveryId,
  ORDER_FORM_WITH_DIFFERENT_SLAS_BETWEEN_LOGISTICS_INFO,
  ORDER_FORM_WITH_DUPLICATED_SLAS_WITH_DIFFERENT_DELIVERY_IDS,
  ORDER_FORM_WITH_EMPTY_LOGISTICS_INFO,
  ORDER_FORM_WITH_EMPTY_SHIPPING_DATA,
  ORDER_FORM_WITH_PICKUPS,
  ORDER_FORM_WITH_SCHEDULED_DELIVERY,
  ORDER_FORM_WITH_SCHEDULED_DELIVERY_AND_PICKUPS,
  ORDER_FORM_WITH_UNAVAILABLE_ITEM_LOGISTICS_INFO,
  clients
} from '../__fixtures__/shipping'
import { DELIVERY, PICKUP_IN_STORE } from '../constants'
import { getShippingInfo } from '../utils/shipping'

describe('Shipping Resolvers', () => {
  describe('getShippingInfo', () => {
    it('should get shipping info handling empty shippingData', async () => {
      const expectedResult = {
        availableAddresses: [],
        countries: [],
        deliveryOptions: [],
        logisticsInfo: [],
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
        selectedAddress: deliveryAddress,
      }

      expect(
        await getShippingInfo({
          clients,
          orderForm: ORDER_FORM_WITH_EMPTY_LOGISTICS_INFO,
        })
      ).toEqual(expectedResult)
    })

    it('should get shipping info removing pickup point SLAs', async () => {
      const expectedResult = {
        availableAddresses: [deliveryAddress],
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
          },
        ],
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
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
          },
        ],
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
        selectedAddress: deliveryAddress,
      }

      expect(
        await getShippingInfo({
          clients,
          orderForm: ORDER_FORM_WITH_SCHEDULED_DELIVERY,
        })
      ).toEqual(expectedResult)
    })

    it('should get shipping info removing scheduled delivery and pickup SLAs', async () => {
      const expectedResult = {
        availableAddresses: [deliveryAddress],
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
          },
        ],
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
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 200,
          },
        ],
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
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 200,
          },
        ],
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
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
          },
        ],
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
