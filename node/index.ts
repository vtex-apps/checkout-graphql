import CheckoutDataSource from './dataSources/checkout'

import cartQuery from './resolvers/cart'
import {
  fieldResolvers as shippingFieldResolvers
} from './resolvers/shipping'

export default {
  graphql: {
    dataSources: () => ({
      checkout: new CheckoutDataSource(),
    }),
    resolvers: {
      ...shippingFieldResolvers,
      Query: {
        cart: cartQuery,
      }
    },
  }
}