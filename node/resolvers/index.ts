import { mutations as couponMutations } from './coupon'
import { mutations as itemMutations } from './items'
import { queries as orderFormQueries } from './orderForm'
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
  OrderForm: {
    marketingData: (orderForm: OrderForm) => {
      return orderForm.marketingData ?? {}
    },
  },
  Mutation: {
    ...couponMutations,
    ...itemMutations,
    ...shippingMutations,
    ...paymentMutations,
  },
  Query: {
    ...orderFormQueries,
    ...paymentQueries,
    ...profileQueries,
  },
}
