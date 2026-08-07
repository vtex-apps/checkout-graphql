import { AddressType, DELIVERY, PICKUP_IN_POINT } from '../constants'
import { EMPTY_ORDER_FORM } from '../__fixtures__/orderForm'
import {
  getShippingData,
  getShippingInfo,
  selectAddress,
  selectShippingOption,
} from '../utils/shipping'
import { makeClientsMock } from '../__fixtures__/clients'
import { makeContext, toContext } from '../__fixtures__/context'
import {
  makeAddress,
  makeLogisticsInfo,
  makeSLA,
} from '../__fixtures__/logistics'

const makeShippingData = (
  overrides: Partial<ShippingData> = {}
): ShippingData => ({
  address: null,
  availableAddresses: [],
  logisticsInfo: [],
  pickupPoints: [],
  selectedAddresses: [],
  ...overrides,
})

describe('utils/shipping — getShippingData', () => {
  it('returns an empty logisticsInfo when input is null', () => {
    const address = makeAddress()

    expect(getShippingData(address, null)).toEqual({
      logisticsInfo: [],
      selectedAddresses: [address],
    })
  })

  it('propagates the address id into every logisticsInfo entry', () => {
    const address = makeAddress({ addressId: 'new-addr' })
    const logistics = [
      makeLogisticsInfo({ addressId: 'old-1', itemId: 'i1' }),
      makeLogisticsInfo({ addressId: 'old-2', itemId: 'i2' }),
    ]

    const result = getShippingData(address, logistics)

    expect(result.logisticsInfo.map(li => li.addressId)).toEqual([
      'new-addr',
      'new-addr',
    ])
  })

  it('does not add clearAddressIfPostalCodeNotFound when the address has no geo coordinates', () => {
    const result = getShippingData(makeAddress(), [makeLogisticsInfo()])
    expect(result).not.toHaveProperty('clearAddressIfPostalCodeNotFound')
  })

  it('adds clearAddressIfPostalCodeNotFound=false when geo coordinates are present', () => {
    const address = makeAddress({ geoCoordinates: [-46.6388, -23.5489] })

    const result = getShippingData(address, [makeLogisticsInfo()])

    expect(result).toMatchObject({
      clearAddressIfPostalCodeNotFound: false,
    })
  })
})

describe('utils/shipping — selectShippingOption', () => {
  const address = makeAddress()

  it('returns null when shippingData is null', () => {
    expect(
      selectShippingOption({
        shippingData: null,
        slaId: 'whatever',
        deliveryChannel: DELIVERY,
      })
    ).toBeNull()
  })

  it('returns the shippingData untouched when no usable address is selected', () => {
    const pickupAddress = makeAddress({ addressType: AddressType.PICKUP })
    const shippingData = makeShippingData({
      selectedAddresses: [pickupAddress],
      logisticsInfo: [makeLogisticsInfo({ slas: [makeSLA({ id: 'sla-1' })] })],
    })

    expect(
      selectShippingOption({
        shippingData,
        slaId: 'sla-1',
        deliveryChannel: DELIVERY,
      })
    ).toBe(shippingData)
  })

  it('sets selectedDeliveryChannel on every logisticsInfo entry', () => {
    const sla = makeSLA({ id: 'sla-1' })
    const shippingData = makeShippingData({
      selectedAddresses: [address],
      logisticsInfo: [
        makeLogisticsInfo({ itemId: 'i1', slas: [sla] }),
        makeLogisticsInfo({ itemId: 'i2', slas: [] }),
      ],
    })

    const result = selectShippingOption({
      shippingData,
      slaId: 'sla-1',
      deliveryChannel: PICKUP_IN_POINT,
    })

    expect(
      result?.logisticsInfo.map(li => li.selectedDeliveryChannel)
    ).toEqual([PICKUP_IN_POINT, PICKUP_IN_POINT])
  })

  it('marks the SLA in every logisticsInfo that contains it when no itemId is passed', () => {
    const sla = makeSLA({ id: 'sla-1' })
    const shippingData = makeShippingData({
      selectedAddresses: [address],
      logisticsInfo: [
        makeLogisticsInfo({
          itemId: 'i1',
          selectedSla: 'previous',
          slas: [sla],
        }),
        makeLogisticsInfo({
          itemId: 'i2',
          selectedSla: 'previous',
          slas: [sla],
        }),
        makeLogisticsInfo({
          itemId: 'i3',
          selectedSla: 'keep-me',
          slas: [],
        }),
      ],
    })

    const result = selectShippingOption({
      shippingData,
      slaId: 'sla-1',
      deliveryChannel: DELIVERY,
    })

    expect(result?.logisticsInfo.map(li => li.selectedSla)).toEqual([
      'sla-1',
      'sla-1',
      'keep-me',
    ])
  })

  it('only updates the matching itemId when itemId is provided', () => {
    const sla = makeSLA({ id: 'sla-1' })
    const shippingData = makeShippingData({
      selectedAddresses: [address],
      logisticsInfo: [
        makeLogisticsInfo({
          itemId: 'target',
          selectedSla: 'prev-a',
          slas: [sla],
        }),
        makeLogisticsInfo({
          itemId: 'other',
          selectedSla: 'prev-b',
          slas: [sla],
        }),
      ],
    })

    const result = selectShippingOption({
      shippingData,
      slaId: 'sla-1',
      itemId: 'target',
      deliveryChannel: DELIVERY,
    })

    expect(result?.logisticsInfo.map(li => li.selectedSla)).toEqual([
      'sla-1',
      'prev-b',
    ])
  })
})

