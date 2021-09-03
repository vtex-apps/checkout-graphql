import { IOContext, InstanceOptions, JanusClient } from '@vtex/api'

class LogisticsBaseClient extends JanusClient {
  protected baseURL = '/api/logistics/pvt'
  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, {
      ...options,
      headers: {
        ...options?.headers,
        VtexIdclientAutCookie:
          context.adminUserAuthToken ?? context.storeUserAuthToken ?? '',
      },
    })
  }
}

export default LogisticsBaseClient
