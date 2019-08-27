import { mutations as couponMutations } from './coupon'
import { mutations as itemMutations } from './items'
import { queries as orderFormQueries } from './orderForm'

export const resolvers = {
  Mutation: {
    ...couponMutations,
    ...itemMutations,
  },
  Query: {
    ...orderFormQueries,
  },
}
