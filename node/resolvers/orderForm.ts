import { prop, propOr, compose, forEach } from 'ramda'

import { CHECKOUT_COOKIE, parseCookie } from '../utils'
import { adjustItems } from './items'
import { fillMessages } from './messages'
import { getShippingInfo } from '../utils/shipping'

interface StoreSettings {
  enableOrderFormOptimization: boolean
  storeName: string
  titleTag: string
  metaTagDescription: string
  metaTagKeywords: string
  enableCriticalCSS: boolean
}

const SetCookieWhitelist = [CHECKOUT_COOKIE, '.ASPXAUTH']

const isWhitelistedSetCookie = (cookie: string) => {
  const [key] = cookie.split('=')
  return SetCookieWhitelist.includes(key)
}

const replaceDomain = (host: string) => (cookie: string) =>
  cookie.replace(/domain=.+?(;|$)/, `domain=${host};`)

export const root = {
  OrderForm: {
    id: prop('orderFormId'),
    marketingData: propOr({}, 'marketingData'),
    userType: async (_: CheckoutOrderForm, __: unknown, ctx: Context) => {
      const {
        clients: { customSession },
        cookies,
      } = ctx

      const { sessionData } = await customSession.getSession(
        cookies.get('vtex_session'),
        ['*']
      )
      const isCallCenterOperator =
        sessionData.namespaces.impersonate?.canImpersonate.value === 'true'

      if (isCallCenterOperator) {
        return 'CALL_CENTER_OPERATOR'
      }

      return 'STORE_USER'
    },
    messages: (orderForm: CheckoutOrderForm, _: unknown, ctx: Context) => {
      const {
        clients: { checkout },
      } = ctx

      const newMessages = fillMessages(orderForm.messages)

      if (orderForm.messages) {
        checkout.clearMessages(orderForm.orderFormId)
      }

      return newMessages
    },
    items: (orderForm: CheckoutOrderForm, _: unknown, ctx: Context) => {
      const {
        clients: { searchGraphQL },
        vtex: { platform },
      } = ctx

      return adjustItems(platform, orderForm.items, searchGraphQL)
    },
    shipping: (orderForm: CheckoutOrderForm, _: unknown, ctx: Context) => {
      return getShippingInfo({ orderForm, clients: ctx.clients })
    },
  },
  ClientPreferencesData: {
    optInNewsletter: prop('optinNewsLetter'),
  },
}

export async function forwardCheckoutCookies(
  rawHeaders: Record<string, any>,
  ctx: Context
) {
  const responseSetCookies: string[] = rawHeaders?.['set-cookie'] || []

  const host = ctx.get('x-forwarded-host')
  const forwardedSetCookies = responseSetCookies.filter(isWhitelistedSetCookie)
  const parseAndClean = compose(parseCookie, replaceDomain(host))
  const cleanCookies = forwardedSetCookies.map(parseAndClean)
  forEach(
    ({ name, value, options }) => ctx.cookies.set(name, value, options),
    cleanCookies
  )
}

export const queries = {
  orderForm: async (
    _: unknown,
    __: unknown,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const { clients } = ctx

    const {
      data: newOrderForm,
      headers,
    } = await clients.checkout.orderFormRaw()

    /**
     * In case the enableOrderFormOptimization setting is enabled in the store,
     * this will be the only `orderForm` query performed in the client. So no
     * 'checkout.vtex.com' cookie would have been set. Otherwise vtex.store-graphql
     * would've already set this cookie and this resolver should not overwrite it.
     */
    const storeSettings: StoreSettings = await clients.apps.getAppSettings(
      'vtex.store@2.x'
    )
    if (storeSettings.enableOrderFormOptimization) {
      forwardCheckoutCookies(headers, ctx)
    }

    return newOrderForm
  },
}

interface MutationUpdateOrderFormProfileArgs {
  input: UserProfileInput
}

interface MutationUpdateClientPreferencesDataArgs {
  input: ClientPreferencesDataInput
}

export const mutations = {
  updateOrderFormProfile: async (
    _: unknown,
    { input }: MutationUpdateOrderFormProfileArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients: { checkout },
      vtex: { orderFormId },
    } = ctx

    const orderFormWithProfile = await checkout.updateOrderFormProfile(
      orderFormId!,
      input
    )

    return orderFormWithProfile
  },
  updateClientPreferencesData: async (
    _: unknown,
    { input }: MutationUpdateClientPreferencesDataArgs,
    ctx: Context
  ) => {
    const {
      clients: { checkout },
      vtex: { orderFormId },
    } = ctx

    const updatedOrderForm = await checkout.updateOrderFormClientPreferencesData(
      orderFormId!,
      {
        optinNewsLetter: input.optInNewsletter,
        locale: input.locale,
      }
    )

    return updatedOrderForm
  },
}
