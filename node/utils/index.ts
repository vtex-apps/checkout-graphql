import { AuthenticationError, ForbiddenError, UserInputError } from '@vtex/api'
import { AxiosError } from 'axios'
import { parse } from 'cookie'

export function generateRandomName() {
  return (1 + Math.random()).toString(36).substring(2)
}

export function getFileExtension(fileName: string) {
  return fileName.match(/\.[0-9a-z]+$/i)
    ? (fileName.match(/\.[0-9a-z]+$/i) as any[])[0]
    : undefined
}

export function statusToError(e: any) {
  if (!e.response) {
    throw e
  }

  const { response } = e as AxiosError
  const { status } = response!

  if (status === 401) {
    throw new AuthenticationError(e)
  }
  if (status === 403) {
    throw new ForbiddenError(e)
  }
  if (status === 400) {
    throw new UserInputError(e)
  }

  throw e
}

export const parseCookie = (cookie: string) => {
  const parsed = parse(cookie)
  const cookieName = Object.keys(parsed)[0] as string
  const cookieValue = parsed[cookieName]

  const extraOptions = {
    path: parsed.path,
    domain: parsed.domain,
    expires: parsed.expires ? new Date(parsed.expires) : undefined,
  }
  return {
    name: cookieName,
    value: cookieValue,
    options: extraOptions,
  }
}

/** Checkout cookie methods */
export const CHECKOUT_COOKIE = 'checkout.vtex.com'

export function checkoutCookieFormat(orderFormId: string) {
  return `${CHECKOUT_COOKIE}=__ofid=${orderFormId};`
}

export function getOrderFormIdFromCookie(cookies: Context['cookies']) {
  const cookie = cookies.get(CHECKOUT_COOKIE)
  return cookie?.split('=')[1]
}
