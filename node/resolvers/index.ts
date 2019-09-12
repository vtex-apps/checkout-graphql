import { mutations as couponMutations } from './coupon'
import { mutations as itemMutations } from './items'
import { queries as orderFormQueries } from './orderForm'
import { mutations as shippingMutations } from './shipping'

export const resolvers = {
  MarketingData: {
    coupon: (marketingData: OrderFormMarketingData) => {
      return marketingData.coupon || ''
    },
  },
  Mutation: {
    ...couponMutations,
    ...itemMutations,
    ...shippingMutations,
  },
  OrderForm: {
    marketingData: (orderForm: OrderForm) => {
      return orderForm.marketingData || {}
    },
  },
  Query: {
    ...orderFormQueries,
  },
}
