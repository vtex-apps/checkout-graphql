import { mutations as couponMutations } from './coupon'
import { root as itemRoot, mutations as itemMutations } from './items'
import {
  root as orderFormRoot,
  queries as orderFormQueries,
  mutations as orderFormMutations,
} from './orderForm'
import {
  root as shippingRoot,
  mutations as shippingMutations,
} from './shipping'
import {
  queries as paymentQueries,
  mutations as paymentMutations,
} from './payment'
import { queries as profileQueries } from './profile'
import { queries as slaQueries } from './sla'

export const resolvers = {
  MarketingData: {
    coupon: (marketingData: OrderFormMarketingData) => {
      return marketingData.coupon ?? ''
    },
    gclid: (marketingData: OrderFormMarketingData) => {
      return marketingData.gclid ?? ''
    },
    utmCampaign: (marketingData: OrderFormMarketingData) => {
      return marketingData.utmCampaign ?? ''
    },
    utmSource: (marketingData: OrderFormMarketingData) => {
      return marketingData.utmSource ?? ''
    },
    utmMedium: (marketingData: OrderFormMarketingData) => {
      return marketingData.utmMedium ?? ''
    },
    utmiCampaign: (marketingData: OrderFormMarketingData) => {
      return marketingData.utmiCampaign ?? ''
    },
    utmiPart: (marketingData: OrderFormMarketingData) => {
      return marketingData.utmiPart ?? ''
    },
    utmiPage: (marketingData: OrderFormMarketingData) => {
      return marketingData.utmipage ?? ''
    },
  },
  ...orderFormRoot,
  ...shippingRoot,
  ...itemRoot,
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
    ...slaQueries,
  },
}
