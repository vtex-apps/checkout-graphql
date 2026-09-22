import { keepLocale } from '../clients/locale'

/**
 * `keepLocale` is what lets routes whose verb has no raw variant (`patch`,
 * used by `addItem` and `updateItems`) see the `CheckoutLocale` that Checkout
 * issues back. It runs as a client middleware, so these tests drive it the way
 * koa-compose does: call it with a middleware context and a `next` that
 * populates the response.
 */

const makeIOContext = (checkoutLocale?: string) =>
  (({ checkoutLocale } as unknown) as CustomIOContext)

const makeMiddlewareContext = (setCookies?: string[]) =>
  ({
    config: { url: '/api/checkout/pub/orderForm/of-1/items' },
    response: setCookies
      ? { headers: { 'set-cookie': setCookies } }
      : undefined,
  } as any)

const runMiddleware = async (
  ioContext: CustomIOContext,
  setCookies?: string[]
) => {
  const middlewareContext = makeMiddlewareContext()
  const next = jest.fn(async () => {
    // The response only exists once the downstream middlewares have run.
    middlewareContext.response = makeMiddlewareContext(setCookies).response
  })

  await keepLocale(ioContext)(middlewareContext, next)

  return { middlewareContext, next }
}

describe('keepLocale', () => {
  it('adopts a locale issued by any checkout route', async () => {
    const ioContext = makeIOContext()

    await runMiddleware(ioContext, [
      'CheckoutLocale=fr-CA; domain=host.com; path=/',
    ])

    expect(ioContext.checkoutLocale).toBe('fr-CA')
  })

  it('replaces a stale locale with the one just rotated', async () => {
    const ioContext = makeIOContext('en-CA')

    await runMiddleware(ioContext, ['CheckoutLocale=fr-CA; domain=host.com'])

    expect(ioContext.checkoutLocale).toBe('fr-CA')
  })

  it('waits for the downstream middlewares before reading the response', async () => {
    const ioContext = makeIOContext()

    const { next } = await runMiddleware(ioContext, [
      'CheckoutLocale=fr-CA; domain=host.com',
    ])

    expect(next).toHaveBeenCalledTimes(1)
    expect(ioContext.checkoutLocale).toBe('fr-CA')
  })

  it('keeps the current locale when checkout returns an empty one', async () => {
    const ioContext = makeIOContext('fr-CA')

    await runMiddleware(ioContext, ['CheckoutLocale=; domain=host.com'])

    expect(ioContext.checkoutLocale).toBe('fr-CA')
  })

  it('ignores cookies other than the locale one', async () => {
    const ioContext = makeIOContext('fr-CA')

    await runMiddleware(ioContext, [
      'checkout.vtex.com=__ofid=order-1; domain=host.com',
      'CheckoutOrderFormOwnership=owner-1; domain=host.com',
    ])

    expect(ioContext.checkoutLocale).toBe('fr-CA')
  })

  it('is a no-op when the response carries no cookies', async () => {
    const ioContext = makeIOContext('fr-CA')

    await runMiddleware(ioContext, [])

    expect(ioContext.checkoutLocale).toBe('fr-CA')
  })

  it('is a no-op when the request produced no response', async () => {
    const ioContext = makeIOContext('fr-CA')

    await runMiddleware(ioContext)

    expect(ioContext.checkoutLocale).toBe('fr-CA')
  })
})
