import { mutations as cartMutations, queries as cartQueries } from './cart'

import { mutations as couponMutations } from './coupon'

export const resolvers = {
  Mutation: {
    ...cartMutations,
    ...couponMutations,
  },
  Query: {
    ...cartQueries,
  },
}
