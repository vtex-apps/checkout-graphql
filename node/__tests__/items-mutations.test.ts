/**
 * Black-box tests for the mutations exported from `resolvers/items.ts`.
 *
 * The big one is `addToCart`, which orchestrates several checkout calls in a
 * specific order:
 *
 *   1. `checkout.orderForm` to snapshot the previous items.
 *   2. `checkout.addItem` with the cleaned input (options/index/uniqueId
 *      stripped).
 *   3. (optional) `checkout.updateOrderFormMarketingData` when the caller
 *      passes any marketing data — and it MUST NOT bubble errors.
 *   4. (optional) `addOptionsForItems` + `checkout.updateSubscriptionDataField`
 *      when items carry assembly options. When this branch is taken, the
 *      resolver returns a fresh `checkout.orderForm` snapshot rather than the
 *      `addItem` response.
 *
 * `updateItems` has two non-trivial behaviors that are easy to miss:
 *
 *   1. When a single item with a defined `index` targets a subscription item
 *      (the existing item has an attachment whose name includes
 *      `vtex.subscription`), `splitItem` is forced to `false`.
 *   2. When the input items omit `index` but provide `uniqueId`, the missing
 *      indices are filled in from the current orderForm.
 */

jest.mock('@vtex/api')

// Isolate the resolver under test from the real assembly-options helper.
// `attachmentsHelpers` has its own (future) coverage; here we only need to
// observe that it is invoked with the right shape.
jest.mock('../utils/attachmentsHelpers', () => ({
  addOptionsForItems: jest.fn().mockResolvedValue(undefined),
}))

import { mutations } from '../resolvers/items'
import { addOptionsForItems } from '../utils/attachmentsHelpers'
import {
  ContextMock,
  makeContext,
  toContext,
} from '../__fixtures__/context'
import { EMPTY_ORDER_FORM } from '../__fixtures__/orderForm'

const setupCtx = (overrides = {}): ContextMock => makeContext(overrides)

const orderFormWith = (
  partial: Partial<typeof EMPTY_ORDER_FORM> = {}
): CheckoutOrderForm =>
  (({ ...EMPTY_ORDER_FORM, ...partial } as unknown) as CheckoutOrderForm)

beforeEach(() => {
  ;(addOptionsForItems as jest.Mock).mockClear()
})

