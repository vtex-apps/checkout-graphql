import { parse } from 'set-cookie-parser'

/**
 * Value of the cookie `name` among the `Set-Cookie` headers of a Checkout
 * response: `undefined` when Checkout did not issue it, `''` when it blanked it.
 */
export const readIssuedCookie = (setCookies: string[], name: string) => {
  const issued = setCookies
    .map(setCookie => parse(setCookie)[0])
    .find(cookie => cookie?.name === name)

  return issued?.value
}
