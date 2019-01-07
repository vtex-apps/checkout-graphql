export default function resolver(parent, args, ctx) {
  const currencyCode = ctx.orderForm.storePreferencesData.currencyCode

  return {
    currencyCode,
    value: parent.price,
  }
}