import { AddressType, PICKUP_IN_POINT } from '../constants'
import {
  addressHasGeocoordinates,
  filterDeliveryOptions,
  getSelectedAddress,
} from '../utils/address'
import {
  makeAddress,
  makeLogisticsInfo,
  makeSLA,
} from '../__fixtures__/logistics'

describe('utils/address', () => {
  describe('getSelectedAddress', () => {
    it('returns undefined for an empty address list', () => {
      expect(getSelectedAddress([])).toBeUndefined()
    })

    it('skips addresses of type pickup', () => {
      const residential = makeAddress({ addressId: 'home' })
      expect(
        getSelectedAddress([
          makeAddress({ addressId: 'pickup', addressType: AddressType.PICKUP }),
          residential,
        ])
      ).toEqual(residential)
    })

    it('skips addresses of type inStore', () => {
      const residential = makeAddress({ addressId: 'home' })
      expect(
        getSelectedAddress([
          makeAddress({
            addressId: 'instore',
            addressType: AddressType.INSTORE,
          }),
          residential,
        ])
      ).toEqual(residential)
    })

    it('returns undefined when every address is pickup or inStore', () => {
      expect(
        getSelectedAddress([
          makeAddress({ addressType: AddressType.PICKUP }),
          makeAddress({ addressType: AddressType.INSTORE }),
        ])
      ).toBeUndefined()
    })

    it('returns the first non-pickup, non-inStore address in order', () => {
      const first = makeAddress({ addressId: 'first' })
      const second = makeAddress({ addressId: 'second' })

      expect(getSelectedAddress([first, second])).toEqual(first)
    })
  })

  describe('addressHasGeocoordinates', () => {
    it('returns a falsy value when geoCoordinates is empty', () => {
      expect(addressHasGeocoordinates(makeAddress())).toBeFalsy()
    })

    it('returns a truthy value when geoCoordinates is populated', () => {
      expect(
        addressHasGeocoordinates(
          makeAddress({ geoCoordinates: [-46.6388, -23.5489] })
        )
      ).toBeTruthy()
    })

    it('returns a falsy value when address is undefined', () => {
      expect(
        addressHasGeocoordinates((undefined as unknown) as CheckoutAddress)
      ).toBeFalsy()
    })
  })

  describe('filterDeliveryOptions', () => {
    it('returns an empty list when no delivery options are passed', () => {
      expect(filterDeliveryOptions([], [makeLogisticsInfo()])).toEqual([])
    })

    it('excludes SLAs flagged as scheduled (availableDeliveryWindows > 0)', () => {
      const sla = makeSLA({ id: 'normal' })
      const scheduled = makeSLA({
        id: 'scheduled',
        availableDeliveryWindows: [{ startDateUtc: '2024-01-01T00:00:00Z' }],
      })
      const logistics = [makeLogisticsInfo({ slas: [sla, scheduled] })]

      expect(filterDeliveryOptions([sla, scheduled], logistics)).toEqual([sla])
    })

    it('excludes SLAs whose deliveryChannel is neither delivery nor pickup-in-point', () => {
      const sla = makeSLA({ id: 'normal' })
      const odd = makeSLA({ id: 'odd', deliveryChannel: 'take-away' })
      const logistics = [makeLogisticsInfo({ slas: [sla, odd] })]

      expect(filterDeliveryOptions([sla, odd], logistics)).toEqual([sla])
    })

    it('excludes SLAs that are not present in every logisticsInfo entry', () => {
      const common = makeSLA({ id: 'common' })
      const partial = makeSLA({ id: 'partial' })
      const logistics = [
        makeLogisticsInfo({ itemId: 'i1', slas: [common, partial] }),
        makeLogisticsInfo({ itemId: 'i2', slas: [common] }),
      ]

      expect(filterDeliveryOptions([common, partial], logistics)).toEqual([
        common,
      ])
    })

    it('keeps SLAs of pickup-in-point channel when present in every logisticsInfo', () => {
      const pickup = makeSLA({ id: 'pp', deliveryChannel: PICKUP_IN_POINT })
      const logistics = [
        makeLogisticsInfo({ itemId: 'i1', slas: [pickup] }),
        makeLogisticsInfo({ itemId: 'i2', slas: [pickup] }),
      ]

      expect(filterDeliveryOptions([pickup], logistics)).toEqual([pickup])
    })
  })
})
