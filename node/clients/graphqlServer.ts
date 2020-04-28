import {
    AppClient,
    GraphQLClient,
    InstanceOptions,
    IOContext,
    RequestConfig,
    Serializable,
  } from '@vtex/api'
import { ProductArgs } from './searchGraphQL/productQuery'
  
  export class GraphQLServer extends AppClient {
    protected graphql: GraphQLClient
  
    constructor(ctx: IOContext, opts?: InstanceOptions) {
      super('vtex.graphql-server@1.x', ctx, opts)
      this.graphql = new GraphQLClient(this.http)
    }
  
    public query = async <T extends Serializable>(query: string, variables: any, extensions: any, config: RequestConfig) => {
      return this.graphql.query<T, ProductArgs>(
        {
          extensions,
          query,
          variables,
        },
        {
          ...config,
          params: {
            ...config.params,
            locale: this.context.locale,
          },
          url: '/graphql',
        }
      )
    }
  }