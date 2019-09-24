import {
  deliveryAddress,
  ORDER_FORM_WITH_DIFFERENT_SLAS_BETWEEN_LOGISTICS_INFO,
  ORDER_FORM_WITH_EMPTY_LOGISTICS_INFO,
  ORDER_FORM_WITH_EMPTY_SHIPPING_DATA,
  ORDER_FORM_WITH_PICKUPS,
  ORDER_FORM_WITH_SCHEDULED_DELIVERY,
  ORDER_FORM_WITH_SCHEDULED_DELIVERY_AND_PICKUPS,
} from '../../__mocks__/shippping'
import { getShippingInfo } from '../utils/shipping'

describe('Shipping Resolvers', () => {
  describe('getShippingInfo', () => {
    it('should get shipping info handling empty shippingData', () => {
      const expectedResult = {
        countries: [],
        deliveryOptions: [],
        selectedAddresses: [],
      }

      expect(getShippingInfo(ORDER_FORM_WITH_EMPTY_SHIPPING_DATA)).toEqual(
        expectedResult
      )
    })

    it('should get shipping info handling empty logisticsInfo', () => {
      const expectedResult = {
        countries: ['BRA', 'GBR'],
        deliveryOptions: [],
        selectedAddresses: [deliveryAddress],
      }

      expect(getShippingInfo(ORDER_FORM_WITH_EMPTY_LOGISTICS_INFO)).toEqual(
        expectedResult
      )
    })

    it('should get shipping info removing pickup point SLAs', () => {
      const expectedResult = {
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
          },
        ],
        selectedAddresses: [deliveryAddress],
      }

      expect(getShippingInfo(ORDER_FORM_WITH_PICKUPS)).toEqual(expectedResult)
    })

    it('should get shipping info removing scheduled delivery SLAs', () => {
      const expectedResult = {
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
          },
        ],
        selectedAddresses: [deliveryAddress],
      }

      expect(getShippingInfo(ORDER_FORM_WITH_SCHEDULED_DELIVERY)).toEqual(
        expectedResult
      )
    })

    it('should get shipping info removing scheduled delivery and pickup SLAs', () => {
      const expectedResult = {
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 100,
          },
        ],
        selectedAddresses: [deliveryAddress],
      }

      expect(
        getShippingInfo(ORDER_FORM_WITH_SCHEDULED_DELIVERY_AND_PICKUPS)
      ).toEqual(expectedResult)
    })

    it('should get shipping info removing SLAs which does not exist in all logisticsInfo', () => {
      const expectedResult = {
        countries: ['BRA', 'GBR'],
        deliveryOptions: [
          {
            estimate: '1db',
            id: 'delivery-SLA',
            isSelected: true,
            price: 200,
          },
        ],
        selectedAddresses: [deliveryAddress],
      }

      expect(
        getShippingInfo(ORDER_FORM_WITH_DIFFERENT_SLAS_BETWEEN_LOGISTICS_INFO)
      ).toEqual(expectedResult)
    })
  })
})