describe('utils/shipping — selectAddress', () => {
  it('returns null when shippingData is null', () => {
    expect(
      selectAddress({ shippingData: null, address: makeAddress() })
    ).toBeNull()
  })

  it('replaces selectedAddresses with the supplied address', () => {
    const oldAddress = makeAddress({ addressId: 'old' })
    const newAddress = makeAddress({ addressId: 'new' })
    const shippingData = makeShippingData({ selectedAddresses: [oldAddress] })

    const result = selectAddress({ shippingData, address: newAddress })

    expect(result?.selectedAddresses).toEqual([newAddress])
  })

  it('preserves the remaining shippingData fields', () => {
    const logistics = [makeLogisticsInfo({ itemId: 'i1' })]
    const shippingData = makeShippingData({
      availableAddresses: [makeAddress({ addressId: 'available' })],
      logisticsInfo: logistics,
    })

    const result = selectAddress({ shippingData, address: makeAddress() })

    expect(result?.logisticsInfo).toBe(logistics)
    expect(result?.availableAddresses).toEqual(shippingData.availableAddresses)
  })
})

describe('utils/shipping — getShippingInfo totalizer auto-correction', () => {
  /**
   * Contract under test: when the selected delivery option's price disagrees
   * with the existing `Shipping` totalizer, `getShippingInfo`:
   *   1. issues a corrective `updateOrderFormShipping`, AND
   *   2. **mutates the caller's `orderForm` in place** — both
   *      `orderForm.totalizers[<Shipping>].value` and `orderForm.value` are
   *      reassigned on the same object the caller passed in (see
   *      `utils/shipping.ts` lines 162-164, the `shippingTotalizer.value = ...`
   *      / `orderForm.value += ...` block).
   *
   * The in-place mutation is the only externally visible side effect of this
   * function and the rest of the resolver chain relies on it; we lock it down
   * explicitly here. If a future refactor makes `getShippingInfo` immutable,
   * the assertions below must be reworked together with every caller that
   * currently depends on the mutated `orderForm`.
   */
  const baseDeliveryAddress = makeAddress({ geoCoordinates: [] })

  const buildOrderForm = (
    deliveryPrice: number,
    totalizerValue: number
  ): CheckoutOrderForm => {
    const sla = makeSLA({ id: 'delivery-SLA', price: deliveryPrice })

    return ({
      ...EMPTY_ORDER_FORM,
      value: 1200,
      totalizers: [{ id: 'Shipping', name: 'Shipping', value: totalizerValue }],
      shippingData: makeShippingData({
        availableAddresses: [baseDeliveryAddress],
        selectedAddresses: [baseDeliveryAddress],
        logisticsInfo: [
          makeLogisticsInfo({
            slas: [sla],
            selectedSla: 'delivery-SLA',
            selectedDeliveryChannel: DELIVERY,
          }),
        ],
      }),
    } as unknown) as CheckoutOrderForm
  }

  it('calls updateOrderFormShipping and rebalances value when the totalizer is stale', async () => {
    const clientsMock = makeClientsMock()
    const orderForm = buildOrderForm(100, 50)

    // Capture the originals so we can assert *in-place mutation* below rather
    // than just value equality. The production contract is that the same
    // objects passed in come out with rewritten fields; identity checks make
    // that contract explicit and force any future immutable refactor to also
    // update this test (and the callers it documents).
    const orderFormRef = orderForm
    const totalizersRef = orderForm.totalizers
    const shippingTotalizerRef = orderForm.totalizers[0]

    const ctx = toContext(makeContext({ clients: clientsMock }))

    await getShippingInfo({ ctx, orderForm })

    expect(clientsMock.checkout.updateOrderFormShipping).toHaveBeenCalledTimes(
      1
    )
    expect(clientsMock.checkout.updateOrderFormShipping).toHaveBeenCalledWith(
      orderForm.orderFormId,
      expect.objectContaining({
        logisticsInfo: expect.any(Array),
        selectedAddresses: [baseDeliveryAddress],
      }),
      ctx
    )

    // Intentional mutation contract — see suite-level comment above.
    // We assert object identity *and* the new field values; a refactor that
    // returns a fresh orderForm/totalizer instead of mutating will fail the
    // `toBe(...Ref)` checks first, signalling that the contract changed
    // rather than the math.
    expect(orderForm).toBe(orderFormRef)
    expect(orderForm.totalizers).toBe(totalizersRef)
    expect(orderForm.totalizers[0]).toBe(shippingTotalizerRef)
    expect(shippingTotalizerRef.value).toBe(100)
    expect(orderFormRef.value).toBe(1250)
  })

  it('does not call updateOrderFormShipping when the totalizer already matches', async () => {
    const clientsMock = makeClientsMock()
    const orderForm = buildOrderForm(100, 100)

    await getShippingInfo({
      ctx: toContext(makeContext({ clients: clientsMock })),
      orderForm,
    })

    expect(clientsMock.checkout.updateOrderFormShipping).not.toHaveBeenCalled()
    expect(orderForm.value).toBe(1200)
    expect(orderForm.totalizers[0].value).toBe(100)
  })

  it('does nothing when there is no Shipping totalizer', async () => {
    const clientsMock = makeClientsMock()
    const orderForm = buildOrderForm(100, 50)
    orderForm.totalizers = []

    await getShippingInfo({
      ctx: toContext(makeContext({ clients: clientsMock })),
      orderForm,
    })

    expect(clientsMock.checkout.updateOrderFormShipping).not.toHaveBeenCalled()
    expect(orderForm.value).toBe(1200)
  })
})
