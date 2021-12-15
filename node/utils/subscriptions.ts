const FREQUENCY_PATTERN = /(\d{1,3})?\s*(\w*?)(?:$|s|ly)/i

const SUBSCRIPTION_PREFIX = `vtex.subscription`
const SUBSCRIPTION_KEY_PREFIX = `${SUBSCRIPTION_PREFIX}.key`

const SUBSCRIPTION_KEY_FREQUENCY = `${SUBSCRIPTION_KEY_PREFIX}.frequency`
const SUBSCRIPTION_KEY_VALIDITY = `${SUBSCRIPTION_KEY_PREFIX}.validity`

const SUBSCRIPTION_KEY_VALIDITY_END = `${SUBSCRIPTION_KEY_VALIDITY}.end`


export function parseFrequency(frequency: string) {
  const match = frequency.trim().match(FREQUENCY_PATTERN)

  if (!match) {
    return
  }

  const [, count = '1', type] = match

  if (!type) return

  return {
    interval: +count,
    periodicity: type.toUpperCase(),
  } as SubscriptionDataEntry['plan']['frequency']
}

export function parseValidity(validityEnd: string) {
  return {
    end: validityEnd,
  }
}

export function generateSubscriptionDataEntry(
  subscriptionsFromAssemblyOptions: Array<{
    itemIndex: number
    options: AssemblyOptionInput[]
  }>
): SubscriptionDataEntry[] {
  const planType = 'RECURRING_PAYMENT'
  const defaultExecutionCount = 0

  const subscriptionDataEntries = subscriptionsFromAssemblyOptions.map(item => {
    const { itemIndex, options } = item

    const subscriptionFrequencyOption = options.find(option =>
      Boolean(option.inputValues[SUBSCRIPTION_KEY_FREQUENCY])
    )

    if (!subscriptionFrequencyOption) {
      return null
    }

    const planFrequency = parseFrequency(
      subscriptionFrequencyOption.inputValues[SUBSCRIPTION_KEY_FREQUENCY]
    )

    if (!planFrequency) {
      return null
    }

    const validityEnd = subscriptionFrequencyOption.inputValues[SUBSCRIPTION_KEY_VALIDITY_END]

    const planValidity = {
      end: validityEnd
    }
    
    const subscriptionPlan = {
      frequency: planFrequency,
      type: planType,
      validity: planValidity,
    }

    return {
      executionCount: defaultExecutionCount,
      itemIndex,
      plan: subscriptionPlan,
    }
  })

  // Remove null entries caused by invalid frequencies
  const validSubscriptionDataEntries = subscriptionDataEntries.filter(Boolean)

  return validSubscriptionDataEntries as SubscriptionDataEntry[]
}
