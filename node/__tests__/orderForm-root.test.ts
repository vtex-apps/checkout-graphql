// `resolvers/orderForm.ts` ultimately imports `@vtex/api`, whose transitive
// `@opentelemetry/...` dep cannot be resolved by Jest 24 + Node 12. We swap in
// the lightweight manual mock from `node/__mocks__/@vtex/api.ts`.
jest.mock('@vtex/api')

import { resolvers } from '../resolvers'
import { root } from '../resolvers/orderForm'
import { EMPTY_ORDER_FORM } from '../__fixtures__/orderForm'
import {
  ORDER_FORM_WITH_PICKUPS,
  deliveryAddress,
} from '../__fixtures__/shipping'
import {
  ContextMock,
  ContextOverrides,
  makeContext,
  toContext,
} from '../__fixtures__/context'
import { VTEX_SESSION } from '../constants'

const callCenterSession = {
  sessionData: {
    namespaces: {
      impersonate: { canImpersonate: { value: 'true' } },
    },
  },
  sessionToken: 'tok',
}

const regularUserSession = {
  sessionData: { namespaces: {} },
  sessionToken: 'tok',
}

/**
 * Returns a context already configured with a `vtex_session` cookie and a
 * customSession.getSession mock primed with the desired impersonation state.
 */
const ctxWithSession = (
  session:
    | typeof callCenterSession
    | typeof regularUserSession
    | undefined = regularUserSession,
  overrides: ContextOverrides = {}
): ContextMock => {
  const ctx = makeContext({
    ...overrides,
    cookies: {
      [VTEX_SESSION]: 'tok',
      ...overrides.cookies,
    },
  })

  if (session) {
    ctx.clients.customSession.getSession.mockResolvedValue(session)
  }

  return ctx
}

const orderFormFor = (
  overrides: Partial<CheckoutOrderForm> = {}
): CheckoutOrderForm =>
  (({
    ...EMPTY_ORDER_FORM,
    ...overrides,
  } as unknown) as CheckoutOrderForm)

