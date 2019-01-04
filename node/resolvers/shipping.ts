
export const fieldResolvers = {
  ShippingOption: {
    __resolveType: (shippingOption, context, info) => {
      return shippingOption
    }
  },
  SelectedOption: {
    __resolveType: (selectedOption, context, info) => {
      return selectedOption
    }
  }
}