import { AppGraphQLClient, InstanceOptions, IOContext, Serializable } from '@vtex/api'

import { ProductArgs, ProductResponse, query as productQuery } from './productQuery'

export class SearchGraphQL extends AppGraphQLClient {
  constructor(ctx: IOContext, opts?: InstanceOptions) {
    super('vtex.search-graphql', ctx, opts)
  }

  public product = <T extends Serializable = ProductResponse>(
    variables: ProductArgs,
    query: string = productQuery
  ) => this.graphql.query<T, ProductArgs>({
    query,
    variables,
  }, {
    metric: 'get-product',
  })
}
