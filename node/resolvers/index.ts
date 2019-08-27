import { mutations as orderFormMutations, queries as orderFormQueries } from './orderForm'

import { mutations as couponMutations } from './coupon'

export const resolvers = {
  Mutation: {
    ...couponMutations,
    ...orderFormMutations,
  },
  Query: {
    ...orderFormQueries,
  },
}