describe('OrderForm root resolvers', () => {
  describe('id', () => {
    it('exposes orderFormId as id', () => {
      expect(root.OrderForm.id({ orderFormId: 'abc-123' } as any)).toBe(
        'abc-123'
      )
    })
  })

  describe('marketingData / storePreferencesData defaults', () => {
    it('returns an empty object when marketingData is missing', () => {
      expect(root.OrderForm.marketingData({} as any)).toEqual({})
    })

    it('returns the marketingData object when present', () => {
      const md = { coupon: 'WELCOME10' }
      expect(
        root.OrderForm.marketingData({ marketingData: md } as any)
      ).toEqual(md)
    })

    it('returns an empty object when storePreferencesData is missing', () => {
      expect(root.OrderForm.storePreferencesData({} as any)).toEqual({})
    })
  })

  describe('allowManualPrice', () => {
    it('returns false when the user is not a call center operator', async () => {
      const ctx = ctxWithSession(regularUserSession)
      const orderForm = orderFormFor({ allowManualPrice: true })

      expect(
        await root.OrderForm.allowManualPrice(orderForm, {}, toContext(ctx))
      ).toBe(false)
      expect(ctx.clients.checkoutAdmin.orderForm).not.toHaveBeenCalled()
    })

    it('returns true when call center + admin orderForm allows manual price', async () => {
      const ctx = ctxWithSession(callCenterSession)
      ctx.clients.checkoutAdmin.orderForm.mockResolvedValue({
        allowManualPrice: true,
      })
      const orderForm = orderFormFor({ allowManualPrice: false })

      expect(
        await root.OrderForm.allowManualPrice(orderForm, {}, toContext(ctx))
      ).toBe(true)
    })

    it('falls back to orderForm.allowManualPrice when admin returns false', async () => {
      const ctx = ctxWithSession(callCenterSession)
      ctx.clients.checkoutAdmin.orderForm.mockResolvedValue({
        allowManualPrice: false,
      })
      const orderForm = orderFormFor({ allowManualPrice: true })

      expect(
        await root.OrderForm.allowManualPrice(orderForm, {}, toContext(ctx))
      ).toBe(true)
    })

    it('returns false when call center but neither admin nor orderForm allow it', async () => {
      const ctx = ctxWithSession(callCenterSession)
      ctx.clients.checkoutAdmin.orderForm.mockResolvedValue({
        allowManualPrice: false,
      })
      const orderForm = orderFormFor({ allowManualPrice: false })

      expect(
        await root.OrderForm.allowManualPrice(orderForm, {}, toContext(ctx))
      ).toBe(false)
    })

    it('falls back to orderForm.allowManualPrice when admin returns null', async () => {
      const ctx = ctxWithSession(callCenterSession)
      ctx.clients.checkoutAdmin.orderForm.mockResolvedValue(null)
      const orderForm = orderFormFor({ allowManualPrice: true })

      expect(
        await root.OrderForm.allowManualPrice(orderForm, {}, toContext(ctx))
      ).toBe(true)
    })
  })

  describe('userType', () => {
    it('returns CALL_CENTER_OPERATOR for impersonating sessions', async () => {
      const ctx = ctxWithSession(callCenterSession)

      expect(
        await root.OrderForm.userType(orderFormFor(), {}, toContext(ctx))
      ).toBe('CALL_CENTER_OPERATOR')
    })

    it('returns STORE_USER for regular sessions', async () => {
      const ctx = ctxWithSession(regularUserSession)

      expect(
        await root.OrderForm.userType(orderFormFor(), {}, toContext(ctx))
      ).toBe('STORE_USER')
    })

    it('warns and returns STORE_USER when vtex_session cookie is missing', async () => {
      const ctx = makeContext()

      expect(
        await root.OrderForm.userType(
          orderFormFor({ orderFormId: 'of-1' }),
          {},
          toContext(ctx)
        )
      ).toBe('STORE_USER')
      expect(ctx.vtex.logger.warn).toHaveBeenCalledTimes(1)
      expect(ctx.vtex.logger.warn.mock.calls[0][0]).toMatch(/of-1/)
      expect(ctx.clients.customSession.getSession).not.toHaveBeenCalled()
    })
  })

  describe('messages', () => {
    const couponExpired = {
      code: 'couponExpired',
      text: 'expired',
      status: 'error',
    }
    const generalError = { code: 'itemA', text: 'a', status: 'error' }
    const ignored = {
      code: 'cannotBeDelivered',
      text: 'meh',
      status: 'error',
    }

    it('partitions messages and clears them on the checkout client', () => {
      const ctx = makeContext()
      const orderForm = orderFormFor({
        orderFormId: 'of-42',
        messages: [couponExpired, generalError, ignored],
      })

      const result = root.OrderForm.messages(orderForm, {}, toContext(ctx))

      expect(result).toEqual({
        couponMessages: [couponExpired],
        generalMessages: [generalError],
      })
      expect(ctx.clients.checkout.clearMessages).toHaveBeenCalledWith('of-42')
    })

    it('does not call clearMessages when there are no messages', () => {
      const ctx = makeContext()
      const orderForm = orderFormFor({ messages: [] })

      const result = root.OrderForm.messages(orderForm, {}, toContext(ctx))

      expect(result).toEqual({ couponMessages: [], generalMessages: [] })
      expect(ctx.clients.checkout.clearMessages).not.toHaveBeenCalled()
    })
  })

  describe('clientProfileData', () => {
    const profile = {
      email: 'a@b.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+5511999999999',
      document: '00000000000',
      documentType: 'cpf',
      corporateName: '',
      tradeName: '',
      corporateDocument: '',
      stateInscription: '',
      corporatePhone: '',
      isCorporate: false,
      profileCompleteOnLoading: true,
      profileErrorOnLoading: false,
      customerClass: '',
    } as ClientProfileData

    it('returns null when there is no client profile data', async () => {
      const ctx = makeContext()
      expect(
        await root.OrderForm.clientProfileData(
          orderFormFor({ clientProfileData: null }),
          {},
          toContext(ctx)
        )
      ).toBeNull()
    })

    it('decorates the profile with isValid=true when validation succeeds', async () => {
      // canEditData=false short-circuits the country lookup, keeping the test
      // independent from country-data-settings.
      const ctx = makeContext()
      const orderForm = orderFormFor({
        canEditData: false,
        clientProfileData: profile,
      })

      const result = await root.OrderForm.clientProfileData(
        orderForm,
        {},
        toContext(ctx)
      )

      expect(result).toEqual({ ...profile, isValid: true })
    })

    it('decorates the profile with isValid=false when required fields are missing', async () => {
      const ctx = makeContext()
      const orderForm = orderFormFor({
        canEditData: false,
        clientProfileData: { ...profile, firstName: '' } as ClientProfileData,
      })

      const result = await root.OrderForm.clientProfileData(
        orderForm,
        {},
        toContext(ctx)
      )

      expect(result).toMatchObject({ firstName: '', isValid: false })
    })
  })

  describe('shipping', () => {
    it('returns the formatted shipping shape with isValid=false for an empty order form', async () => {
      const ctx = makeContext()

      const result = await root.OrderForm.shipping(
        orderFormFor(),
        {},
        toContext(ctx)
      )

      expect(result).toEqual({
        availableAddresses: [],
        countries: [],
        deliveryOptions: [],
        pickupOptions: [],
        selectedAddress: undefined,
        isValid: false,
      })
    })

    it('marks shipping as valid when address + selected SLA + country settings line up', async () => {
      const ctx = makeContext()
      ctx.clients.countryDataSettings.getCountrySettings.mockResolvedValue({
        countryISO: 'BRA',
        addressFields: {},
        phone: { countryCode: '55', pattern: '' },
      })

      const orderForm = ({
        ...ORDER_FORM_WITH_PICKUPS,
        canEditData: false,
      } as unknown) as CheckoutOrderForm

      const result = await root.OrderForm.shipping(
        orderForm,
        {},
        toContext(ctx)
      )

      expect(result.isValid).toBe(true)
      expect(result.selectedAddress).toEqual(deliveryAddress)
      expect(result.deliveryOptions).toHaveLength(1)
      expect(result.pickupOptions).toHaveLength(1)
    })
  })

  describe('paymentData', () => {
    it('marks isValid=false when there are no payments', () => {
      const orderForm = orderFormFor()

      expect(root.OrderForm.paymentData(orderForm)).toEqual({
        ...orderForm.paymentData,
        isValid: false,
      })
    })

    it('marks isValid=true when at least one payment is present', () => {
      const payments = [{ paymentSystem: 'X' }]
      const orderForm = orderFormFor({
        paymentData: { ...EMPTY_ORDER_FORM.paymentData, payments } as any,
      })

      expect(root.OrderForm.paymentData(orderForm)).toMatchObject({
        payments,
        isValid: true,
      })
    })
  })
})

