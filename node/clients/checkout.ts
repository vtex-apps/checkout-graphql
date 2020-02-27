import {
  InstanceOptions,
  IOContext,
  IOResponse,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { checkoutCookieFormat, statusToError } from '../utils'

export interface SimulationData {
  country: string
  items: Array<{ id: string; quantity: number | string; seller: string }>
  postalCode?: string
  isCheckedIn?: boolean
  priceTables?: string[]
  marketingData?: Record<string, string>
}

export class Checkout extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        ...(ctx.storeUserAuthToken
          ? { VtexIdclientAutCookie: ctx.storeUserAuthToken }
          : null),
      },
    })
  }

  public savePaymentToken = (paymentTokens: any) => {
    return this.post(
      this.routes.savePaymentToken(this.getChannelQueryString()),
      paymentTokens,
      { metric: 'checkout-save-payment' }
    )
  }

  public getPaymentSession = () => {
    return this.get<PaymentSession>(this.routes.getPaymentSession())
  }

  public addItem = (orderFormId: string, items: any) =>
    this.post<CheckoutOrderForm>(
      this.routes.addItem(orderFormId, this.getChannelQueryString()),
      { orderItems: items },
      { metric: 'checkout-addItem' }
    )

  public cancelOrder = (orderFormId: string, reason: string) =>
    this.post(
      this.routes.cancelOrder(orderFormId),
      { reason },
      { metric: 'checkout-cancelOrder' }
    )

  public setOrderFormCustomData = (
    orderFormId: string,
    appId: string,
    field: string,
    value: any
  ) =>
    this.put(
      this.routes.orderFormCustomData(orderFormId, appId, field),
      { value },
      { metric: 'checkout-setOrderFormCustomData' }
    )

  public updateItems = (orderFormId: string, orderItems: any) =>
    this.post<CheckoutOrderForm>(
      this.routes.updateItems(orderFormId),
      { orderItems },
      { metric: 'checkout-updateItems' }
    )

  public updateOrderFormIgnoreProfile = (
    orderFormId: string,
    ignoreProfileData: boolean
  ) =>
    this.patch(
      this.routes.orderFormProfile(orderFormId),
      { ignoreProfileData },
      { metric: 'checkout-updateOrderFormIgnoreProfile' }
    )

  public updateOrderFormPayment = (orderFormId: string, payments: any) =>
    this.post(
      this.routes.attachmentsData(orderFormId, 'paymentData'),
      { payments },
      { metric: 'checkout-updateOrderFormPayment' }
    )

  public updateOrderFormProfile = (orderFormId: string, fields: any) =>
    this.post(
      this.routes.attachmentsData(orderFormId, 'clientProfileData'),
      fields,
      { metric: 'checkout-updateOrderFormProfile' }
    )

  public updateOrderFormShipping = (orderFormId: string, shipping: any) =>
    this.post(
      this.routes.attachmentsData(orderFormId, 'shippingData'),
      shipping,
      { metric: 'checkout-updateOrderFormShipping' }
    )

  public updateOrderFormMarketingData = (
    orderFormId: string,
    marketingData: any
  ) =>
    this.post(
      this.routes.attachmentsData(orderFormId, 'marketingData'),
      marketingData,
      { metric: 'checkout-updateOrderFormMarketingData' }
    )

  public addAssemblyOptions = async (
    orderFormId: string,
    itemId: string | number,
    assemblyOptionsId: string,
    body: any
  ) =>
    this.post(
      this.routes.assemblyOptions(orderFormId, itemId, assemblyOptionsId),
      body,
      { metric: 'checkout-addAssemblyOptions' }
    )

  public removeAssemblyOptions = async (
    orderFormId: string,
    itemId: string | number,
    assemblyOptionsId: string,
    body: any
  ) =>
    this.delete(
      this.routes.assemblyOptions(orderFormId, itemId, assemblyOptionsId),
      { metric: 'checkout-removeAssemblyOptions', data: body }
    )

  public updateOrderFormCheckin = (orderFormId: string, checkinPayload: any) =>
    this.post(this.routes.checkin(orderFormId), checkinPayload, {
      metric: 'checkout-updateOrderFormCheckin',
    })

  public orderForm = () => {
    return this.post<CheckoutOrderForm>(
      this.routes.orderForm,
      {},
      { metric: 'checkout-orderForm' }
    )
  }

  public orderFormRaw = () => {
    return this.postRaw<CheckoutOrderForm>(
      this.routes.orderForm,
      {},
      { metric: 'checkout-orderForm' }
    )
  }

  public orders = () =>
    this.get(this.routes.orders, { metric: 'checkout-orders' })

  public simulation = (simulation: SimulationData) =>
    this.post(
      this.routes.simulation(this.getChannelQueryString()),
      simulation,
      {
        metric: 'checkout-simulation',
      }
    )

  public insertCoupon = (orderFormId: string, coupon: string) =>
    this.post<CheckoutOrderForm>(this.routes.insertCoupon(orderFormId), {
      text: coupon,
    })

  public clearMessages = (orderFormId: string) =>
    this.post<CheckoutOrderForm>(this.routes.clearMessages(orderFormId), {})

  public getProfile = (email: string) =>
    this.get<CheckoutProfile>(this.routes.profile(email))

  protected get = <T>(url: string, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http.get<T>(url, config).catch(statusToError) as Promise<T>
  }

  protected post = <T>(url: string, data?: any, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http.post<T>(url, data, config).catch(statusToError) as Promise<
      T
    >
  }

  protected postRaw = async <T>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http
      .postRaw<T>(url, data, config)
      .catch(statusToError) as Promise<IOResponse<T>>
  }

  protected delete = <T>(url: string, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http.delete<T>(url, config).catch(statusToError) as Promise<
      IOResponse<T>
    >
  }

  protected patch = <T>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http
      .patch<T>(url, data, config)
      .catch(statusToError) as Promise<T>
  }

  protected put = <T>(url: string, data?: any, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http.put<T>(url, data, config).catch(statusToError) as Promise<
      T
    >
  }

  private getCommonHeaders = () => {
    const { orderFormId } = this.context as CustomIOContext
    const checkoutCookie = orderFormId ? checkoutCookieFormat(orderFormId) : ''
    return {
      Cookie: `${checkoutCookie}vtex_segment=${this.context.segmentToken};vtex_session=${this.context.sessionToken};`,
    }
  }

  private getChannelQueryString = () => {
    const { segment } = this.context as CustomIOContext
    const channel = segment?.channel
    const queryString = channel ? `?sc=${channel}` : ''
    return queryString
  }

  private get routes() {
    const base = '/api/checkout/pub'
    return {
      addItem: (orderFormId: string, queryString: string) =>
        `${base}/orderForm/${orderFormId}/items${queryString}`,
      assemblyOptions: (
        orderFormId: string,
        itemId: string | number,
        assemblyOptionsId: string
      ) =>
        `${base}/orderForm/${orderFormId}/items/${itemId}/assemblyOptions/${assemblyOptionsId}`,
      attachmentsData: (orderFormId: string, field: string) =>
        `${base}/orderForm/${orderFormId}/attachments/${field}`,
      cancelOrder: (orderFormId: string) =>
        `${base}/orders/${orderFormId}/user-cancel-request`,
      checkin: (orderFormId: string) =>
        `${base}/orderForm/${orderFormId}/checkIn`,
      clearMessages: (orderFormId: string) =>
        `${base}/orderForm/${orderFormId}/messages/clear`,
      insertCoupon: (orderFormId: string) =>
        `${base}/orderForm/${orderFormId}/coupons`,
      orderForm: `${base}/orderForm`,
      orderFormCustomData: (
        orderFormId: string,
        appId: string,
        field: string
      ) => `${base}/orderForm/${orderFormId}/customData/${appId}/${field}`,
      orders: `${base}/orders`,
      orderFormProfile: (orderFormId: string) =>
        `${base}/orderForm/${orderFormId}/profile`,
      profile: (email: string) => `${base}/profiles/?email=${email}`,
      simulation: (queryString: string) =>
        `${base}/orderForms/simulation${queryString}`,
      updateItems: (orderFormId: string) =>
        `${base}/orderForm/${orderFormId}/items/update`,
      savePaymentToken: (queryString: string) =>
        `${base}/current-user/payment-tokens/${queryString}`,
      getPaymentSession: () => `${base}/payment-session`,
    }
  }
}
