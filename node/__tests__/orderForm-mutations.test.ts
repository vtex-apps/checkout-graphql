/**
 * Black-box tests for the mutations exported from `resolvers/orderForm.ts`.
 *
 * These resolvers are thin adapters over the checkout client, but they encode
 * a few non-trivial contracts that are easy to break in a refactor:
 *
 * 1. `updateOrderFormProfile` forwards the entire `ctx` to the checkout
 *    client (the client uses it to set ownership cookies on the response).
 * 2. `updateClientPreferencesData` translates the GraphQL camelCase
 *    `optInNewsletter` field into the legacy `optinNewsLetter` shape that the
 *    checkout REST API expects.
 * 3. Every mutation accepts an explicit `orderFormId` arg but falls back to
 *    `ctx.vtex.orderFormId` when the caller omits it.
 */

jest.mock('@vtex/api')

import { mutations } from '../resolvers/orderForm'
import { ContextMock, makeContext, toContext } from '../__fixtures__/context'
import { EMPTY_ORDER_FORM } from '../__fixtures__/orderForm'

const setupCtx = (overrides = {}): ContextMock => makeContext(overrides)

describe('mutations.updateOrderFormProfile', () => {
  it('calls checkout.updateOrderFormProfile with the orderFormId, input and ctx', async () => {
    const ctx = setupCtx()
    const updated = { ...EMPTY_ORDER_FORM, orderFormId: 'updated' }
    ctx.clients.checkout.updateOrderFormProfile.mockResolvedValue(updated)

    const input = { email: 'a@b.com', firstName: 'Ada' } as any

    const result = await mutations.updateOrderFormProfile(
      null,
      { orderFormId: 'of-1', input },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.updateOrderFormProfile).toHaveBeenCalledTimes(1)
    expect(ctx.clients.checkout.updateOrderFormProfile).toHaveBeenCalledWith(
      'of-1',
      input,
      // The resolver passes the full Context as the third arg (the client uses
      // it to forward set-cookie headers).
      toContext(ctx)
    )
    expect(result).toBe(updated)
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupCtx({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkout.updateOrderFormProfile.mockResolvedValue(
      EMPTY_ORDER_FORM
    )

    await mutations.updateOrderFormProfile(
      null,
      { input: { email: 'x@y.com' } as any },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.updateOrderFormProfile).toHaveBeenCalledWith(
      'ctx-of',
      expect.any(Object),
      expect.any(Object)
    )
  })
})

describe('mutations.updateClientPreferencesData', () => {
  it('translates optInNewsletter (camelCase) into optinNewsLetter (legacy)', async () => {
    const ctx = setupCtx()
    const updated = { ...EMPTY_ORDER_FORM, orderFormId: 'updated' }
    ctx.clients.checkout.updateOrderFormClientPreferencesData.mockResolvedValue(
      updated
    )

    const result = await mutations.updateClientPreferencesData(
      null,
      {
        orderFormId: 'of-1',
        input: { optInNewsletter: true, locale: 'pt-BR' } as any,
      },
      toContext(ctx)
    )

    expect(
      ctx.clients.checkout.updateOrderFormClientPreferencesData
    ).toHaveBeenCalledWith('of-1', {
      optinNewsLetter: true,
      locale: 'pt-BR',
    })
    expect(result).toBe(updated)
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupCtx({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkout.updateOrderFormClientPreferencesData.mockResolvedValue(
      EMPTY_ORDER_FORM
    )

    await mutations.updateClientPreferencesData(
      null,
      { input: { optInNewsletter: false, locale: 'en' } as any },
      toContext(ctx)
    )

    expect(
      ctx.clients.checkout.updateOrderFormClientPreferencesData
    ).toHaveBeenCalledWith(
      'ctx-of',
      expect.objectContaining({ optinNewsLetter: false, locale: 'en' })
    )
  })
})

describe('mutations.updateOrderFormPayment', () => {
  it('forwards orderFormId and input to checkout.updateOrderFormPayment', async () => {
    const ctx = setupCtx()
    const updated = { ...EMPTY_ORDER_FORM, orderFormId: 'updated' }
    ctx.clients.checkout.updateOrderFormPayment.mockResolvedValue(updated)

    const input = { payments: [{ paymentSystem: '1' }] } as any

    const result = await mutations.updateOrderFormPayment(
      null,
      { orderFormId: 'of-1', input },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.updateOrderFormPayment).toHaveBeenCalledWith(
      'of-1',
      input
    )
    expect(result).toBe(updated)
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupCtx({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkout.updateOrderFormPayment.mockResolvedValue(
      EMPTY_ORDER_FORM
    )

    await mutations.updateOrderFormPayment(
      null,
      { input: { payments: [] } as any },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.updateOrderFormPayment).toHaveBeenCalledWith(
      'ctx-of',
      expect.any(Object)
    )
  })
})

describe('mutations.updateItemsOrdination', () => {
  it('forwards orderFormId, ascending and criteria to the checkout client', async () => {
    const ctx = setupCtx()
    const updated = { ...EMPTY_ORDER_FORM, orderFormId: 'updated' }
    ctx.clients.checkout.updateItemsOrdination.mockResolvedValue(updated)

    const result = await mutations.updateItemsOrdination(
      null,
      { orderFormId: 'of-1', ascending: true, criteria: 'PRICE' as any },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.updateItemsOrdination).toHaveBeenCalledWith(
      'of-1',
      true,
      'PRICE'
    )
    expect(result).toBe(updated)
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupCtx({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkout.updateItemsOrdination.mockResolvedValue(
      EMPTY_ORDER_FORM
    )

    await mutations.updateItemsOrdination(
      null,
      { ascending: false, criteria: 'NAME' as any },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.updateItemsOrdination).toHaveBeenCalledWith(
      'ctx-of',
      false,
      'NAME'
    )
  })
})

describe('mutations.clearOrderFormMessages', () => {
  it('forwards orderFormId to checkout.clearMessages and returns its result', async () => {
    const ctx = setupCtx()
    const cleared = { ...EMPTY_ORDER_FORM, messages: [] }
    ctx.clients.checkout.clearMessages.mockResolvedValue(cleared)

    const result = await mutations.clearOrderFormMessages(
      null,
      { orderFormId: 'of-1' },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.clearMessages).toHaveBeenCalledWith('of-1')
    expect(result).toBe(cleared)
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupCtx({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkout.clearMessages.mockResolvedValue(EMPTY_ORDER_FORM)

    await mutations.clearOrderFormMessages(null, {}, toContext(ctx))

    expect(ctx.clients.checkout.clearMessages).toHaveBeenCalledWith('ctx-of')
  })
})

describe('mutations.updateOrderFormOpenTextField', () => {
  it('forwards orderFormId and input to checkout.updateOrderFromOpenTextField', async () => {
    const ctx = setupCtx()
    const updated = { ...EMPTY_ORDER_FORM, orderFormId: 'updated' }
    ctx.clients.checkout.updateOrderFromOpenTextField.mockResolvedValue(updated)

    const input = { value: 'hello' } as any

    const result = await mutations.updateOrderFormOpenTextField(
      null,
      { orderFormId: 'of-1', input },
      toContext(ctx)
    )

    expect(
      ctx.clients.checkout.updateOrderFromOpenTextField
    ).toHaveBeenCalledWith('of-1', input)
    expect(result).toBe(updated)
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupCtx({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkout.updateOrderFromOpenTextField.mockResolvedValue(
      EMPTY_ORDER_FORM
    )

    await mutations.updateOrderFormOpenTextField(
      null,
      { input: { value: 'a' } as any },
      toContext(ctx)
    )

    expect(
      ctx.clients.checkout.updateOrderFromOpenTextField
    ).toHaveBeenCalledWith('ctx-of', expect.any(Object))
  })
})

describe('mutations.updateOrderFormMarketingData', () => {
  it('forwards orderFormId and input to checkout.updateOrderFormMarketingData', async () => {
    const ctx = setupCtx()
    const updated = { ...EMPTY_ORDER_FORM, orderFormId: 'updated' }
    ctx.clients.checkout.updateOrderFormMarketingData.mockResolvedValue(updated)

    const input = { utmSource: 'newsletter', utmCampaign: 'spring' } as any

    const result = await mutations.updateOrderFormMarketingData(
      null,
      { orderFormId: 'of-1', input },
      toContext(ctx)
    )

    expect(
      ctx.clients.checkout.updateOrderFormMarketingData
    ).toHaveBeenCalledWith('of-1', input)
    expect(result).toBe(updated)
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupCtx({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkout.updateOrderFormMarketingData.mockResolvedValue(
      EMPTY_ORDER_FORM
    )

    await mutations.updateOrderFormMarketingData(
      null,
      { input: { utmSource: 'x' } as any },
      toContext(ctx)
    )

    expect(
      ctx.clients.checkout.updateOrderFormMarketingData
    ).toHaveBeenCalledWith('ctx-of', expect.any(Object))
  })
})
