import CheckoutDataSource from './dataSources/checkout'

import {
  queries as cartQueries,
  resolvers as cartResolvers,
} from './resolvers/Cart'
import shippingResolvers from './resolvers/shipping'

export default {
  graphql: {
    dataSources: () => ({
      checkout: new CheckoutDataSource(),
    }),
    resolvers: {
      Query: {
        ...cartQueries,
      },
      ...cartResolvers,
      ...shippingResolvers,
    },
  }
}