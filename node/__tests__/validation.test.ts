import {
  isPaymentValid,
  isProfileValid,
  isShippingValid,
} from '../utils/validation'
import { makeContext, toContext } from '../__fixtures__/context'

/**
 * Reusable address that satisfies the `validCountrySchema` below.
 * Tests override individual fields to exercise specific branches.
 */
const validAddress: CheckoutAddress = {
  addressId: '1',
  addressType: 'residential',
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
}

const validCountrySchema = {
  countryISO: 'BRA',
  addressFields: {
    country: { label: 'country', required: true },
    city: { label: 'city', required: true, maxLength: 50 },
    street: { label: 'street', required: true },
    postalCode: { label: 'postalCode', required: true, maxLength: 9 },
  },
  phone: { countryCode: '55', pattern: '^\\+55\\d{10,11}$' },
}

const validProfile = {
  firstName: 'John',
  lastName: 'Doe',
  phone: '+5511999999999',
  document: '00000000000',
  documentType: 'cpf',
} as ClientProfileData

describe('utils/validation', () => {
  describe('isPaymentValid', () => {
    it('returns false when there are no payments', () => {
      expect(isPaymentValid({ payments: [] } as any)).toBe(false)
    })

    it('returns true when there is at least one payment', () => {
      expect(
        isPaymentValid({ payments: [{ paymentSystem: 'X' }] } as any)
      ).toBe(true)
    })
  })

  describe('isProfileValid', () => {
    it('returns false when the profile is null', async () => {
      const ctx = makeContext()
      expect(
        await isProfileValid(
          { canEditData: true } as any,
          (null as unknown) as ClientProfileData,
          toContext(ctx)
        )
      ).toBe(false)
    })

    it.each([
      'firstName',
      'lastName',
      'phone',
      'document',
      'documentType',
    ] as const)('returns false when "%s" is missing', async field => {
      const ctx = makeContext()
      const profile = { ...validProfile, [field]: '' } as ClientProfileData
      expect(
        await isProfileValid(
          { canEditData: true } as any,
          profile,
          toContext(ctx)
        )
      ).toBe(false)
    })

    it('short-circuits to true when canEditData=false and required fields are present', async () => {
      const ctx = makeContext()
      expect(
        await isProfileValid(
          { canEditData: false } as any,
          validProfile,
          toContext(ctx)
        )
      ).toBe(true)
      expect(
        ctx.clients.countryDataSettings.getAllCountriesSettings
      ).not.toHaveBeenCalled()
    })

    it('returns false when phone does not match any country code', async () => {
      const ctx = makeContext()
      ctx.clients.countryDataSettings.getAllCountriesSettings.mockResolvedValue(
        [validCountrySchema]
      )
      const profile = {
        ...validProfile,
        phone: '+9999999999',
      } as ClientProfileData
      expect(
        await isProfileValid(
          { canEditData: true } as any,
          profile,
          toContext(ctx)
        )
      ).toBe(false)
    })

    it('returns false when phone matches the country code but not the pattern', async () => {
      const ctx = makeContext()
      ctx.clients.countryDataSettings.getAllCountriesSettings.mockResolvedValue(
        [validCountrySchema]
      )
      const profile = { ...validProfile, phone: '+551' } as ClientProfileData
      expect(
        await isProfileValid(
          { canEditData: true } as any,
          profile,
          toContext(ctx)
        )
      ).toBe(false)
    })

    it('returns true when phone matches both the country code and the pattern', async () => {
      const ctx = makeContext()
      ctx.clients.countryDataSettings.getAllCountriesSettings.mockResolvedValue(
        [validCountrySchema]
      )
      expect(
        await isProfileValid(
          { canEditData: true } as any,
          validProfile,
          toContext(ctx)
        )
      ).toBe(true)
    })
  })

  describe('isShippingValid', () => {
    const selectedDelivery = { isSelected: true } as any
    const selectedPickup = { isSelected: true } as any

    it('returns false without a selectedAddress', async () => {
      const ctx = makeContext()
      expect(
        await isShippingValid(
          { canEditData: true } as any,
          {
            deliveryOptions: [selectedDelivery],
            pickupOptions: [],
          } as any,
          toContext(ctx)
        )
      ).toBe(false)
    })

    it('returns false when no delivery or pickup option is selected', async () => {
      const ctx = makeContext()
      expect(
        await isShippingValid(
          { canEditData: true } as any,
          {
            selectedAddress: validAddress,
            deliveryOptions: [{ isSelected: false } as any],
            pickupOptions: [{ isSelected: false } as any],
          } as any,
          toContext(ctx)
        )
      ).toBe(false)
    })

    it('accepts a selected pickup option', async () => {
      const ctx = makeContext()
      ctx.clients.countryDataSettings.getCountrySettings.mockResolvedValue(
        validCountrySchema
      )
      expect(
        await isShippingValid(
          { canEditData: true } as any,
          {
            selectedAddress: validAddress,
            deliveryOptions: [],
            pickupOptions: [selectedPickup],
          } as any,
          toContext(ctx)
        )
      ).toBe(true)
    })

    it('short-circuits to true when canEditData=false and address is not disposable', async () => {
      const ctx = makeContext()
      expect(
        await isShippingValid(
          { canEditData: false } as any,
          {
            selectedAddress: { ...validAddress, isDisposable: false },
            deliveryOptions: [selectedDelivery],
            pickupOptions: [],
          } as any,
          toContext(ctx)
        )
      ).toBe(true)
      expect(
        ctx.clients.countryDataSettings.getCountrySettings
      ).not.toHaveBeenCalled()
    })

    it('keeps validating when canEditData=false but address is disposable', async () => {
      const ctx = makeContext()
      ctx.clients.countryDataSettings.getCountrySettings.mockResolvedValue(
        validCountrySchema
      )
      expect(
        await isShippingValid(
          { canEditData: false } as any,
          {
            selectedAddress: { ...validAddress, isDisposable: true },
            deliveryOptions: [selectedDelivery],
            pickupOptions: [],
          } as any,
          toContext(ctx)
        )
      ).toBe(true)
      expect(
        ctx.clients.countryDataSettings.getCountrySettings
      ).toHaveBeenCalledWith('BRA')
    })

    it('returns false when country is empty', async () => {
      const ctx = makeContext()
      expect(
        await isShippingValid(
          { canEditData: true } as any,
          {
            selectedAddress: { ...validAddress, country: '' },
            deliveryOptions: [selectedDelivery],
            pickupOptions: [],
          } as any,
          toContext(ctx)
        )
      ).toBe(false)
    })

    it('returns false when country settings cannot be loaded', async () => {
      const ctx = makeContext()
      ctx.clients.countryDataSettings.getCountrySettings.mockResolvedValue(null)
      expect(
        await isShippingValid(
          { canEditData: true } as any,
          {
            selectedAddress: validAddress,
            deliveryOptions: [selectedDelivery],
            pickupOptions: [],
          } as any,
          toContext(ctx)
        )
      ).toBe(false)
    })

    it('returns false when a required field is missing', async () => {
      const ctx = makeContext()
      ctx.clients.countryDataSettings.getCountrySettings.mockResolvedValue(
        validCountrySchema
      )
      expect(
        await isShippingValid(
          { canEditData: true } as any,
          {
            selectedAddress: { ...validAddress, street: '' },
            deliveryOptions: [selectedDelivery],
            pickupOptions: [],
          } as any,
          toContext(ctx)
        )
      ).toBe(false)
    })

    it('returns false when a field exceeds maxLength', async () => {
      const ctx = makeContext()
      ctx.clients.countryDataSettings.getCountrySettings.mockResolvedValue(
        validCountrySchema
      )
      expect(
        await isShippingValid(
          { canEditData: true } as any,
          {
            selectedAddress: {
              ...validAddress,
              postalCode: '01234567890123',
            },
            deliveryOptions: [selectedDelivery],
            pickupOptions: [],
          } as any,
          toContext(ctx)
        )
      ).toBe(false)
    })

    it('returns true on the happy path (canEditData=true, valid address)', async () => {
      const ctx = makeContext()
      ctx.clients.countryDataSettings.getCountrySettings.mockResolvedValue(
        validCountrySchema
      )
      expect(
        await isShippingValid(
          { canEditData: true } as any,
          {
            selectedAddress: validAddress,
            deliveryOptions: [selectedDelivery],
            pickupOptions: [],
          } as any,
          toContext(ctx)
        )
      ).toBe(true)
    })
  })
})
