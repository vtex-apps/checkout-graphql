import { LRUCache, SegmentData, Service, ServiceContext } from '@vtex/api'

import { Clients } from './clients'
import { schemaDirectives } from './directives'
import { resolvers } from './resolvers'

const THREE_SECONDS_MS = 3 * 1000
const TEN_SECONDS_MS = 10 * 1000

declare global {
  type Context = ServiceContext<Clients, void, CustomContext>

  interface CustomContext {
    cookie: string
    dataSources: SearchGraphQLDataSources
    originalPath: string
    vtex: CustomIOContext
  }

  interface CustomIOContext extends IOContext {
    segment?: SegmentData
    orderFormId?: string
  }

  interface OrderFormMarketingData {
    utmCampaign?: string
    utmMedium?: string
    utmSource?: string
    utmiCampaign?: string
    utmiPart?: string
    utmipage?: string
    marketingTags?: string
    coupon?: string
  }

  interface CheckoutAddress {
    addressId: string
    addressType: string
    city: string | null
    complement: string | null
    country: string
    geoCoordinates: number[]
    neighborhood: string | null
    number: string | null
    postalCode: string | null
    receiverName: string | null
    reference: string | null
    state: string | null
    street: string | null
  }

  interface OrderFormItem {
    id: string
    name: string
    detailUrl: string
    imageUrl: string
    skuName: string
    quantity: number
    uniqueId: string
    productId: string
    refId: string
    ean: string
    priceValidUntil: string
    price: number
    tax: number
    listPrice: number
    sellingPrice: number
    rewardValue: number
    isGift: boolean
    parentItemIndex: number | null
    parentAssemblyBinding: string | null
    productCategoryIds: string
    priceTags: string[]
    measurementUnit: string
    additionalInfo: {
      brandName: string
      brandId: string
      offeringInfo: any | null
      offeringType: any | null
      offeringTypeId: any | null
    }
    productCategories: Record<string, string>
    productRefId: string
    seller: string
    sellerChain: string[]
    availability: string
    unitMultiplier: number
    skuSpecifications: SKUSpecification[]
  }

  interface SKUSpecification {
    fieldName: string
    fieldValues: string[]
  }

  interface CompositionItem {
    id: string
    minQuantity: number
    maxQuantity: number
    initialQuantity: number
    priceTable: string
    seller: string
  }

  interface Composition {
    minQuantity: number
    maxQuantity: number
    items: CompositionItem[]
  }

  interface AssemblyOption {
    id: string
    name: string
    composition: Composition | null
  }

  interface MetadataItem {
    id: string
    name: string
    imageUrl: string
    detailUrl: string
    seller: string
    assemblyOptions: AssemblyOption[]
    skuName: string
    productId: string
    refId: string
    ean: string | null
  }
  interface AddedItem {
    choiceType: string
    compositionItem: CompositionItem
    extraQuantity: number
    item: OrderFormItem
    normalizedQuantity: number
  }

  interface RemovedItem {
    initialQuantity: number
    name: string
    removedQuantity: number
  }

  interface CheckoutOrderForm {
    orderFormId: string
    salesChannel: string
    loggedIn: boolean
    isCheckedIn: boolean
    storeId: string | null
    checkedInPickupPointId: string | null
    allowManualPrice: boolean
    canEditData: boolean
    userProfileId: string | null
    userType: string | null
    ignoreProfileData: boolean
    value: number
    messages: any[]
    items: OrderFormItem[]
    selectableGifts: any[]
    totalizers: Array<{
      id: string
      name: string
      value: number
    }>
    shippingData: ShippingData
    clientProfileData: any | null
    paymentData: {
      installmentOptions: Array<{
        paymentSystem: string
        bin: string | null
        paymentName: string | null
        paymentGroupName: string | null
        value: number
        installments: Array<{
          count: number
          hasInterestRate: false
          interestRate: number
          value: number
          total: number
          sellerMerchantInstallments: Array<{
            count: number
            hasInterestRate: false
            interestRate: number
            value: number
            total: number
          }>
        }>
      }>
      paymentSystems: Array<{
        id: string
        name: string
        groupName: string
        validator: {
          regex: string
          mask: string
          cardCodeRegex: string
          cardCodeMask: string
          weights: number[]
          useCvv: boolean
          useExpirationDate: boolean
          useCardHolderName: boolean
          useBillingAddress: boolean
        }
        stringId: string
        template: string
        requiresDocument: boolean
        isCustom: boolean
        description: string | null
        requiresAuthentication: boolean
        dueDate: string
        availablePayments: any | null
      }>
      payments: any[]
      giftCards: any[]
      giftCardMessages: any[]
      availableAccounts: any[]
      availableTokens: any[]
    }
    marketingData: OrderFormMarketingData | null
    sellers: Array<{
      id: string
      name: string
      logo: string
    }>
    clientPreferencesData: {
      locale: string
      optinNewsLetter: any | null
    }
    commercialConditionData: any | null
    storePreferencesData: {
      countryCode: string
      currencyCode: string
      currencyFormatInfo: {
        currencyDecimalDigits: number
        currencyDecimalSeparator: string
        currencyGroupSeparator: string
        currencyGroupSize: number
        startsWithCurrencySymbol: boolean
      }
      currencyLocale: string
      currencySymbol: string
      saveUserData: boolean
      timeZone: string
    }
    giftRegistryData: any | null
    openTextField: any | null
    invoiceData: any | null
    customData: any | null
    itemMetadata: {
      items: MetadataItem[]
    }
    hooksData: any | null
    ratesAndBenefitsData: {
      rateAndBenefitsIdentifiers: any[]
      teaser: any[]
    }
    subscriptionData: any | null
    itemsOrdination: any | null
  }

  interface CheckoutProfile {
    userProfileId: string
    profileProvider: string
    availableAccounts: string[]
    availableAddresses: CheckoutAddress[]
    userProfile: any
  }

  interface ShippingData {
    address: CheckoutAddress | null
    logisticsInfo: LogisticsInfo[]
    selectedAddresses: CheckoutAddress[]
    availableAddresses: CheckoutAddress[]
    pickupPoints: Array<{
      friendlyName: string
      address: CheckoutAddress
      additionalInfo: string
      id: string
      businessHours: Array<{
        DayOfWeek: number
        OpeningTime: string
        ClosingTime: string
      }>
    }>
  }

  interface LogisticsInfo {
    addressId: string | null
    deliveryChannels: DeliveryChannel[]
    itemId: string
    itemIndex: number
    shipsTo: string[]
    slas: SLA[]
    selectedDeliveryChannel: string | null
    selectedSla: string | null
  }

  interface DeliveryChannel {
    id: string
  }

  interface SLA {
    id: string
    deliveryChannel: string
    name: string
    deliveryIds: DeliveryId[]
    shippingEstimate: string
    shippingEstimateDate: string | null
    lockTTL: string | null
    availableDeliveryWindows: any[]
    deliveryWindow: string | null
    price: number
    listPrice: number
    tax: number
    pickupStoreInfo: {
      isPickupStore: boolean
      friendlyName: string | null
      address: CheckoutAddress | null
      additionalInfo: any | null
      dockId: string | null
    }
    pickupPointId: string | null
    pickupDistance: number | null
    polygonName: string | null
  }

  interface DeliveryId {
    courierId: string
    warehouseId: string
    dockId: string
    courierName: string
    quantity: number
  }

  interface ShippingDataRequest {
    logisticsInfo: LogisticsInfo[]
    selectedAddresses: CheckoutAddress[]
    clearAddressIfPostalCodeNotFound?: boolean
  }

  interface OrderFormItemInput {
    id?: number
    index?: number
    quantity?: number
    seller?: string
    uniqueId?: string
    options?: AssemblyOptionInput[]
  }

  interface AssemblyOptionInput {
    id: string
    quantity: number
    assemblyId: string
    seller: string
    inputValues: Record<string, string>
    options?: AssemblyOptionInput[]
  }

  interface Item {
    additionalInfo: {
      brandName: string
      brandId: string
      offeringInfo: any | null
      offeringType: any | null
      offeringTypeId: any | null
    }
    availability: string
    detailUrl: string
    id: string
    imageUrls?: {
      at1x: string
      at2x: string
      at3x: string
    }
    listPrice: number
    measurementUnit: string
    name: string
    price: number
    productId: string
    productCategories: Record<string, string>
    productCategoryIds: string
    productRefId: string
    quantity: number
    sellingPrice: number
    skuName: string
    skuSpecifications: SKUSpecification[]
    uniqueId: string
  }

  interface OrderForm {
    items: Item[]
    canEditData: boolean
    shipping?: Shipping
    marketingData: OrderFormMarketingData | null
    totalizers: Array<{
      id: string
      name: string
      value: number
    }>
    value: number
    messages: OrderFormMessages
  }

  interface Shipping {
    availableAddresses: CheckoutAddress[]
    countries: string[]
    deliveryOptions: DeliveryOption[]
    selectedAddress: CheckoutAddress | null
  }

  interface DeliveryOption {
    id: string
    price: number
    estimate: string
    isSelected: boolean
  }

  interface OrderFormMessages {
    couponMessages: Message[]
    generalMessages: Message[]
  }

  interface Message {
    code: string
    text: string
    status: string
  }

  interface PaymentSession {
    id: string
    name: string
    expiresAt: string
  }

  interface SavePaymentTokenPayload {
    status: string
  }

  interface UserProfileInput {
    email?: string
    firstName?: string
    lastName?: string
    document?: string
    phone?: string
    documentType?: string
    isCorporate?: boolean
    corporateName?: string
    tradeName?: string
    corporateDocument?: string
    stateInscription?: string
  }

  interface ClientPreferencesDataInput {
    optinNewsLetter?: boolean
    locale?: boolean
  }
}

// Segments are small and immutable.
const MAX_SEGMENT_CACHE = 10000
const segmentCache = new LRUCache<string, any>({ max: MAX_SEGMENT_CACHE })
metrics.trackCache('segment', segmentCache)

const searchGraphQLCache = new LRUCache<string, any>({ max: 5000 })
metrics.trackCache('searchGraphQL', searchGraphQLCache)

export default new Service<Clients, void, CustomContext>({
  clients: {
    implementation: Clients,
    options: {
      checkout: {
        timeout: TEN_SECONDS_MS,
      },
      default: {
        retries: 2,
        timeout: THREE_SECONDS_MS,
      },
      searchGraphQL: {
        memoryCache: searchGraphQLCache,
        timeout: THREE_SECONDS_MS,
      },
      segment: {
        memoryCache: segmentCache,
        timeout: THREE_SECONDS_MS,
      },
    },
  },
  graphql: {
    resolvers,
    schemaDirectives,
  },
})