describe('mutations.addToCart — happy path (no options, no marketing)', () => {
  it('snapshots previous items, calls addItem with cleaned items, and returns the addItem response', async () => {
    const ctx = setupCtx()

    const previous = orderFormWith({ items: [] })
    const added = orderFormWith({ orderFormId: 'after-add', items: [] })
    ctx.clients.checkout.orderForm.mockResolvedValue(previous)
    ctx.clients.checkout.addItem.mockResolvedValue(added)

    const items = [
      // Caller-provided fields that must be stripped before reaching addItem.
      {
        id: 'sku-1',
        quantity: 1,
        seller: '1',
        index: 5,
        uniqueId: 'unique-from-caller',
      },
    ] as any

    const result = await mutations.addToCart(
      null,
      { orderFormId: 'of-1', items, salesChannel: '2' },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.orderForm).toHaveBeenCalledTimes(1)
    expect(ctx.clients.checkout.orderForm).toHaveBeenCalledWith('of-1')
    expect(ctx.clients.checkout.addItem).toHaveBeenCalledWith(
      'of-1',
      [{ id: 'sku-1', quantity: 1, seller: '1' }],
      '2',
      undefined
    )
    expect(
      ctx.clients.checkout.updateOrderFormMarketingData
    ).not.toHaveBeenCalled()
    expect(addOptionsForItems).not.toHaveBeenCalled()
    expect(result).toBe(added)
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupCtx({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkout.orderForm.mockResolvedValue(orderFormWith())
    ctx.clients.checkout.addItem.mockResolvedValue(orderFormWith())

    await mutations.addToCart(
      null,
      { items: [{ id: 'sku', quantity: 1, seller: '1' }] as any },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.orderForm).toHaveBeenCalledWith('ctx-of')
    expect(ctx.clients.checkout.addItem).toHaveBeenCalledWith(
      'ctx-of',
      expect.any(Array),
      undefined,
      undefined
    )
  })

  it('forwards allowedOutdatedData to checkout.addItem', async () => {
    const ctx = setupCtx()
    ctx.clients.checkout.orderForm.mockResolvedValue(orderFormWith())
    ctx.clients.checkout.addItem.mockResolvedValue(orderFormWith())

    await mutations.addToCart(
      null,
      {
        orderFormId: 'of-1',
        items: [{ id: 'sku', quantity: 1, seller: '1' }] as any,
        allowedOutdatedData: ['paymentData'],
      },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.addItem).toHaveBeenCalledWith(
      'of-1',
      expect.any(Array),
      undefined,
      ['paymentData']
    )
  })
})

describe('mutations.addToCart — marketingData', () => {
  it('updates marketing data when the input is non-empty and returns the marketing response', async () => {
    const ctx = setupCtx()
    ctx.clients.checkout.orderForm.mockResolvedValue(orderFormWith())
    ctx.clients.checkout.addItem.mockResolvedValue(
      orderFormWith({ orderFormId: 'after-add' })
    )
    const afterMarketing = orderFormWith({ orderFormId: 'after-marketing' })
    ctx.clients.checkout.updateOrderFormMarketingData.mockResolvedValue(
      afterMarketing
    )

    const result = await mutations.addToCart(
      null,
      {
        orderFormId: 'of-1',
        items: [{ id: 'sku', quantity: 1, seller: '1' }] as any,
        marketingData: { utmSource: 'newsletter' } as any,
      },
      toContext(ctx)
    )

    expect(
      ctx.clients.checkout.updateOrderFormMarketingData
    ).toHaveBeenCalledWith('of-1', { utmSource: 'newsletter' })
    expect(result).toBe(afterMarketing)
  })

  it('skips marketing when the input is an empty object', async () => {
    const ctx = setupCtx()
    ctx.clients.checkout.orderForm.mockResolvedValue(orderFormWith())
    ctx.clients.checkout.addItem.mockResolvedValue(orderFormWith())

    await mutations.addToCart(
      null,
      {
        orderFormId: 'of-1',
        items: [{ id: 'sku', quantity: 1, seller: '1' }] as any,
        marketingData: {} as any,
      },
      toContext(ctx)
    )

    expect(
      ctx.clients.checkout.updateOrderFormMarketingData
    ).not.toHaveBeenCalled()
  })

  it('logs and swallows errors from updateOrderFormMarketingData, returning the addItem response', async () => {
    const ctx = setupCtx()
    const added = orderFormWith({ orderFormId: 'after-add' })
    ctx.clients.checkout.orderForm.mockResolvedValue(orderFormWith())
    ctx.clients.checkout.addItem.mockResolvedValue(added)
    const failure = new Error('boom')
    ctx.clients.checkout.updateOrderFormMarketingData.mockRejectedValue(failure)

    const result = await mutations.addToCart(
      null,
      {
        orderFormId: 'of-1',
        items: [{ id: 'sku', quantity: 1, seller: '1' }] as any,
        marketingData: { utmSource: 'src' } as any,
      },
      toContext(ctx)
    )

    expect(ctx.vtex.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error when updating orderForm marketing data.',
        id: 'of-1',
        graphqlArgs: { utmSource: 'src' },
        originalError: failure,
      })
    )
    expect(result).toBe(added)
  })
})

