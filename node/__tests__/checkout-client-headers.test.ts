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
  interface ClientInternals {
    http: { patch: jest.Mock }
  }

  const build = (context: Partial<CustomIOContext> = {}) => {
    const client = new Checkout(({
      segmentToken: 'segment-token',
      sessionToken: 'session-token',
      ...context,
    } as unknown) as IOContext)

    const patch = jest.fn().mockResolvedValue({})
    ;((client as unknown) as ClientInternals).http = { patch }

    return { client, patch }
  }

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
})
