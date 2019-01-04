
const query: Resolver = (root, args, { dataSources: { checkout } }) => {
  return checkout.orderForm()
}

export default query
