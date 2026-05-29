export enum AddressType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INSTORE = 'inStore',
  GIFT_REGISTRY = 'giftRegistry',
  PICKUP = 'pickup',
  SEARCH = 'search',
}

// Cookies
export const CHECKOUT_COOKIE = 'checkout.vtex.com'
export const ASPXAUTH_COOKIE = '.ASPXAUTH'
export const OWNERSHIP_COOKIE = 'CheckoutOrderFormOwnership'

// Delivery channels
export const DELIVERY = 'delivery'
export const PICKUP_IN_POINT = 'pickup-in-point'

export const VTEX_SESSION = 'vtex_session'
export const VTEX_RC_SESSION_COOKIE = 'VtexRCSessionIdv7'
export const VTEX_RC_MAC_COOKIE = 'VtexRCMacIdv7'

// When checkout returns an orderForm whose clientProfileData.email starts with
// this marker, the cookies are corrupted and the orderForm must be refetched
// via checkoutNoCookies. See `queries.orderForm` in resolvers/orderForm.ts.
export const BROKEN_COOKIE_EMAIL_PREFIX = 'vrn--vtexsphinx--aws-us-east-1'
