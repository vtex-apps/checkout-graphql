import { IOContext as ioContext } from '@vtex/api'
import { Context as KoaContext } from 'koa'

import CheckoutDataSource from './dataSources/checkout'

declare global {
  interface IOContext extends ioContext {
    params: {
      [param: string]: string
    }
    route: {
      id: string
      declarer: string
      params: {
        [param: string]: string
      }
    },
  }

  interface ServiceContext extends KoaContext {
    vtex: IOContext
    dataSources: SearchGraphQLDataSources
    originalPath: string
  }

  interface SearchGraphQLDataSources {
    checkout: CheckoutDataSource
  }

  type Resolver<TArgs=any, TRoot=any> =
    (root: TRoot, args: TArgs, context: ServiceContext) => Promise<any>
}

export {}
