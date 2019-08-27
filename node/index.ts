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
    dataSources: StoreGraphQLDataSources
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
    addressType: string
    receiverName: string
    addressId: string
    postalCode: string
    city: string
    state: string
    country: string
    street: string
    number: string
    neighborhood: string
    complement: string
    reference: string | null
    geoCoordinates: [number, number]
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

  interface OrderForm {
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
    shippingData: {
      address: CheckoutAddress
      logisticsInfo: Array<{
        itemIndex: number
        selectedSla: string
        selectedDeliveryChannel: string
        addressId: string
        slas: Array<{
          id: string
          deliveryChannel: string
          name: string
          deliveryIds: Array<{
            courierId: string
            warehouseId: string
            dockId: string
            courierName: string
            quantity: number
          }>
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
          pickupDistance: number
          polygonName: string | null
        }>
        shipsTo: string[]
        itemId: string
        deliveryChannels: Array<{ id: string }>
      }>
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
      saveUserData: boolean
      timeZone: string
      currencyCode: string
      currencyLocale: number
      currencySymbol: string
      currencyFormatInfo: {
        currencyDecimalDigits: number
        currencyDecimalSeparator: string
        currencyGroupSeparator: string
        currencyGroupSize: number
        startsWithCurrencySymbol: boolean
      }
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

  interface OrderFormItemInput {
    id?: number
    index?: number
    quantity?: number
    seller?: string
    options?: AssemblyOptionInput[]
  }

  interface AssemblyOptionInput {
    id: string
    quantity: number
    assemblyId: string
    seller: string
  }
}

// Segments are small and immutable.
const MAX_SEGMENT_CACHE = 10000
const segmentCache = new LRUCache<string, any>({ max: MAX_SEGMENT_CACHE })
metrics.trackCache('segment', segmentCache)

const storeGraphQLCache = new LRUCache<string, any>({ max: 5000 })
metrics.trackCache('storeGraphQL', storeGraphQLCache)

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
      segment: {
        memoryCache: segmentCache,
        timeout: THREE_SECONDS_MS,
      },
      storeGraphQL: {
        memoryCache: storeGraphQLCache,
        timeout: THREE_SECONDS_MS,
      },
    },
  },
  graphql: {
    resolvers,
    schemaDirectives,
  },
})
