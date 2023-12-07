import { InstanceOptions, IOContext } from '@vtex/api'
import DataLoader from 'dataloader'

import { GraphQLServer } from '../graphqlServer'
import {
  ProductArgs,
  query as productQuery,
  ProductResponse,
  ProductsByIdentifierResponse,
} from './productQuery'

const extensions = {
  persistedQuery: {
    provider: 'vtex.search-graphql@0.x',
    sender: 'vtex.checkout-graphql@0.x',
  },
}

export class SearchGraphQL extends GraphQLServer {
  private productLoader: DataLoader<string, ProductResponse>

  constructor(ctx: IOContext, opts?: InstanceOptions) {
    super(ctx, opts)

    this.productLoader = new DataLoader(async keys => {
      const { data, errors } = await this.query<
        ProductsByIdentifierResponse,
        ProductArgs
      >(productQuery, { values: keys }, extensions, { metric: 'get-product' })
      
      if (errors && errors.length > 0) {
        const [error] = errors

        return keys.map(() => error.originalError!)
      }

      return keys.map(
        id =>
          data?.productsByIdentifier.find(
            product => product.productId === id
          ) ?? new Error('Product not found')
      )
    })
  }

  public product = (productId: string) => this.productLoader.load(productId)
}
