import { MiddlewareContext } from '@vtex/api'
import { parse } from 'set-cookie-parser'

import { OWNERSHIP_COOKIE } from '../constants'

const readIssuedOwnership = (setCookies: string[]) => {
  const issued = setCookies
    .map(setCookie => parse(setCookie)[0])
    .find(cookie => cookie?.name === OWNERSHIP_COOKIE)

  return issued?.value
}

/**
 * Keeps `CheckoutOrderFormOwnership` alive across every Checkout route.
 *
 * All routes already send the cookie out through `getCommonHeaders`, but until
 * this middleware only the three methods built on the `*Raw` verbs could read
 * it back. Checkout rotates the ownership whenever profile or shipping data
 * changes, so a rotation that goes uncaptured leaves the remaining calls of the
 * request authenticating with a stale value and getting masked data back.
 *
 * Running as a client middleware covers every verb — notably `patch`, which
 * `HttpClient` exposes with no raw variant, so `addItem` and `updateItems`
 * cannot see their own response headers from the calling method.
 */
export const keepOwnership = (ioContext: CustomIOContext) => async (
  middlewareContext: MiddlewareContext,
  next: () => Promise<void>
) => {
  await next()

  const setCookies: string[] =
    middlewareContext.response?.headers?.['set-cookie'] ?? []

  if (setCookies.length === 0) {
    return
  }

  const issuedOwnership = readIssuedOwnership(setCookies)

  if (issuedOwnership) {
    ioContext.ownerId = issuedOwnership
    return
  }

  // Checkout blanks the cookie when it hands out a new cart. Adopting that
  // empty value would revoke the ownership the shopper already holds, so we
  // keep the current one and record that it happened.
  if (issuedOwnership === '' && ioContext.ownerId) {
    ioContext.logger.warn({
      message:
        'Checkout returned an empty ownership cookie; keeping the current one',
      url: middlewareContext.config?.url,
    })
  }
}
