const COUPON_CODES = ['couponExpired', 'couponNotFound']
const IGNORED_CODES = ['cannotBeDelivered']

export const fillMessages = (messages: Message[]) => {
  const orderFormMessages = messages.reduce<OrderFormMessages>(
    (acc, message) => {
      if (COUPON_CODES.includes(message.code)) {
        acc.couponMessages.push(message)
      } else if (!IGNORED_CODES.includes(message.code)) {
        acc.generalMessages.push(message)
      }
      return acc
    },
    {
      couponMessages: [],
      generalMessages: [],
    }
  )

  return orderFormMessages
}
