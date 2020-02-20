export const queries = {
  profile: (
    _: unknown,
    { email }: { email: string },
    ctx: Context
  ): Promise<CheckoutProfile> => {
    const { clients } = ctx

    return clients.checkout.getProfile(email)
  },
}
