/**
 * Black-box tests for the `Cookie` header the checkout client sends upstream.
 *
 * `getCommonHeaders` is the one place that turns the request context into the
 * cookies every Checkout route carries, so a cookie that is read into the
 * context but never makes it here is silently dropped. The `@vtex/api` stub
 * keeps the constructor arguments, so a client can be built from a bare
 * context, given an `http` double and asked what it would have sent.
 */

import { IOContext } from '@vtex/api'

import { Checkout } from '../clients/checkout'

jest.mock('@vtex/api')

describe('the checkout client', () => {
  type Verb = 'get' | 'post' | 'postRaw' | 'put' | 'delete' | 'patch'

  interface ClientInternals {
    http: Record<Verb, jest.Mock>
  }

  const build = (context: Partial<CustomIOContext> = {}) => {
    const client = new Checkout(({
      segmentToken: 'segment-token',
      sessionToken: 'session-token',
      ...context,
    } as unknown) as IOContext)

    const http = {
      get: jest.fn().mockResolvedValue({}),
      post: jest.fn().mockResolvedValue({}),
      postRaw: jest.fn().mockResolvedValue({}),
      put: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      patch: jest.fn().mockResolvedValue({}),
    }
    ;((client as unknown) as ClientInternals).http = http

    return { client, http, patch: http.patch }
  }

  /**
   * One public method per HTTP verb: each verb wrapper merges
   * `getCommonHeaders()` on its own, so every one needs a test.
   */
  const callByVerb: Array<[Verb, (client: Checkout) => Promise<unknown>]> = [
    ['get', client => client.getProfile('shopper@example.com')],
    ['post', client => client.orderForm('of-1')],
    ['postRaw', client => client.orderFormRaw('of-1')],
    ['put', client => client.setOrderFormCustomData('of-1', 'app', 'field', 1)],
    ['delete', client => client.removeAssemblyOptions('of-1', 1, 'opt', {})],
    ['patch', client => client.addItem('of-1', [])],
  ]

  // Janus reads these names case-insensitively, so compare them lower-cased.
  const authHeaderNames = ['vtexidclientautcookie', 'authorization']

  const headerNamesOf = (headers: Record<string, unknown> = {}) =>
    Object.keys(headers).map(name => name.toLowerCase())

  const cookieHeaderOf = (patch: jest.Mock): string => {
    const [[, , config]] = patch.mock.calls

    return config.headers.Cookie
  }

  it('carries the locale cookie next to the orderForm and ownership ones', async () => {
    const { client, patch } = build({
      orderFormId: 'of-1',
      ownerId: 'owner-1',
      checkoutLocale: 'fr-CA',
    })

    await client.addItem('of-1', [])

    const cookie = cookieHeaderOf(patch)

    expect(cookie).toContain('checkout.vtex.com=__ofid=of-1;')
    expect(cookie).toContain('CheckoutOrderFormOwnership=owner-1;')
    expect(cookie).toContain('CheckoutLocale=fr-CA;')
    expect(cookie).toContain('vtex_segment=segment-token;')
  })

  it('omits the locale cookie when the request holds none', async () => {
    const { client, patch } = build({ orderFormId: 'of-1' })

    await client.addItem('of-1', [])

    expect(cookieHeaderOf(patch)).not.toContain('CheckoutLocale')
  })

  it.each(callByVerb)(
    'sends the shopper token as the account cookie on %s, never as a header',
    async (verb, call) => {
      const { client, http } = build({
        account: 'piononob2b',
        storeUserAuthToken: 'store-token',
      })

      await call(client)

      const { calls } = http[verb].mock
      const config = calls[0][calls[0].length - 1]

      expect(config.headers.Cookie).toContain(
        'VtexIdclientAutCookie_piononob2b=store-token;'
      )
      authHeaderNames.forEach(name =>
        expect(headerNamesOf(config.headers)).not.toContain(name)
      )
    }
  )

  it('leaves the constructor headers free of the shopper token', () => {
    const client = new Checkout(({
      account: 'piononob2b',
      storeUserAuthToken: 'store-token',
    } as unknown) as IOContext)

    const { options } = (client as unknown) as {
      options?: { headers?: Record<string, string> }
    }

    authHeaderNames.forEach(name =>
      expect(headerNamesOf(options?.headers)).not.toContain(name)
    )
  })

  it('omits the account cookie when the request holds no shopper token', async () => {
    const { client, patch } = build({ account: 'piononob2b' })

    await client.addItem('of-1', [])

    expect(cookieHeaderOf(patch)).not.toContain('VtexIdclientAutCookie_')
  })
})
