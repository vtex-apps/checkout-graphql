import { ServiceContext, SegmentData, ParamsContext } from '@vtex/api'

import { Clients } from '../clients'

declare global {
  type Context = ServiceContext<Clients, RecorderState, CustomContext>

  interface CustomContext extends ParamsContext {
    cookie: string
    dataSources: SearchGraphQLDataSources
    originalPath: string
    vtex: CustomIOContext
    graphql: {
      cacheControl: {
        noStore: boolean
        noCache: boolean
      }
    }
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
    isDisposable: boolean
  }

  type AddressFields = keyof CheckoutAddress

  interface CountryDataSchema {
    countryISO: string
    addressFields: AddressFieldsSchema
    phone: PhoneSchema
  }

  interface AddressFieldsSchema {
    [field in AddressField]: AddressFieldSchema
    postalCode?: AddressFieldSchema & PostalCodeSchema
  }

  interface PostalCodeSchema {
    forgottenURL?: string
  }

  interface AddressFieldSchema {
    label: string
    name?: AddressField | 'addressType'
    hidden?: boolean
    maxLength?: number
    size?: string
    required?: boolean
    autoComplete?: string
    optionsCaption?: string
    options?: AddressOption[]
    elementName?: string
    mask?: string
  }

  interface AddressOption {
    label: string
    value: string
  }

  interface BusinessHour {
    DayOfWeek: number
    ClosingTime: string
    OpeningTime: string
  }

  interface NormalizedBusinessHour {
    dayNumber: string | number
    closed: boolean
    closingTime: string
    openingTime: string
  }

  interface PhoneSchema {
    countryCode: string
    mask?: string
    pattern: string
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
    manualPrice: number
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
    priceDefinition: {
      calculatedSellingPrice: number
      sellingPrices: SellingPrice[]
      total: number
    }
  }

  interface SellingPrice {
    quantity: number
    value: number
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

  interface SubscriptionDataEntry {
    executionCount: number
    itemIndex: number
    plan: {
      frequency: {
        interval: number
        periodicity: 'YEAR' | 'MONTH' | 'WEEK' | 'DAY'
      }
      type: string
      validity: {}
    }
  }

  interface SubscriptionData {
    subscriptions: SubscriptionDataEntry[]
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
    shippingData: ShippingData | null
    clientProfileData: ClientProfileData | null
    paymentData: PaymentData
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
    subscriptionData: SubscriptionData | null
    itemsOrdination: any | null
  }

  interface CheckoutProfile {
    userProfileId: string
    profileProvider: string
    availableAccounts: string[]
    availableAddresses: CheckoutAddress[]
    userProfile: any
  }

  interface ClientProfileData {
    email: string
    firstName: string
    lastName: string
    document: string
    documentType: string
    phone: string
    corporateName: string
    tradeName: string
    corporateDocument: string
    stateInscription: string
    corporatePhone: string
    isCorporate: boolean
    profileCompleteOnLoading: boolean
    profileErrorOnLoading: boolean
    customerClass: string
  }

  interface PaymentData {
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

  interface ShippingData {
    address: CheckoutAddress | null
    logisticsInfo: LogisticsInfo[]
    selectedAddresses: CheckoutAddress[]
    availableAddresses: CheckoutAddress[]
    pickupPoints: PickupPoint[]
  }

  interface PickupPoint {
    friendlyName: string
    address: CheckoutAddress
    additionalInfo: string
    id: string
    businessHours: BusinessHour[]
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
    transitTime: string | null
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
    isGift: boolean
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
    pickupOptions: PickupOption[]
    selectedAddress: CheckoutAddress | null
  }

  interface DeliveryOption {
    id: string
    price: number
    estimate: string
    isSelected: boolean
  }

  interface PickupOption {
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
    optInNewsletter?: boolean
    locale?: string
  }

  interface CheckoutClientPreferencesData {
    optinNewsLetter?: boolean
    locale?: string
  }

  interface PaymentInput {
    paymentSystem?: string
    bin?: string
    accountId?: string
    tokenId?: string
    installments?: number
    referenceValue?: number
    value?: number
  }

  interface PaymentDataInput {
    payments: PaymentInput[]
  }

  interface ItemsOrdinationArgs {
    ascending: boolean
    criteria: ItemsOrdinationCriteria
  }

  interface OpenTextField {
    value?: string
  }
}
