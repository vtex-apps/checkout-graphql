import { keepOwnership } from '../clients/ownership'

/**
 * `keepOwnership` is the only place that captures `CheckoutOrderFormOwnership`
 * for routes whose verb has no raw variant (`patch`, used by `addItem` and
 * `updateItems`). It runs as a client middleware, so these tests drive it the
 * way koa-compose does: call it with a middleware context and a `next` that
 * populates the response.
 */

const makeIOContext = (ownerId?: string) =>
  (({
    ownerId,
    logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
  } as unknown) as CustomIOContext)

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

  await keepOwnership(ioContext)(middlewareContext, next)

  return { middlewareContext, next }
}

describe('keepOwnership', () => {
  it('adopts an ownership issued by any checkout route', async () => {
    const ioContext = makeIOContext()

    await runMiddleware(ioContext, [
      'CheckoutOrderFormOwnership=owner-1; domain=host.com; path=/',
    ])

    expect(ioContext.ownerId).toBe('owner-1')
  })

  it('replaces a stale ownership with the one just rotated', async () => {
    const ioContext = makeIOContext('owner-1')

    await runMiddleware(ioContext, [
      'CheckoutOrderFormOwnership=owner-2; domain=host.com',
    ])

    expect(ioContext.ownerId).toBe('owner-2')
  })

  it('waits for the downstream middlewares before reading the response', async () => {
    const ioContext = makeIOContext()

    const { next } = await runMiddleware(ioContext, [
      'CheckoutOrderFormOwnership=owner-1; domain=host.com',
    ])

    expect(next).toHaveBeenCalledTimes(1)
    expect(ioContext.ownerId).toBe('owner-1')
  })

  it('keeps the current ownership when checkout returns an empty one', async () => {
    const ioContext = makeIOContext('owner-1')

    await runMiddleware(ioContext, [
      'CheckoutOrderFormOwnership=; domain=host.com',
    ])

    expect(ioContext.ownerId).toBe('owner-1')
    expect(ioContext.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Checkout returned an empty ownership cookie; keeping the current one',
      })
    )
  })

  it('stays quiet when checkout returns an empty ownership and there is none to lose', async () => {
    const ioContext = makeIOContext()

    await runMiddleware(ioContext, [
      'CheckoutOrderFormOwnership=; domain=host.com',
    ])

    expect(ioContext.ownerId).toBeUndefined()
    expect(ioContext.logger.warn).not.toHaveBeenCalled()
  })

  it('ignores cookies other than the ownership one', async () => {
    const ioContext = makeIOContext('owner-1')

    await runMiddleware(ioContext, [
      'checkout.vtex.com=__ofid=order-1; domain=host.com',
      '.ASPXAUTH=hash; domain=host.com',
    ])

    expect(ioContext.ownerId).toBe('owner-1')
    expect(ioContext.logger.warn).not.toHaveBeenCalled()
  })

  it('is a no-op when the response carries no cookies', async () => {
    const ioContext = makeIOContext('owner-1')

    await runMiddleware(ioContext, [])

    expect(ioContext.ownerId).toBe('owner-1')
    expect(ioContext.logger.warn).not.toHaveBeenCalled()
  })

  it('is a no-op when the request produced no response', async () => {
    const ioContext = makeIOContext('owner-1')

    await runMiddleware(ioContext)

    expect(ioContext.ownerId).toBe('owner-1')
    expect(ioContext.logger.warn).not.toHaveBeenCalled()
  })
})
