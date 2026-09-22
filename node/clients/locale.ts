import { MiddlewareContext } from '@vtex/api'

import { LOCALE_COOKIE } from '../constants'
import { readIssuedCookie } from './setCookie'

/**
 * Keeps `CheckoutLocale` in step with Checkout across every route.
 *
 * Checkout picks the culture of its messages and totalizer names from this
 * cookie before it loads the cart, and issues it back on every response that
 * also sets the orderForm cookie. `@withOrderFormId` reads the value the
 * browser sent, so when Checkout rotates it in the middle of a request (the
 * `clientPreferencesData` update made by `syncWithStoreLocale`, for instance)
 * the remaining calls would keep sending the stale locale and get messages
 * in the wrong language back.
 *
 * Running as a client middleware covers every verb, `patch` included, the
 * same way `keepOwnership` does for the ownership cookie.
 */
export const keepLocale = (ioContext: CustomIOContext) => async (
  middlewareContext: MiddlewareContext,
  next: () => Promise<void>
) => {
  await next()

  const setCookies: string[] =
    middlewareContext.response?.headers?.['set-cookie'] ?? []

  if (setCookies.length === 0) {
    return
  }

  const issuedLocale = readIssuedCookie(setCookies, LOCALE_COOKIE)

  // Checkout only issues the cookie when it has a culture in hand, so an empty
  // value is not expected. If it ever comes, there is nothing better to adopt.
  if (issuedLocale) {
    ioContext.checkoutLocale = issuedLocale
  }
}
