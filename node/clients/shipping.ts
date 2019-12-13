import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { checkoutCookieFormat, statusToError } from '../utils'

export class Shipping extends JanusClient {
  public constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...(options && options.headers),
        ...(ctx.storeUserAuthToken
          ? { VtexIdclientAutCookie: ctx.storeUserAuthToken }
          : null),
      },
    })
  }

  public shippingAttachmentRequest = (
    orderFormId: string,
    shippingData: ShippingDataRequest
  ) => {
    return this.post<CheckoutOrderForm>(
      this.routes.shippingAttachmentRequest(orderFormId),
      shippingData,
      { metric: 'shipping-estimate' }
    )
  }

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

  private getCommonHeaders = () => {
    const { orderFormId } = this.context as CustomIOContext
    const checkoutCookie = orderFormId ? checkoutCookieFormat(orderFormId) : ''
    return {
      Cookie: `${checkoutCookie}vtex_segment=${this.context.segmentToken};vtex_session=${this.context.sessionToken};`,
    }
  }

  private get routes() {
    const base = '/api/checkout/pub'
    return {
      shippingAttachmentRequest: (orderFormId: string) =>
        `${base}/orderForm/${orderFormId}/attachments/shippingData`,
    }
  }
}
