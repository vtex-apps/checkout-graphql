/**
 * Validates the shipping portion of the orderForm
 */
export const isShippingValid = async (
  orderForm: CheckoutOrderForm,
  shipping: Omit<Shipping, 'selectedAddress'> &
    Partial<Pick<Shipping, 'selectedAddress'>>,
  ctx: Context
) => {
  if (
    !(
      shipping.selectedAddress &&
      shipping.deliveryOptions?.some(
        deliveryOption => deliveryOption?.isSelected
      )
    )
  ) {
    return false
  }

  if (!orderForm.canEditData) {
    return true
  }

  const address = shipping.selectedAddress

  if (address == null) {
    return false
  }

  if (!address.country) {
    return false
  }

  const countrySettings = await ctx.clients.countryDataSettings.getCountrySettings(
    address.country
  )

  if (!countrySettings) {
    return false
  }

  const fields = countrySettings.addressFields

  for (const [field, fieldSchema] of Object.entries(fields) as Array<
    [AddressFields, AddressFieldSchema]
  >) {
    const fieldValue = address[field]

    if (fieldSchema.required && !fieldValue) {
      return false
    }

    if (
      fieldSchema.maxLength &&
      fieldValue != null &&
      typeof fieldValue !== 'boolean' &&
      fieldValue.length > fieldSchema.maxLength
    ) {
      return false
    }
  }

  return true
}

/**
 * Validates the profile portion of the orderForm
 */
export const isProfileValid = async (
  orderForm: CheckoutOrderForm,
  profile: ClientProfileData,
  ctx: Context
) => {
  if (
    !profile ||
    !profile.firstName ||
    !profile.lastName ||
    !profile.phone ||
    !profile.document ||
    !profile.documentType
  ) {
    return false
  }

  if (!orderForm.canEditData) {
    return true
  }

  const countriesSettings = await ctx.clients.countryDataSettings.getAllCountriesSettings()

  const phoneCountry = countriesSettings.find(countrySetting => {
    return profile.phone.startsWith(`+${countrySetting.phone.countryCode}`)
  })

  if (!phoneCountry) {
    return false
  }

  return profile.phone.match(phoneCountry.phone.pattern) !== null
}

/**
 * Validates the payment portion of the orderForm
 */
export const isPaymentValid = (payment: PaymentData) => {
  return !!(payment.payments.length > 0)
}
