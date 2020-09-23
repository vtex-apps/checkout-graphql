import {
  InstanceOptions,
  IOContext,
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

export class CheckoutAdmin extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        ...(ctx.adminUserAuthToken
          ? { VtexIdClientAutCookie: ctx.adminUserAuthToken }
          : null),
      },
    })
  }

  public setManualPrice = (
    orderFormId: string,
    itemIndex: number,
    price: number
  ) =>
    this.put<CheckoutOrderForm>(
      this.routes.setManualPrice(orderFormId, itemIndex),
      {
        price,
      }
    )

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
    const { orderFormId } = (this.context as unknown) as CustomIOContext
    const checkoutCookie = orderFormId ? checkoutCookieFormat(orderFormId) : ''
    return {
      Cookie: `${checkoutCookie}vtex_segment=${this.context.segmentToken};vtex_session=${this.context.sessionToken};`,
    }
  }

  private get routes() {
    const base = '/api/checkout/pub'
    return {
      setManualPrice: (orderFormId: string, itemIndex: number) =>
        `${base}/orderForm/${orderFormId}/items/${itemIndex}/price`,
    }
  }
}
