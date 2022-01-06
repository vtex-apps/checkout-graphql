import { prop, propOr, compose, forEach } from 'ramda'
import { QueryOrderFormArgs } from 'vtex.checkout-graphql'

import { CHECKOUT_COOKIE, parseCookie } from '../utils'
import { fillMessages } from './messages'
import { getShippingInfo } from '../utils/shipping'
import {
  isShippingValid,
  isProfileValid,
  isPaymentValid,
} from '../utils/validation'
import { VTEX_SESSION } from '../constants'
import { OrderFormIdArgs } from '../utils/args'

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

const isCallCenterOperator = async (orderFormId: string, ctx: Context) => {
  const {
    clients: { customSession },
    vtex: { logger },
    cookies,
  } = ctx

  const sessionCookie = cookies.get(VTEX_SESSION)

  if (sessionCookie === undefined) {
    logger.warn(
      `Can't request session details: "${VTEX_SESSION}" is undefined. ofid=${orderFormId}`
    )

    return false
  }

  const { sessionData } = await customSession.getSession(sessionCookie, ['*'])

  return sessionData?.namespaces?.impersonate?.canImpersonate?.value === 'true'
}

export const root = {
  OrderForm: {
    id: prop('orderFormId'),
    marketingData: propOr({}, 'marketingData'),
    storePreferencesData: propOr({}, 'storePreferencesData'),
    allowManualPrice: async (
      orderForm: CheckoutOrderForm,
      _: unknown,
      ctx: Context
    ) => {
      const isCallCenter = await isCallCenterOperator(
        orderForm.orderFormId,
        ctx
      )

      if (!isCallCenter) {
        return false
      }

      const adminOrderForm = await ctx.clients.checkoutAdmin.orderForm()

      return adminOrderForm?.allowManualPrice || orderForm.allowManualPrice
    },
    userType: async (
      orderForm: CheckoutOrderForm,
      __: unknown,
      ctx: Context
    ) => {
      const isCallCenter = await isCallCenterOperator(
        orderForm.orderFormId,
        ctx
      )

      if (isCallCenter) {
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
    clientProfileData: async (
      orderForm: CheckoutOrderForm,
      _: unknown,
      ctx: Context
    ) => {
      if (!orderForm.clientProfileData) {
        return null
      }

      const isValid = await isProfileValid(
        orderForm,
        orderForm.clientProfileData,
        ctx
      )

      return {
        ...orderForm.clientProfileData,
        isValid,
      }
    },
    shipping: async (
      orderForm: CheckoutOrderForm,
      _: unknown,
      ctx: Context
    ) => {
      const shippingInfo = await getShippingInfo({
        orderForm,
        clients: ctx.clients,
      })

      const isValid = await isShippingValid(orderForm, shippingInfo, ctx)

      return {
        ...shippingInfo,
        isValid,
      }
    },
    paymentData: (orderForm: CheckoutOrderForm) => {
      const isValid = isPaymentValid(orderForm.paymentData)

      return {
        ...orderForm.paymentData,
        isValid,
      }
    },
  },
  ClientPreferencesData: {
    optInNewsletter: prop('optinNewsLetter'),
  },
}

// Ported from store-graphql
// https://github.com/vtex-apps/store-graphql/blob/master/node/resolvers/checkout/index.ts#L185
export async function syncWithStoreLocale(
  orderForm: CheckoutOrderForm,
  cultureInfo: string,
  checkout: Context['clients']['checkout']
) {
  const clientPreferencesData = orderForm.clientPreferencesData || {
    locale: cultureInfo,
  }

  const shouldUpdateClientPreferencesData =
    cultureInfo &&
    clientPreferencesData.locale &&
    cultureInfo !== clientPreferencesData.locale

  if (shouldUpdateClientPreferencesData) {
    const newClientPreferencesData = {
      ...clientPreferencesData,
    }

    newClientPreferencesData.locale = cultureInfo

    try {
      return await checkout.updateOrderFormClientPreferencesData(
        orderForm.orderFormId,
        newClientPreferencesData
      )
    } catch (e) {
      console.error(e)

      return orderForm
    }
  }

  return orderForm
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
    args: QueryOrderFormArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients,
      vtex,
    } = ctx
    const { orderFormId = vtex.orderFormId, refreshOutdatedData } = args

    let { data: newOrderForm, headers } = await clients.checkout.orderFormRaw(
      orderFormId ?? undefined,
      refreshOutdatedData ?? undefined
    )

    const hasBrokenCookie = newOrderForm?.clientProfileData?.email?.startsWith(
      'vrn--vtexsphinx--aws-us-east-1'
    )

    if (hasBrokenCookie) {
      vtex.logger.info({ message: 'Broken order form', orderFormId })
      const obj = await clients.checkoutNoCookies.orderFormRaw(undefined, true)
      newOrderForm = obj.data
      headers = obj.headers
    }

    const orderForm = await syncWithStoreLocale(
      newOrderForm,
      vtex.segment!.cultureInfo,
      clients.checkout
    )

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

    return orderForm
  },
}

