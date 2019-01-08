import CheckoutDataSource from './dataSources/checkout'

import {
  queries as cartQueries,
  resolvers as cartResolvers,
} from './resolvers/Cart'
import shippingResolvers from './resolvers/Shipping'
import shippingMutations from './mutations/Shipping'

export default {
  graphql: {
    dataSources: () => ({
      checkout: new CheckoutDataSource(),
    }),
    resolvers: {
      // Mutation: {
      //   ...shippingMutations,
      // },
      Query: {
        ...cartQueries,
      },
      ...cartResolvers,
      ...shippingResolvers,
    },
  }
}