import {
  generateSubscriptionDataEntry,
  parseFrequency,
} from '../utils/subscriptions'

const FREQ_KEY = 'vtex.subscription.key.frequency'

const subscriptionOption = (
  frequency: string,
  overrides: Partial<AssemblyOptionInput> = {}
): AssemblyOptionInput => ({
  id: 'sku-1',
  quantity: 1,
  assemblyId: 'vtex.subscription.assembly',
  seller: '1',
  inputValues: { [FREQ_KEY]: frequency },
  ...overrides,
})

const nonSubscriptionOption = (
  overrides: Partial<AssemblyOptionInput> = {}
): AssemblyOptionInput => ({
  id: 'sku-2',
  quantity: 1,
  assemblyId: 'other-assembly',
  seller: '1',
  inputValues: { 'other-key': 'whatever' },
  ...overrides,
})

describe('utils/subscriptions', () => {
  describe('parseFrequency', () => {
    it.each([
      ['weekly', { interval: 1, periodicity: 'WEEK' }],
      ['monthly', { interval: 1, periodicity: 'MONTH' }],
      ['30 days', { interval: 30, periodicity: 'DAY' }],
      ['2 months', { interval: 2, periodicity: 'MONTH' }],
      ['1 year', { interval: 1, periodicity: 'YEAR' }],
    ])('parses %s as %p', (input, expected) => {
      expect(parseFrequency(input)).toEqual(expected)
    })

    it('trims surrounding whitespace', () => {
      expect(parseFrequency('  weekly  ')).toEqual({
        interval: 1,
        periodicity: 'WEEK',
      })
    })

    it('uppercases the periodicity token', () => {
      expect(parseFrequency('1 MONTH')).toEqual({
        interval: 1,
        periodicity: 'MONTH',
      })
    })

    it('returns undefined for an empty string', () => {
      expect(parseFrequency('')).toBeUndefined()
    })

    it('returns undefined for whitespace-only input', () => {
      expect(parseFrequency('   ')).toBeUndefined()
    })

    it('returns undefined when only digits are provided (no periodicity)', () => {
      expect(parseFrequency('30')).toBeUndefined()
    })
  })

  describe('generateSubscriptionDataEntry', () => {
    it('returns an empty list for empty input', () => {
      expect(generateSubscriptionDataEntry([])).toEqual([])
    })

    it('ignores items whose options have no frequency key', () => {
      expect(
        generateSubscriptionDataEntry([
          { itemIndex: 0, options: [nonSubscriptionOption()] },
        ])
      ).toEqual([])
    })

    it('ignores items whose frequency parses to undefined', () => {
      expect(
        generateSubscriptionDataEntry([
          { itemIndex: 0, options: [subscriptionOption('')] },
          { itemIndex: 1, options: [subscriptionOption('30')] },
        ])
      ).toEqual([])
    })

    it('produces a properly shaped entry for a valid subscription option', () => {
      expect(
        generateSubscriptionDataEntry([
          { itemIndex: 2, options: [subscriptionOption('30 days')] },
        ])
      ).toEqual([
        {
          executionCount: 0,
          itemIndex: 2,
          plan: {
            frequency: { interval: 30, periodicity: 'DAY' },
            type: 'RECURRING_PAYMENT',
            validity: {},
          },
        },
      ])
    })

    it('keeps only the valid entries and preserves item indices', () => {
      const result = generateSubscriptionDataEntry([
        { itemIndex: 0, options: [subscriptionOption('weekly')] },
        { itemIndex: 1, options: [nonSubscriptionOption()] },
        { itemIndex: 2, options: [subscriptionOption('2 months')] },
      ])

      expect(result).toHaveLength(2)
      expect(result.map(entry => entry.itemIndex)).toEqual([0, 2])
      expect(result.map(entry => entry.plan.frequency)).toEqual([
        { interval: 1, periodicity: 'WEEK' },
        { interval: 2, periodicity: 'MONTH' },
      ])
    })

    it('picks the first option that carries the frequency key', () => {
      const result = generateSubscriptionDataEntry([
        {
          itemIndex: 0,
          options: [
            nonSubscriptionOption(),
            subscriptionOption('monthly'),
            subscriptionOption('weekly'),
          ],
        },
      ])

      expect(result).toHaveLength(1)
      expect(result[0].plan.frequency).toEqual({
        interval: 1,
        periodicity: 'MONTH',
      })
    })
  })
})
