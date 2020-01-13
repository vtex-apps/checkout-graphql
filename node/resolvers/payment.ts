export const queries = {
    getCardSessionId: async (_: any, __: any, ctx: Context): Promise<String> => {
        const {
          clients,
        } = ctx
    
        const { id: cardSessionId } = await clients.checkout.getPaymentSession()

        return cardSessionId
      },
}

export const mutations = {
  savePaymentToken: async (
    _: any,
    { paymentTokens } : any,
    ctx: Context
  ): Promise<string> => {
    const {
      clients
    } = ctx
    const { checkout } = clients
    await checkout.savePaymentToken(paymentTokens)
    return 'Ok!'
  },
}