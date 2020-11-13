export const queries = {
  checkoutProfile: async (
    _: unknown,
    { email }: { email: string },
    ctx: Context
  ): Promise<CheckoutProfile> => {
    const { clients, graphql: { cacheControl } } = ctx

    cacheControl.noCache = true
    cacheControl.noStore = true

    const profile = await clients.checkout.getProfile(email)

    return profile
  },
}
