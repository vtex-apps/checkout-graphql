import { AppGraphQLClient, InstanceOptions, IOContext, Serializable } from '@vtex/api'

import { ProductArgs, ProductResponse, query as productQuery } from './productQuery'

export class StoreGraphQL extends AppGraphQLClient {
  constructor(ctx: IOContext, opts?: InstanceOptions) {
    super('vtex.store-graphql', ctx, opts)
  }

  public product = <T extends Serializable = ProductResponse>(
    variables: ProductArgs,
    query: string = productQuery
  ) => this.graphql.query<T, ProductArgs>({
    query,
    useGet: true,
    variables,
  }, {
    metric: 'get-product',
  })
}
