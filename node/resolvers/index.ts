import { mutations as couponMutations } from './coupon'
import { mutations as itemMutations } from './items'
import {
  root as orderFormRoot,
  queries as orderFormQueries,
  mutations as orderFormMutations,
} from './orderForm'
import { Address, mutations as shippingMutations } from './shipping/index'
import {
  queries as paymentQueries,
  mutations as paymentMutations,
} from './payment'
import { queries as profileQueries } from './profile'

export const resolvers = {
  Address,
  MarketingData: {
    coupon: (marketingData: OrderFormMarketingData) => {
      return marketingData.coupon ?? ''
    },
  },
  ...orderFormRoot,
  Mutation: {
    ...couponMutations,
    ...itemMutations,
    ...shippingMutations,
    ...paymentMutations,
    ...orderFormMutations,
  },
  Query: {
    ...orderFormQueries,
    ...paymentQueries,
    ...profileQueries,
  },
}
