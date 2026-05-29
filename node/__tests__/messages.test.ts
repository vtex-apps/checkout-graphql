import { fillMessages } from '../resolvers/messages'

const msg = (
  code: string,
  text = `text-${code}`,
  status = 'error'
): Message => ({ code, text, status })

describe('resolvers/messages — fillMessages', () => {
  it('returns empty buckets for an empty list', () => {
    expect(fillMessages([])).toEqual({
      couponMessages: [],
      generalMessages: [],
    })
  })

  it('classifies couponExpired and couponNotFound as coupon messages', () => {
    const expired = msg('couponExpired')
    const notFound = msg('couponNotFound')

    expect(fillMessages([expired, notFound])).toEqual({
      couponMessages: [expired, notFound],
      generalMessages: [],
    })
  })

  it('drops cannotBeDelivered messages entirely', () => {
    const ignored = msg('cannotBeDelivered')
    const other = msg('itemUnavailable')

    const result = fillMessages([ignored, other])

    expect(result.couponMessages).toEqual([])
    expect(result.generalMessages).toEqual([other])
  })

  it('routes any other code to generalMessages', () => {
    const random = msg('someRandomCode')

    expect(fillMessages([random])).toEqual({
      couponMessages: [],
      generalMessages: [random],
    })
  })

  it('preserves order within each bucket and partitions mixed input', () => {
    const c1 = msg('couponNotFound')
    const g1 = msg('itemA')
    const c2 = msg('couponExpired')
    const ignored = msg('cannotBeDelivered')
    const g2 = msg('itemB')

    expect(fillMessages([c1, g1, c2, ignored, g2])).toEqual({
      couponMessages: [c1, c2],
      generalMessages: [g1, g2],
    })
  })
})