describe('mutations.addToCart — items with options', () => {
  it('invokes addOptionsForItems with the items that carry options and returns a fresh orderForm snapshot', async () => {
    const ctx = setupCtx()

    const previous = orderFormWith({ items: [] })
    const added = orderFormWith({ orderFormId: 'after-add' })
    const fresh = orderFormWith({ orderFormId: 'fresh-snapshot' })

    // checkout.orderForm is called twice: once before addItem, once at the end.
    ctx.clients.checkout.orderForm
      .mockResolvedValueOnce(previous)
      .mockResolvedValueOnce(fresh)
    ctx.clients.checkout.addItem.mockResolvedValue(added)

    const itemWithOptions = {
      id: 'parent-1',
      quantity: 1,
      seller: '1',
      options: [
        {
          assemblyId: 'addon-glaze',
          id: 'glaze-1',
          quantity: 1,
          seller: '1',
          inputValues: {},
        },
      ],
    } as any

    const itemWithoutOptions = {
      id: 'plain-1',
      quantity: 2,
      seller: '1',
    } as any

    const result = await mutations.addToCart(
      null,
      { orderFormId: 'of-1', items: [itemWithOptions, itemWithoutOptions] },
      toContext(ctx)
    )

    expect(addOptionsForItems).toHaveBeenCalledTimes(1)
    const [withOptionsArg, checkoutArg, formArg, oldItemsArg] = (addOptionsForItems as jest.Mock).mock.calls[0]
    expect(withOptionsArg).toHaveLength(1)
    expect(withOptionsArg[0]).toEqual(
      expect.objectContaining({ id: 'parent-1', index: 0 })
    )
    expect(checkoutArg).toBe(ctx.clients.checkout)
    expect(formArg).toEqual(
      expect.objectContaining({ orderFormId: 'of-1' })
    )
    expect(oldItemsArg).toEqual([])

    expect(ctx.clients.checkout.orderForm).toHaveBeenCalledTimes(2)
    expect(result).toBe(fresh)
  })

  it('writes a subscription data entry when an option references vtex.subscription', async () => {
    const ctx = setupCtx()

    const previous = orderFormWith({ items: [] })
    const added = orderFormWith({
      orderFormId: 'after-add',
      subscriptionData: null,
    })
    const fresh = orderFormWith({ orderFormId: 'fresh-snapshot' })

    ctx.clients.checkout.orderForm
      .mockResolvedValueOnce(previous)
      .mockResolvedValueOnce(fresh)
    ctx.clients.checkout.addItem.mockResolvedValue(added)

    const subscriptionItem = {
      id: 'sub-parent',
      quantity: 1,
      seller: '1',
      options: [
        {
          assemblyId: 'vtex.subscription.key.frequency',
          id: 'freq-1',
          quantity: 1,
          seller: '1',
          inputValues: {
            'vtex.subscription.key.frequency': '1 month',
          },
        },
      ],
    } as any

    await mutations.addToCart(
      null,
      { orderFormId: 'of-1', items: [subscriptionItem] },
      toContext(ctx)
    )

    expect(
      ctx.clients.checkout.updateSubscriptionDataField
    ).toHaveBeenCalledTimes(1)
    expect(
      ctx.clients.checkout.updateSubscriptionDataField
    ).toHaveBeenCalledWith(
      'of-1',
      expect.objectContaining({
        subscriptions: [
          expect.objectContaining({
            executionCount: 0,
            itemIndex: 0,
            plan: expect.objectContaining({
              type: 'RECURRING_PAYMENT',
              frequency: { interval: 1, periodicity: 'MONTH' },
            }),
          }),
        ],
      })
    )
  })

  it('concatenates new subscription entries with the existing subscriptionData', async () => {
    const ctx = setupCtx()

    const previous = orderFormWith({ items: [] })
    const existingEntry = {
      executionCount: 3,
      itemIndex: 0,
      plan: {
        frequency: { interval: 1, periodicity: 'WEEK' },
        type: 'RECURRING_PAYMENT',
        validity: {},
      },
    }
    const added = orderFormWith({
      orderFormId: 'after-add',
      subscriptionData: { subscriptions: [existingEntry] } as any,
    })
    const fresh = orderFormWith({ orderFormId: 'fresh-snapshot' })

    ctx.clients.checkout.orderForm
      .mockResolvedValueOnce(previous)
      .mockResolvedValueOnce(fresh)
    ctx.clients.checkout.addItem.mockResolvedValue(added)

    const subscriptionItem = {
      id: 'sub-parent',
      quantity: 1,
      seller: '1',
      options: [
        {
          assemblyId: 'vtex.subscription.key.frequency',
          id: 'freq-1',
          quantity: 1,
          seller: '1',
          inputValues: {
            'vtex.subscription.key.frequency': '2 days',
          },
        },
      ],
    } as any

    await mutations.addToCart(
      null,
      { orderFormId: 'of-1', items: [subscriptionItem] },
      toContext(ctx)
    )

    const [, payload] = (ctx.clients.checkout
      .updateSubscriptionDataField as jest.Mock).mock.calls[0]
    expect(payload.subscriptions).toHaveLength(2)
    expect(payload.subscriptions[0]).toBe(existingEntry)
    expect(payload.subscriptions[1]).toEqual(
      expect.objectContaining({
        plan: expect.objectContaining({
          frequency: { interval: 2, periodicity: 'DAY' },
        }),
      })
    )
  })

  it('skips updateSubscriptionDataField when the option does not reference a subscription', async () => {
    const ctx = setupCtx()

    ctx.clients.checkout.orderForm
      .mockResolvedValueOnce(orderFormWith({ items: [] }))
      .mockResolvedValueOnce(orderFormWith({ orderFormId: 'fresh' }))
    ctx.clients.checkout.addItem.mockResolvedValue(orderFormWith())

    await mutations.addToCart(
      null,
      {
        orderFormId: 'of-1',
        items: [
          {
            id: 'p',
            quantity: 1,
            seller: '1',
            options: [
              {
                assemblyId: 'addon-glaze',
                id: 'glaze',
                quantity: 1,
                seller: '1',
                inputValues: {},
              },
            ],
          },
        ] as any,
      },
      toContext(ctx)
    )

    expect(
      ctx.clients.checkout.updateSubscriptionDataField
    ).not.toHaveBeenCalled()
  })
})

