const COUPON_EXPIRED = 'couponExpired'
const COUPON_NOT_FOUND = 'couponNotFound'

const COUPON_CODES = [COUPON_EXPIRED, COUPON_NOT_FOUND]

export const fillMessages = (messages: Message[]) => {
  const { couponMessages } = messages.reduce(
    (acc: any, message: Message) => {
      if (COUPON_CODES.includes(message.code)) {
        acc.couponMessages.push(message)
      }
      return acc
    },
    { couponMessages: [] }
  )

  return { couponMessages }
}