interface MutationUpdateOrderFormProfileArgs {
  input: UserProfileInput
}

interface MutationUpdateClientPreferencesDataArgs {
  input: ClientPreferencesDataInput
}

interface MutationUpdateOrderFormPaymentArgs {
  input: PaymentDataInput
}

interface MutationUpdateOrderFormOpenTextField {
  input: OpenTextField
}

interface MutationUpdateOrderFormMarketingData {
  input: OrderFormMarketingData
}

export const mutations = {
  updateOrderFormProfile: async (
    _: unknown,
    args: MutationUpdateOrderFormProfileArgs & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients: { checkout },
      vtex,
    } = ctx
    const { input, orderFormId = vtex.orderFormId } = args

    const orderFormWithProfile = await checkout.updateOrderFormProfile(
      orderFormId!,
      input
    )

    return orderFormWithProfile
  },
  updateClientPreferencesData: async (
    _: unknown,
    args: MutationUpdateClientPreferencesDataArgs & OrderFormIdArgs,
    ctx: Context
  ) => {
    const {
      clients: { checkout },
      vtex,
    } = ctx
    const { orderFormId = vtex.orderFormId, input } = args

    const updatedOrderForm = await checkout.updateOrderFormClientPreferencesData(
      orderFormId!,
      {
        optinNewsLetter: input.optInNewsletter,
        locale: input.locale,
      }
    )

    return updatedOrderForm
  },
  updateOrderFormPayment: async (
    _: unknown,
    args: MutationUpdateOrderFormPaymentArgs & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients: { checkout },
      vtex,
    } = ctx
    const { orderFormId = vtex.orderFormId, input } = args

    const orderFormWithPayments = await checkout.updateOrderFormPayment(
      orderFormId!,
      input
    )

    return orderFormWithPayments
  },
  updateItemsOrdination: async (
    _: unknown,
    args: ItemsOrdinationArgs & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients: { checkout },
      vtex,
    } = ctx
    const { ascending, criteria, orderFormId = vtex.orderFormId } = args

    const changeItemsOrdination = await checkout.updateItemsOrdination(
      orderFormId!,
      ascending,
      criteria
    )

    return changeItemsOrdination
  },

  clearOrderFormMessages: async (
    _: unknown,
    args: OrderFormIdArgs,
    ctx: Context
  ) => {
    const {
      clients: { checkout },
      vtex,
    } = ctx
    const { orderFormId = vtex.orderFormId } = args

    const updatedOrderForm = await checkout.clearMessages(orderFormId!)

    return updatedOrderForm
  },

  updateOrderFormOpenTextField: async (
    _: unknown,
    args: MutationUpdateOrderFormOpenTextField & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients: { checkout },
      vtex,
    } = ctx
    const { orderFormId = vtex.orderFormId, input } = args

    const orderFormWithOpenTextField = await checkout.updateOrderFromOpenTextField(
      orderFormId!,
      input
    )

    return orderFormWithOpenTextField
  },

  updateOrderFormMarketingData: async (
    _: unknown,
    args: MutationUpdateOrderFormMarketingData & OrderFormIdArgs,
    ctx: Context
  ): Promise<CheckoutOrderForm> => {
    const {
      clients: { checkout },
      vtex,
    } = ctx

    const { orderFormId = vtex.orderFormId, input } = args

    const updatedOrderForm = await checkout.updateOrderFormMarketingData(
      orderFormId!,
      input
    )

    return updatedOrderForm
  },
}
