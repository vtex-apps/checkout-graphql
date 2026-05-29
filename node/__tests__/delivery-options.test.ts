import { DELIVERY, PICKUP_IN_POINT } from '../constants'
import {
  getFormattedDeliveryOptions,
  hasDeliveryOption,
} from '../utils/delivery-options'
import { makeLogisticsInfo, makeSLA } from '../__fixtures__/logistics'

describe('utils/delivery-options', () => {
  describe('getFormattedDeliveryOptions', () => {
    it('returns an empty list when there are no delivery options', () => {
      expect(getFormattedDeliveryOptions([], [makeLogisticsInfo()])).toEqual([])
    })

    it('returns options with isSelected=false and price=0 when logisticsInfo is null', () => {
      const sla = makeSLA({ id: 'sla-A', price: 250 })

      expect(getFormattedDeliveryOptions([sla], null)).toEqual([
        {
          id: 'sla-A',
          estimate: '1bd',
          isSelected: false,
          price: 0,
          deliveryChannel: DELIVERY,
          sla,
        },
      ])
    })

    it('sums the SLA price across every logisticsInfo entry that contains it', () => {
      const sla = makeSLA({ id: 'sla-A', price: 100 })
      const logistics = [
        makeLogisticsInfo({ itemId: 'i1', slas: [sla] }),
        makeLogisticsInfo({ itemId: 'i2', slas: [sla] }),
        makeLogisticsInfo({ itemId: 'i3', slas: [] }),
      ]

      const [option] = getFormattedDeliveryOptions([sla], logistics)

      expect(option.price).toBe(200)
    })

    it('flags isSelected when any logisticsInfo selectedSla matches', () => {
      const sla = makeSLA({ id: 'sla-A' })
      const logistics = [
        makeLogisticsInfo({ itemId: 'i1', selectedSla: 'other', slas: [sla] }),
        makeLogisticsInfo({ itemId: 'i2', selectedSla: 'sla-A', slas: [sla] }),
      ]

      const [option] = getFormattedDeliveryOptions([sla], logistics)

      expect(option.isSelected).toBe(true)
    })

    it('keeps isSelected=false when no logisticsInfo selectedSla matches', () => {
      const sla = makeSLA({ id: 'sla-A' })
      const logistics = [
        makeLogisticsInfo({ selectedSla: 'other', slas: [sla] }),
      ]

      const [option] = getFormattedDeliveryOptions([sla], logistics)

      expect(option.isSelected).toBe(false)
    })

    it('adds pickupPointId only when the SLA deliveryChannel is pickup-in-point', () => {
      const pickupSla = makeSLA({
        id: 'pickup-A',
        deliveryChannel: PICKUP_IN_POINT,
        pickupPointId: 'pp-1',
      })
      const deliverySla = makeSLA({ id: 'delivery-A' })

      const [pickup, delivery] = getFormattedDeliveryOptions(
        [pickupSla, deliverySla],
        [makeLogisticsInfo({ slas: [pickupSla, deliverySla] })]
      )

      expect(pickup).toHaveProperty('pickupPointId', 'pp-1')
      expect(delivery).not.toHaveProperty('pickupPointId')
    })
  })

  describe('hasDeliveryOption', () => {
    const slas: SLA[] = [makeSLA({ id: 'sla-A' }), makeSLA({ id: 'sla-B' })]

    it('returns true when the SLA id is present', () => {
      expect(hasDeliveryOption(slas, 'sla-B')).toBe(true)
    })

    it('returns false when the SLA id is missing', () => {
      expect(hasDeliveryOption(slas, 'sla-missing')).toBe(false)
    })

    it('returns false for an empty SLA list', () => {
      expect(hasDeliveryOption([], 'sla-A')).toBe(false)
    })
  })
})
