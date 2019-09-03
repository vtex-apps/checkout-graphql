import { mutations as couponMutations } from "./coupon"
import { mutations as itemMutations } from "./items"
import { queries as orderFormQueries } from "./orderForm"
import { mutations as shippingMutations } from "./shipping"

export const resolvers = {
  Mutation: {
    ...couponMutations,
    ...itemMutations,
    ...shippingMutations,
  },
  Query: {
    ...orderFormQueries,
  },
}
