import {
  forwardCheckoutCookies,
  queries,
  syncWithStoreLocale,
} from '../resolvers/orderForm'
import { EMPTY_ORDER_FORM } from '../__fixtures__/orderForm'
import { ContextMock, makeContext, toContext } from '../__fixtures__/context'
import { BROKEN_COOKIE_EMAIL_PREFIX } from '../constants'
/**
 * Black-box tests for `queries.orderForm` and the helpers it uses
 * (`syncWithStoreLocale`, `forwardCheckoutCookies`).
 *
 * The query is the most branchy resolver in the service: it touches
 * checkout/checkoutNoCookies/apps/logger, recovers from broken cookies,
 * normalizes locale, and conditionally forwards Set-Cookie headers. These
 * branches are the riskiest place for refactors, so they get explicit
 * coverage.
 */

// `resolvers/orderForm.ts` ultimately imports `@vtex/api`, whose transitive
// `@opentelemetry/...` dep cannot be resolved by Jest 24 + Node 12. We swap in
// the lightweight manual mock from `node/__mocks__/@vtex/api.ts`.
jest.mock('@vtex/api')

const baseOrderForm = (overrides: Partial<CheckoutOrderForm> = {}) =>
  (({
    ...EMPTY_ORDER_FORM,
    clientPreferencesData: { locale: 'pt-BR', optinNewsLetter: null },
    ...overrides,
  } as unknown) as CheckoutOrderForm)

const setupQueryContext = (overrides = {}): ContextMock => {
  const ctx = makeContext(overrides)

  // Default: feature flag disabled so the optimization branch is not taken
  // unless the test explicitly opts in.
  ctx.clients.apps.getAppSettings.mockResolvedValue({
    enableOrderFormOptimization: false,
  })

  return ctx
}

