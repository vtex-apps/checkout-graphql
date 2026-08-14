const APP_ID = 'vtex.checkout-graphql@0.x'

const FORCE_INTSCH_HEADER = 'x-vtex-force-intsch-item-details'

const DEFAULT_COMPARISON_SAMPLE_RATE = 1

export interface CheckoutGraphQLSettings {
  useIntschForItemDetails: boolean
  /** Percentage of cart products resolved through both providers, 0-100. */
  itemDetailsComparisonSampleRate: number
}

const clampSampleRate = (value: unknown): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_COMPARISON_SAMPLE_RATE
  }

  return Math.min(Math.max(value, 0), 100)
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

  const forced = ctx.get(FORCE_INTSCH_HEADER) === 'true'

  try {
    const settings = await apps.getAppSettings(APP_ID)

    return {
      useIntschForItemDetails:
        forced || settings?.useIntschForItemDetails === true,
      itemDetailsComparisonSampleRate: clampSampleRate(
        settings?.itemDetailsComparisonSampleRate
      ),
    }
  } catch (error) {
    logger.error({
      message: 'Error when reading vtex.checkout-graphql app settings',
      error,
    })

    /**
     * Fail towards the current behavior, and with sampling off rather than on:
     * an unreadable setting must not be able to add upstream traffic.
     */
    return {
      useIntschForItemDetails: forced,
      itemDetailsComparisonSampleRate: 0,
    }
  }
}

/**
 * Reads this app's settings once per request. Every cart item resolves against
 * the same values, so the flag cannot flip halfway through a response.
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