describe('ClientPreferencesData.optInNewsletter', () => {
  it('maps the lowercase-L "optinNewsLetter" field to optInNewsletter', () => {
    expect(
      root.ClientPreferencesData.optInNewsletter({
        optinNewsLetter: true,
      } as any)
    ).toBe(true)
  })

  it('returns undefined when the underlying field is missing', () => {
    expect(
      root.ClientPreferencesData.optInNewsletter({} as any)
    ).toBeUndefined()
  })
})

describe('MarketingData field resolvers', () => {
  const md = resolvers.MarketingData

  it.each([
    ['coupon', 'WELCOME10'],
    ['utmCampaign', 'campaign-1'],
    ['utmSource', 'newsletter'],
    ['utmMedium', 'email'],
    ['utmiCampaign', 'iCampaign'],
    ['utmiPart', 'iPart'],
  ] as const)(
    'returns the underlying %s value when present',
    (field, value) => {
      expect((md as any)[field]({ [field]: value })).toBe(value)
    }
  )

  it.each([
    'coupon',
    'utmCampaign',
    'utmSource',
    'utmMedium',
    'utmiCampaign',
    'utmiPart',
    'utmiPage',
  ] as const)('falls back to "" when %s is missing', field => {
    expect((md as any)[field]({})).toBe('')
  })

  it('reads utmiPage from the lowercase "utmipage" field', () => {
    expect(md.utmiPage({ utmipage: 'page-1' } as any)).toBe('page-1')
  })

  it('does NOT read utmiPage from a camelCase "utmiPage" field', () => {
    expect(md.utmiPage({ utmiPage: 'page-1' } as any)).toBe('')
  })
})
