export default function resolver(root, args, ctx) {
  const orderForm = ctx.orderForm

  if (!orderForm.shippingData) {
    return null
  }

  const selectedAddresses = orderForm.shippingData.selectedAddresses
  const availableAddresses = orderForm.shippingData.availableAddresses

  return {
    selected: selectedAddresses.find(
      address => address.addressType === 'residential'
    ),
    saved: availableAddresses,
  }
}