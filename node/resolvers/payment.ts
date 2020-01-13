export const queries = {
    getCardSessionId: async (_: any, __: any, ctx: Context): Promise<String> => {
        const {
          clients,
        } = ctx
    
        const { id: cardSessionId } = await clients.checkout.getPaymentSession()

        return cardSessionId
      },
}