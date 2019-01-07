export default function resolver(parent, args, ctx) {
  const sellerInfo = ctx.orderForm.sellers.find(seller => seller.id === parent.seller)
  return sellerInfo
}