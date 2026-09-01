const APP_ID = 'vtex.checkout-graphql@0.x'

const FORCE_DATAPLANE_HEADER = 'x-vtex-force-catalog-dataplane-item-details'

export interface CheckoutGraphQLSettings {
  useCatalogDataPlaneForItemDetails: boolean
}

const settingsPerRequest = new WeakMap<
  object,
  Promise<CheckoutGraphQLSettings>
>()

const readAppSettings = async (
  ctx: Context
): Promise<CheckoutGraphQLSettings> => {
  const {
    clients: { apps },
    vtex: { logger },
  } = ctx

  const forced = ctx.get(FORCE_DATAPLANE_HEADER) === 'true'

  try {
    const settings = await apps.getAppSettings(APP_ID)

    return {
      useCatalogDataPlaneForItemDetails:
        forced || settings?.useCatalogDataPlaneForItemDetails === true,
    }
  } catch (error) {
    logger.error({
      message: 'Error when reading vtex.checkout-graphql app settings',
      error,
    })

    // Fail towards the current behavior.
    return { useCatalogDataPlaneForItemDetails: forced }
  }
}

/**
 * Reads this app's settings once per request. Every cart item resolves against
 * the same values, so the flag cannot flip halfway through a response and leave
 * a cart with items answered by two different providers.
 */
export const fetchAppSettings = (
  ctx: Context
): Promise<CheckoutGraphQLSettings> => {
  const cached = settingsPerRequest.get(ctx)

  if (cached) {
    return cached
  }

  const settings = readAppSettings(ctx)

  settingsPerRequest.set(ctx, settings)

  return settings
}
