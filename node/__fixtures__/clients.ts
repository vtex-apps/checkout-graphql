/**
 * Reusable factory for mocked clients used across black-box tests.
 *
 * Each method is a jest.fn() so tests can configure return values per case
 * via `.mockResolvedValue()` / `.mockReturnValue()` and assert call args.
 *
 * Use `toClients(makeClientsMock())` to obtain a value assignable to the
 * `Clients` type when passing to production code.
 */

import { Clients } from '../clients'

export interface CheckoutClientMock {
  orderForm: jest.Mock
  orderFormRaw: jest.Mock
  updateOrderFormShipping: jest.Mock
  updateOrderFormPayment: jest.Mock
  updateOrderFormProfile: jest.Mock
  updateOrderFormClientPreferencesData: jest.Mock
  updateOrderFormMarketingData: jest.Mock
  updateOrderFromOpenTextField: jest.Mock
  updateSubscriptionDataField: jest.Mock
  updateItems: jest.Mock
  updateItemsOrdination: jest.Mock
  addItem: jest.Mock
  addItemOffering: jest.Mock
  removeItemOffering: jest.Mock
  addBundleItemAttachment: jest.Mock
  removeBundleItemAttachment: jest.Mock
  addAssemblyOptions: jest.Mock
  removeAssemblyOptions: jest.Mock
  insertCoupon: jest.Mock
  clearMessages: jest.Mock
  getProfile: jest.Mock
  getPaymentSession: jest.Mock
  savePaymentToken: jest.Mock
  simulation: jest.Mock
}

export interface ClientsMock {
  checkout: CheckoutClientMock
  checkoutNoCookies: Pick<CheckoutClientMock, 'orderFormRaw'>
  checkoutAdmin: {
    orderForm: jest.Mock
    setManualPrice: jest.Mock
  }
  searchGraphQL: {
    product: jest.Mock
  }
  customSession: {
    getSession: jest.Mock
  }
  countryDataSettings: {
    getCountrySettings: jest.Mock
    getAllCountriesSettings: jest.Mock
  }
  apps: {
    getAppSettings: jest.Mock
  }
}

const makeCheckoutMock = (): CheckoutClientMock => ({
  orderForm: jest.fn(),
  orderFormRaw: jest.fn(),
  updateOrderFormShipping: jest.fn(),
  updateOrderFormPayment: jest.fn(),
  updateOrderFormProfile: jest.fn(),
  updateOrderFormClientPreferencesData: jest.fn(),
  updateOrderFormMarketingData: jest.fn(),
  updateOrderFromOpenTextField: jest.fn(),
  updateSubscriptionDataField: jest.fn(),
  updateItems: jest.fn(),
  updateItemsOrdination: jest.fn(),
  addItem: jest.fn(),
  addItemOffering: jest.fn(),
  removeItemOffering: jest.fn(),
  addBundleItemAttachment: jest.fn(),
  removeBundleItemAttachment: jest.fn(),
  addAssemblyOptions: jest.fn(),
  removeAssemblyOptions: jest.fn(),
  insertCoupon: jest.fn(),
  clearMessages: jest.fn(),
  getProfile: jest.fn(),
  getPaymentSession: jest.fn(),
  savePaymentToken: jest.fn(),
  simulation: jest.fn(),
})

export const makeClientsMock = (): ClientsMock => ({
  checkout: makeCheckoutMock(),
  checkoutNoCookies: { orderFormRaw: jest.fn() },
  checkoutAdmin: {
    orderForm: jest.fn(),
    setManualPrice: jest.fn(),
  },
  searchGraphQL: {
    product: jest.fn(),
  },
  customSession: {
    getSession: jest.fn(),
  },
  countryDataSettings: {
    getCountrySettings: jest.fn(),
    getAllCountriesSettings: jest.fn(),
  },
  apps: {
    getAppSettings: jest.fn().mockResolvedValue({}),
  },
})

/**
 * Casts the mock to the real `Clients` type. Use only at the boundary when
 * handing the mock to production code; keep tests interacting with the
 * `ClientsMock` shape directly so that jest matchers and IntelliSense work.
 */
export const toClients = (mock: ClientsMock): Clients =>
  (mock as unknown) as Clients
