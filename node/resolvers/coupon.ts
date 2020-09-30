import { OrderFormIdArgs } from '../utils/args'

export const mutations = {
  insertCoupon: async (
    _: unknown,
    args: { text: string } & OrderFormIdArgs,
    ctx: Context
  ) => {
    const { clients, vtex } = ctx
    const { orderFormId = vtex.orderFormId } = args

    const newOrderForm = await clients.checkout.insertCoupon(
      orderFormId!,
      args.text
    )

    return newOrderForm
  },
}