describe('mutations.updateItems', () => {
  // The resolver fetches the current orderForm whenever:
  //   (a) it inspects a single targeted item for subscription attachments, or
  //   (b) any of the input items has a falsy `index` so it can be looked up by
  //       `uniqueId`.
  // Tests that don't explicitly target subscription/index-lookup behavior keep
  // using this generic non-subscription orderForm.
  const setupUpdateItemsCtx = (overrides = {}) => {
    const ctx = setupCtx(overrides)
    ctx.clients.checkout.orderForm.mockResolvedValue(
      orderFormWith({
        items: [
          { attachments: [] } as any,
          { attachments: [] } as any,
        ],
      })
    )
    return ctx
  }

  it('strips id from each item before calling checkout.updateItems', async () => {
    const ctx = setupUpdateItemsCtx()
    const updated = orderFormWith({ orderFormId: 'updated' })
    ctx.clients.checkout.updateItems.mockResolvedValue(updated)

    const result = await mutations.updateItems(
      null,
      {
        orderFormId: 'of-1',
        orderItems: [
          { id: 'sku-x', quantity: 3, index: 1 } as any,
        ],
        splitItem: true,
      },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.updateItems).toHaveBeenCalledTimes(1)
    const [orderFormId, items, splitItem, allowedOutdatedData] = (ctx.clients
      .checkout.updateItems as jest.Mock).mock.calls[0]
    expect(orderFormId).toBe('of-1')
    expect(items).toEqual([{ quantity: 3, index: 1 }])
    expect(items[0]).not.toHaveProperty('id')
    expect(splitItem).toBe(true)
    expect(allowedOutdatedData).toBeUndefined()
    expect(result).toBe(updated)
  })

  it('forces splitItem to false when the targeted single item is a subscription', async () => {
    const ctx = setupCtx()
    const orderFormWithSubscription = orderFormWith({
      items: [
        {
          attachments: [{ name: 'vtex.subscription.key.frequency' }],
        } as any,
      ],
    })
    ctx.clients.checkout.orderForm.mockResolvedValue(orderFormWithSubscription)
    ctx.clients.checkout.updateItems.mockResolvedValue(orderFormWith())

    await mutations.updateItems(
      null,
      {
        orderFormId: 'of-1',
        orderItems: [{ id: 'x', quantity: 0, index: 0 } as any],
        splitItem: true,
      },
      toContext(ctx)
    )

    const [, , splitItem] = (ctx.clients.checkout.updateItems as jest.Mock).mock
      .calls[0]
    expect(splitItem).toBe(false)
  })

  it('preserves splitItem for a single item that is not a subscription', async () => {
    const ctx = setupCtx()
    const orderForm = orderFormWith({
      items: [
        { attachments: [{ name: 'addon-glaze' }] } as any,
      ],
    })
    ctx.clients.checkout.orderForm.mockResolvedValue(orderForm)
    ctx.clients.checkout.updateItems.mockResolvedValue(orderFormWith())

    await mutations.updateItems(
      null,
      {
        orderFormId: 'of-1',
        orderItems: [{ id: 'x', quantity: 0, index: 0 } as any],
        splitItem: true,
      },
      toContext(ctx)
    )

    const [, , splitItem] = (ctx.clients.checkout.updateItems as jest.Mock).mock
      .calls[0]
    expect(splitItem).toBe(true)
  })

  it('fills in missing indices using uniqueId from the current orderForm', async () => {
    const ctx = setupCtx()
    const orderForm = orderFormWith({
      items: [
        { uniqueId: 'first', id: 'a' } as any,
        { uniqueId: 'second', id: 'b' } as any,
      ],
    })
    ctx.clients.checkout.orderForm.mockResolvedValue(orderForm)
    ctx.clients.checkout.updateItems.mockResolvedValue(orderFormWith())

    await mutations.updateItems(
      null,
      {
        orderFormId: 'of-1',
        orderItems: [
          // No index, but uniqueId targets the second cart line.
          { id: 'b', quantity: 0, uniqueId: 'second' } as any,
        ],
        splitItem: true,
      },
      toContext(ctx)
    )

    const [, items] = (ctx.clients.checkout.updateItems as jest.Mock).mock
      .calls[0]
    expect(items[0].index).toBe(1)
  })

  it('forwards allowedOutdatedData', async () => {
    const ctx = setupUpdateItemsCtx()
    ctx.clients.checkout.updateItems.mockResolvedValue(orderFormWith())

    await mutations.updateItems(
      null,
      {
        orderFormId: 'of-1',
        orderItems: [{ id: 'x', quantity: 1, index: 0 } as any],
        splitItem: false,
        allowedOutdatedData: ['paymentData'],
      },
      toContext(ctx)
    )

    const [, , , allowedOutdatedData] = (ctx.clients.checkout
      .updateItems as jest.Mock).mock.calls[0]
    expect(allowedOutdatedData).toEqual(['paymentData'])
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupUpdateItemsCtx({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkout.updateItems.mockResolvedValue(orderFormWith())

    await mutations.updateItems(
      null,
      {
        orderItems: [{ id: 'x', quantity: 1, index: 0 } as any],
        splitItem: true,
      },
      toContext(ctx)
    )

    const [orderFormId] = (ctx.clients.checkout.updateItems as jest.Mock).mock
      .calls[0]
    expect(orderFormId).toBe('ctx-of')
  })
})

describe('mutations.addItemOffering', () => {
  it('forwards itemIndex/offeringId/offeringInfo to the checkout client', async () => {
    const ctx = setupCtx()
    const updated = orderFormWith({ orderFormId: 'updated' })
    ctx.clients.checkout.addItemOffering.mockResolvedValue(updated)

    const result = await mutations.addItemOffering(
      null,
      {
        orderFormId: 'of-1',
        offeringInput: {
          itemIndex: 2,
          offeringId: 'off-1',
          offeringInfo: { custom: true },
        },
      },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.addItemOffering).toHaveBeenCalledWith(
      'of-1',
      2,
      'off-1',
      { custom: true }
    )
    expect(result).toBe(updated)
  })
})

describe('mutations.removeItemOffering', () => {
  it('forwards itemIndex and offeringId to the checkout client', async () => {
    const ctx = setupCtx()
    const updated = orderFormWith({ orderFormId: 'updated' })
    ctx.clients.checkout.removeItemOffering.mockResolvedValue(updated)

    const result = await mutations.removeItemOffering(
      null,
      {
        orderFormId: 'of-1',
        offeringInput: {
          itemIndex: 0,
          offeringId: 'off-1',
          offeringInfo: undefined,
        },
      },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.removeItemOffering).toHaveBeenCalledWith(
      'of-1',
      0,
      'off-1'
    )
    expect(result).toBe(updated)
  })
})

describe('mutations.addBundleItemAttachment', () => {
  it('forwards every input field to the checkout client', async () => {
    const ctx = setupCtx()
    const updated = orderFormWith({ orderFormId: 'updated' })
    ctx.clients.checkout.addBundleItemAttachment.mockResolvedValue(updated)

    const result = await mutations.addBundleItemAttachment(
      null,
      {
        orderFormId: 'of-1',
        bundleItemAttachmentInput: {
          itemIndex: 1,
          bundleItemId: 'bundle-1',
          attachmentName: 'gift-message',
          attachmentContent: { from: 'Ada', to: 'Bob' },
        },
      },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.addBundleItemAttachment).toHaveBeenCalledWith(
      'of-1',
      1,
      'bundle-1',
      'gift-message',
      { from: 'Ada', to: 'Bob' }
    )
    expect(result).toBe(updated)
  })
})

describe('mutations.removeBundleItemAttachment', () => {
  it('unwraps the response data field', async () => {
    const ctx = setupCtx()
    const updated = orderFormWith({ orderFormId: 'updated' })
    ctx.clients.checkout.removeBundleItemAttachment.mockResolvedValue({
      data: updated,
    })

    const result = await mutations.removeBundleItemAttachment(
      null,
      {
        orderFormId: 'of-1',
        bundleItemAttachmentInput: {
          itemIndex: 1,
          bundleItemId: 'bundle-1',
          attachmentName: 'gift-message',
          attachmentContent: { from: 'Ada' },
        },
      },
      toContext(ctx)
    )

    expect(ctx.clients.checkout.removeBundleItemAttachment).toHaveBeenCalledWith(
      'of-1',
      1,
      'bundle-1',
      'gift-message',
      { from: 'Ada' }
    )
    expect(result).toBe(updated)
  })
})

describe('mutations.setManualPrice', () => {
  it('forwards itemIndex and price to the checkoutAdmin client', async () => {
    const ctx = setupCtx()
    const updated = orderFormWith({ orderFormId: 'updated' })
    ctx.clients.checkoutAdmin.setManualPrice.mockResolvedValue(updated)

    const result = await mutations.setManualPrice(
      null,
      {
        orderFormId: 'of-1',
        input: { itemIndex: 3, price: 9999 },
      },
      toContext(ctx)
    )

    expect(ctx.clients.checkoutAdmin.setManualPrice).toHaveBeenCalledWith(
      'of-1',
      3,
      9999
    )
    expect(result).toBe(updated)
  })

  it('falls back to vtex.orderFormId when args.orderFormId is missing', async () => {
    const ctx = setupCtx({ vtex: { orderFormId: 'ctx-of' } })
    ctx.clients.checkoutAdmin.setManualPrice.mockResolvedValue(orderFormWith())

    await mutations.setManualPrice(
      null,
      { input: { itemIndex: 0, price: 100 } },
      toContext(ctx)
    )

    expect(ctx.clients.checkoutAdmin.setManualPrice).toHaveBeenCalledWith(
      'ctx-of',
      0,
      100
    )
  })
})
