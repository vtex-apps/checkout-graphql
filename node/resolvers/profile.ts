export const queries = {
  checkoutProfile: async (
    _: unknown,
    { email }: { email: string },
    ctx: Context
  ): Promise<CheckoutProfile> => {
    const { clients } = ctx

    const profile = await clients.checkout.getProfile(email)

    return profile
  },
}
