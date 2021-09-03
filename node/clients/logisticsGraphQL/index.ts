import { InstanceOptions, IOContext } from '@vtex/api'
import {
  LoadingDock,
  QueryLoadingDockArgs,
} from 'vtex.logistics-carrier-graphql'

import LogisticsBaseClient from './logisticsBase'

export class LogisticsRest extends LogisticsBaseClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
      headers: {
        ...options?.headers,
        ...(context.adminUserAuthToken
          ? {
              VtexIdclientAutCookie:
                context.adminUserAuthToken ?? context.storeUserAuthToken,
            }
          : null),
      },
    })
  }

  public getLoadingDock = (options: QueryLoadingDockArgs) =>
    this.http.get<LoadingDock>(
      `${this.baseURL}/loading-docks/${encodeURIComponent(options.id)}`,
      {
        metric: 'loadingDocks--getById',
      }
    )
}