describe('queries.orderForm — happy path', () => {
  it('fetches the order form via checkout.orderFormRaw and returns it', async () => {
    const ctx = setupQueryContext()
    const orderForm = baseOrderForm({ orderFormId: 'of-1' })
    ctx.clients.checkout.orderFormRaw.mockResolvedValue({
      data: orderForm,
      headers: {},
    })

    const result = await queries.orderForm(
      null,
      { orderFormId: 'of-1' },
      toContext(ctx)
    )

    expect(result).toBe(orderForm)
    expect(ctx.clients.checkout.orderFormRaw).toHaveBeenCalledWith(
      'of-1',
      undefined
    )
    expect(ctx.clients.checkoutNoCookies.orderFormRaw).not.toHaveBeenCalled()
  })

  it('forwards refreshOutdatedData to the checkout client', async () => {
    const ctx = setupQueryContext()
    ctx.clients.checkout.orderFormRaw.mockResolvedValue({
      data: baseOrderForm(),
      headers: {},
    })

    await queries.orderForm(
      null,
      { orderFormId: 'of-1', refreshOutdatedData: true },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.orderFormRaw).toHaveBeenCalledWith('of-1', true)
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupQueryContext({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkout.orderFormRaw.mockResolvedValue({
      data: baseOrderForm(),
      headers: {},
    })

    await queries.orderForm(null, {}, toContext(ctx))

    expect(ctx.clients.checkout.orderFormRaw).toHaveBeenCalledWith(
      'ctx-of',
      undefined
    )
  })

  it('does not forward checkout cookies when enableOrderFormOptimization is false', async () => {
    const ctx = setupQueryContext()
    ctx.clients.checkout.orderFormRaw.mockResolvedValue({
      data: baseOrderForm(),
      headers: {
        'set-cookie': ['checkout.vtex.com=__ofid=order-1; domain=oldhost.com'],
      },
    })

    await queries.orderForm(null, {}, toContext(ctx))

    expect(ctx.cookies.set).not.toHaveBeenCalled()
  })
})

describe('queries.orderForm — broken cookie recovery', () => {
  it('refetches via checkoutNoCookies when the email matches the broken-cookie marker', async () => {
    const ctx = setupQueryContext()

    const broken = baseOrderForm({
      orderFormId: 'broken',
      clientProfileData: ({
        email: `${BROKEN_COOKIE_EMAIL_PREFIX}-suspicious`,
      } as unknown) as CheckoutOrderForm['clientProfileData'],
    })
    const recovered = baseOrderForm({ orderFormId: 'recovered' })

    ctx.clients.checkout.orderFormRaw.mockResolvedValue({
      data: broken,
      headers: {},
    })
    ctx.clients.checkoutNoCookies.orderFormRaw.mockResolvedValue({
      data: recovered,
      headers: {},
    })

    const result = await queries.orderForm(
      null,
      { orderFormId: 'broken' },
      toContext(ctx)
    )

    expect(ctx.clients.checkoutNoCookies.orderFormRaw).toHaveBeenCalledWith(
      undefined,
      true
    )
    expect(ctx.vtex.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Broken order form' })
    )
    expect(result).toBe(recovered)
  })

  it('does not invoke recovery when the email is a regular address', async () => {
    const ctx = setupQueryContext()
    const orderForm = baseOrderForm({
      clientProfileData: ({
        email: 'real@user.com',
      } as unknown) as CheckoutOrderForm['clientProfileData'],
    })
    ctx.clients.checkout.orderFormRaw.mockResolvedValue({
      data: orderForm,
      headers: {},
    })

    await queries.orderForm(null, {}, toContext(ctx))

    expect(ctx.clients.checkoutNoCookies.orderFormRaw).not.toHaveBeenCalled()
    expect(ctx.vtex.logger.info).not.toHaveBeenCalled()
  })

  it('does not invoke recovery when clientProfileData is null', async () => {
    const ctx = setupQueryContext()
    ctx.clients.checkout.orderFormRaw.mockResolvedValue({
      data: baseOrderForm({ clientProfileData: null }),
      headers: {},
    })

    await queries.orderForm(null, {}, toContext(ctx))

    expect(ctx.clients.checkoutNoCookies.orderFormRaw).not.toHaveBeenCalled()
  })
})

describe('queries.orderForm — enableOrderFormOptimization', () => {
  const setupOptimizedContext = () => {
    const ctx = makeContext({
      headers: { 'x-forwarded-host': 'newhost.com' },
    })
    ctx.clients.apps.getAppSettings.mockResolvedValue({
      enableOrderFormOptimization: true,
    })
    return ctx
  }

  it('forwards allow-listed cookies returned by checkout.orderFormRaw', async () => {
    const ctx = setupOptimizedContext()
    ctx.clients.checkout.orderFormRaw.mockResolvedValue({
      data: baseOrderForm(),
      headers: {
        'set-cookie': [
          'checkout.vtex.com=__ofid=order-1; domain=oldhost.com; path=/',
        ],
      },
    })

    await queries.orderForm(null, {}, toContext(ctx))

    expect(ctx.cookies.set).toHaveBeenCalledTimes(1)
    expect(ctx.cookies.set).toHaveBeenCalledWith(
      'checkout.vtex.com',
      '__ofid=order-1',
      expect.objectContaining({ domain: 'newhost.com' })
    )
  })

  it('forwards cookies from the recovered response when the broken-cookie path is taken', async () => {
    const ctx = setupOptimizedContext()
    const broken = baseOrderForm({
      clientProfileData: ({
        email: `${BROKEN_COOKIE_EMAIL_PREFIX}-foo`,
      } as unknown) as CheckoutOrderForm['clientProfileData'],
    })
    ctx.clients.checkout.orderFormRaw.mockResolvedValue({
      data: broken,
      headers: {
        'set-cookie': ['checkout.vtex.com=__ofid=stale; domain=oldhost.com'],
      },
    })
    ctx.clients.checkoutNoCookies.orderFormRaw.mockResolvedValue({
      data: baseOrderForm(),
      headers: {
        'set-cookie': ['checkout.vtex.com=__ofid=fresh; domain=oldhost.com'],
      },
    })

    await queries.orderForm(null, {}, toContext(ctx))

    expect(ctx.cookies.set).toHaveBeenCalledTimes(1)
    expect(ctx.cookies.set).toHaveBeenCalledWith(
      'checkout.vtex.com',
      '__ofid=fresh',
      expect.any(Object)
    )
  })
})

describe('syncWithStoreLocale', () => {
  it('returns the original orderForm when cultureInfo matches the current locale', async () => {
    const updateMock = jest.fn()
    const orderForm = baseOrderForm({
      clientPreferencesData: { locale: 'pt-BR', optinNewsLetter: null },
    })

    const result = await syncWithStoreLocale(orderForm, 'pt-BR', ({
      updateOrderFormClientPreferencesData: updateMock,
    } as unknown) as Context['clients']['checkout'])

    expect(result).toBe(orderForm)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns the original orderForm when clientPreferencesData is missing (default to cultureInfo)', async () => {
    const updateMock = jest.fn()
    const orderForm = baseOrderForm({ clientPreferencesData: null as any })

    const result = await syncWithStoreLocale(orderForm, 'pt-BR', ({
      updateOrderFormClientPreferencesData: updateMock,
    } as unknown) as Context['clients']['checkout'])

    expect(result).toBe(orderForm)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns the original orderForm when the existing locale is empty', async () => {
    const updateMock = jest.fn()
    const orderForm = baseOrderForm({
      clientPreferencesData: { locale: '', optinNewsLetter: null } as any,
    })

    const result = await syncWithStoreLocale(orderForm, 'pt-BR', ({
      updateOrderFormClientPreferencesData: updateMock,
    } as unknown) as Context['clients']['checkout'])

    expect(result).toBe(orderForm)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('updates client preferences when locales differ and returns the updated form', async () => {
    const updated = baseOrderForm({ orderFormId: 'updated' })
    const updateMock = jest.fn().mockResolvedValue(updated)
    const orderForm = baseOrderForm({
      orderFormId: 'original',
      clientPreferencesData: { locale: 'en', optinNewsLetter: null },
    })

    const result = await syncWithStoreLocale(orderForm, 'pt-BR', ({
      updateOrderFormClientPreferencesData: updateMock,
    } as unknown) as Context['clients']['checkout'])

    expect(updateMock).toHaveBeenCalledWith('original', {
      locale: 'pt-BR',
      optinNewsLetter: null,
    })
    expect(result).toBe(updated)
  })

  it('falls back to the original orderForm when the update call rejects', async () => {
    const updateMock = jest.fn().mockRejectedValue(new Error('boom'))
    const orderForm = baseOrderForm({
      orderFormId: 'original',
      clientPreferencesData: { locale: 'en', optinNewsLetter: null },
    })

    // Suppress the expected console.error noise but make sure the function
    // still logs (documents the contract).
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    try {
      const result = await syncWithStoreLocale(orderForm, 'pt-BR', ({
        updateOrderFormClientPreferencesData: updateMock,
      } as unknown) as Context['clients']['checkout'])

      expect(result).toBe(orderForm)
      expect(consoleSpy).toHaveBeenCalled()
    } finally {
      consoleSpy.mockRestore()
    }
  })
})

describe('forwardCheckoutCookies', () => {
  const buildCtx = (host = 'newhost.com'): ContextMock =>
    makeContext({ headers: { 'x-forwarded-host': host } })

  it('forwards only allow-listed cookies', async () => {
    const ctx = buildCtx()
    const headers = {
      'set-cookie': [
        'checkout.vtex.com=__ofid=order-1; domain=oldhost.com; path=/',
        '.ASPXAUTH=hash; domain=oldhost.com; secure; httpOnly',
        'CheckoutOrderFormOwnership=owner-1; domain=oldhost.com',
        'random_cookie=foo; domain=oldhost.com',
      ],
    }

    await forwardCheckoutCookies(headers, toContext(ctx))

    expect(ctx.cookies.set).toHaveBeenCalledTimes(3)
    expect(ctx.cookies.set).toHaveBeenCalledWith(
      'checkout.vtex.com',
      '__ofid=order-1',
      expect.any(Object)
    )
    expect(ctx.cookies.set).toHaveBeenCalledWith(
      '.ASPXAUTH',
      'hash',
      expect.any(Object)
    )
    expect(ctx.cookies.set).toHaveBeenCalledWith(
      'CheckoutOrderFormOwnership',
      'owner-1',
      expect.any(Object)
    )
  })

  it('replaces the cookie domain with x-forwarded-host', async () => {
    const ctx = buildCtx('newhost.com')
    const headers = {
      'set-cookie': [
        'checkout.vtex.com=__ofid=order-1; domain=oldhost.com; path=/',
      ],
    }

    await forwardCheckoutCookies(headers, toContext(ctx))

    const [, , options] = (ctx.cookies.set as jest.Mock).mock.calls[0]

    expect(options.domain).toBe('newhost.com')
    expect(options.path).toBe('/')
    expect(options.httpOnly).toBe(true)
  })

  it('marks ctx.cookies.secure=true on first secure cookie', async () => {
    const ctx = buildCtx()
    const headers = {
      'set-cookie': ['.ASPXAUTH=hash; secure; httpOnly; domain=oldhost.com'],
    }

    expect(ctx.cookies.secure).toBe(false)

    await forwardCheckoutCookies(headers, toContext(ctx))

    expect(ctx.cookies.secure).toBe(true)
  })

  it('keeps ctx.cookies.secure=false when no cookie is secure', async () => {
    const ctx = buildCtx()
    const headers = {
      'set-cookie': [
        'checkout.vtex.com=__ofid=order; domain=oldhost.com; path=/',
      ],
    }

    await forwardCheckoutCookies(headers, toContext(ctx))

    expect(ctx.cookies.secure).toBe(false)
  })

  it('is a no-op when set-cookie is empty', async () => {
    const ctx = buildCtx()

    await forwardCheckoutCookies({ 'set-cookie': [] }, toContext(ctx))

    expect(ctx.cookies.set).not.toHaveBeenCalled()
  })

  it('is a no-op when set-cookie is missing', async () => {
    const ctx = buildCtx()

    await forwardCheckoutCookies({}, toContext(ctx))

    expect(ctx.cookies.set).not.toHaveBeenCalled()
  })

  it('is a no-op when rawHeaders is undefined', async () => {
    const ctx = buildCtx()

    await forwardCheckoutCookies(
      (undefined as unknown) as Record<string, any>,
      toContext(ctx)
    )

    expect(ctx.cookies.set).not.toHaveBeenCalled()
  })

  it('respects a custom allow list', async () => {
    const ctx = buildCtx()
    const headers = {
      'set-cookie': [
        'cookie-A=valueA; domain=oldhost.com',
        'cookie-B=valueB; domain=oldhost.com',
      ],
    }

    await forwardCheckoutCookies(headers, toContext(ctx), ['cookie-A'])

    expect(ctx.cookies.set).toHaveBeenCalledTimes(1)
    expect(ctx.cookies.set).toHaveBeenCalledWith(
      'cookie-A',
      'valueA',
      expect.any(Object)
    )
  })
})
