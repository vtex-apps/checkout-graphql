import { Logger } from '@vtex/api'

import {
  compareApiResults,
  filterIgnoredDifferences,
  findDifferences,
  isDeepEqual,
  shouldIgnoreDifference,
} from '../utils/compareResults'

/**
 * Tests for the shadow-comparison utility that guards the migration of cart
 * item details from `vtex.search-graphql` to the Intelligent Search API.
 *
 * Two properties of this code carry the whole rollout, and both are asserted
 * here rather than assumed:
 *
 *   1. It must never change what the caller receives. The value returned is
 *      always the selected provider's, and a failure on the shadow side is
 *      invisible to the caller.
 *   2. Its signal must be trustworthy. Differences that only reflect element
 *      ordering are noise and would get the logs ignored, so lists are matched
 *      by identity — while genuinely missing elements are still reported.
 */

const makeLogger = () =>
  (({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown) as Logger & {
    error: jest.Mock
    info: jest.Mock
    warn: jest.Mock
  })

const ALWAYS = 100

const NEVER = 0

describe('findDifferences', () => {
  it('reports nothing for deeply equal values', () => {
    const value = { a: 1, b: { c: ['x', 'y'] } }

    expect(findDifferences(value, { a: 1, b: { c: ['x', 'y'] } })).toEqual([])
  })

  it('reports a changed primitive with its path', () => {
    expect(findDifferences({ a: { b: 'one' } }, { a: { b: 'two' } })).toEqual([
      { path: 'a.b', type: 'different_value', expected: 'one', actual: 'two' },
    ])
  })

  it('distinguishes a key missing from the second value from an extra one', () => {
    const differences = findDifferences({ a: 1 }, { b: 2 })

    expect(differences).toEqual([
      { path: 'a', type: 'missing_key', expected: 1 },
      { path: 'b', type: 'extra_key', actual: 2 },
    ])
  })

  it('reports a null mismatch rather than a value difference', () => {
    expect(findDifferences({ a: null }, { a: 'x' })).toEqual([
      { path: 'a', type: 'null_mismatch', expected: null, actual: 'x' },
    ])
  })

  it('reports differing types without descending further', () => {
    expect(findDifferences({ a: 1 }, { a: '1' })).toEqual([
      {
        path: 'a',
        type: 'different_type',
        expected: 'number',
        actual: 'string',
      },
    ])
  })

  it('reports an array/object mismatch as a type difference', () => {
    expect(findDifferences({ a: [] }, { a: {} })).toEqual([
      {
        path: 'a',
        type: 'different_type',
        expected: 'array',
        actual: 'object',
      },
    ])
  })

  it('reports array length mismatches alongside the extra element', () => {
    expect(findDifferences([1], [1, 2])).toEqual([
      { path: '', type: 'array_length_mismatch', expected: 1, actual: 2 },
      { path: '[1]', type: 'extra_key', actual: 2 },
    ])
  })

  it('compares arrays positionally by default, so a reorder is a difference', () => {
    const differences = findDifferences(['a', 'b'], ['b', 'a'])

    expect(differences).toHaveLength(2)
    expect(differences.map(({ path }) => path)).toEqual(['[0]', '[1]'])
  })

  it('treats values past maxDepth as equal', () => {
    const deep = { a: { b: { c: { d: 'one' } } } }
    const other = { a: { b: { c: { d: 'two' } } } }

    expect(findDifferences(deep, other, '', { maxDepth: 2 })).toEqual([])
    expect(findDifferences(deep, other, '', { maxDepth: 10 })).toHaveLength(1)
  })

  describe('with existenceCompareFields', () => {
    const options = {
      existenceCompareFields: [{ path: 'items', key: 'itemId' }],
    }

    const items = [
      { itemId: '1', name: 'first' },
      { itemId: '2', name: 'second' },
    ]

    it('ignores the ordering of object lists matched by key', () => {
      const reordered = [items[1], items[0]]

      expect(
        findDifferences({ items }, { items: reordered }, '', options)
      ).toEqual([])
    })

    it('still reports an element missing from the second value', () => {
      const differences = findDifferences(
        { items },
        { items: [items[0]] },
        '',
        options
      )

      expect(differences).toEqual([
        { path: 'items[name:2]', type: 'missing_key', expected: items[1] },
      ])
    })

    it('still reports an element present only in the second value', () => {
      const extra = { itemId: '3', name: 'third' }

      const differences = findDifferences(
        { items },
        { items: [...items, extra] },
        '',
        options
      )

      expect(differences).toEqual([
        { path: 'items[name:3]', type: 'extra_key', actual: extra },
      ])
    })

    it('descends into matched elements and names the path by key', () => {
      const changed = [items[0], { itemId: '2', name: 'changed' }]

      expect(
        findDifferences({ items }, { items: changed }, '', options)
      ).toEqual([
        {
          path: 'items[name:2].name',
          type: 'different_value',
          expected: 'second',
          actual: 'changed',
        },
      ])
    })

    it('matches nested lists through a wildcard path', () => {
      const nested = {
        items: [
          {
            itemId: '1',
            variations: [
              { name: 'Cor', values: ['Azul'] },
              { name: 'Tamanho', values: ['P'] },
            ],
          },
        ],
      }

      const reordered = {
        items: [
          {
            itemId: '1',
            variations: [
              { name: 'Tamanho', values: ['P'] },
              { name: 'Cor', values: ['Azul'] },
            ],
          },
        ],
      }

      expect(
        findDifferences(nested, reordered, '', {
          existenceCompareFields: [
            { path: 'items', key: 'itemId' },
            { path: 'items[*].variations', key: 'name' },
          ],
        })
      ).toEqual([])
    })

    it('compares primitive lists by value when the pattern is a bare path', () => {
      expect(
        findDifferences({ values: ['a', 'b'] }, { values: ['b', 'a'] }, '', {
          existenceCompareFields: ['values'],
        })
      ).toEqual([])
    })

    it('falls back to positional comparison for elements without the key', () => {
      const differences = findDifferences(
        { items: [{ other: 'one' }] },
        { items: [{ other: 'two' }] },
        '',
        options
      )

      expect(differences).toEqual([
        {
          path: 'items[0].other',
          type: 'different_value',
          expected: 'one',
          actual: 'two',
        },
      ])
    })
  })
})

describe('isDeepEqual', () => {
  it('summarizes equality alongside the differences', () => {
    expect(isDeepEqual({ a: 1 }, { a: 1 })).toEqual({
      isEqual: true,
      differences: [],
    })

    expect(isDeepEqual({ a: 1 }, { a: 2 }).isEqual).toBe(false)
  })
})

describe('shouldIgnoreDifference', () => {
  const difference = {
    path: 'items[name:1].name',
    type: 'different_value' as const,
  }

  it('matches an exact path', () => {
    expect(shouldIgnoreDifference(difference, 'items[name:1].name')).toBe(true)
  })

  it('matches any array index through the [*] wildcard', () => {
    expect(shouldIgnoreDifference(difference, 'items[*].name')).toBe(true)
    expect(
      shouldIgnoreDifference(
        { ...difference, path: 'items[3].name' },
        'items[*].name'
      )
    ).toBe(true)
  })

  it('does not match a different path', () => {
    expect(shouldIgnoreDifference(difference, 'items[*].itemId')).toBe(false)
  })

  it('narrows to a single difference type when one is given', () => {
    expect(
      shouldIgnoreDifference(difference, {
        path: 'items[*].name',
        type: 'different_value',
      })
    ).toBe(true)

    expect(
      shouldIgnoreDifference(difference, {
        path: 'items[*].name',
        type: 'missing_key',
      })
    ).toBe(false)
  })
})

describe('filterIgnoredDifferences', () => {
  it('returns every difference when nothing is ignored', () => {
    const differences = [{ path: 'a', type: 'extra_key' as const }]

    expect(filterIgnoredDifferences(differences)).toEqual({
      filtered: differences,
      ignored: [],
    })
  })

  it('partitions differences by the ignore patterns', () => {
    const kept = { path: 'a.b', type: 'different_value' as const }
    const dropped = { path: 'a.c', type: 'different_value' as const }

    expect(filterIgnoredDifferences([kept, dropped], ['a.c'])).toEqual({
      filtered: [kept],
      ignored: [dropped],
    })
  })
})

describe('compareApiResults', () => {
  const selectedValue = { value: 'selected' }
  const shadowValue = { value: 'shadow' }

  it('runs only the selected side when the call falls outside the sample', async () => {
    const logger = makeLogger()
    const selected = jest.fn().mockResolvedValue(selectedValue)
    const shadow = jest.fn().mockResolvedValue(shadowValue)

    expect(await compareApiResults(selected, shadow, NEVER, logger)).toBe(
      selectedValue
    )

    expect(selected).toHaveBeenCalledTimes(1)
    expect(shadow).not.toHaveBeenCalled()
    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('runs both sides and logs a match at info level when they agree', async () => {
    const logger = makeLogger()
    const selected = jest.fn().mockResolvedValue({ a: 1 })
    const shadow = jest.fn().mockResolvedValue({ a: 1 })

    await compareApiResults(selected, shadow, ALWAYS, logger, {
      logPrefix: 'ItemDetails Comparison',
      args: { productId: '11' },
    })

    expect(selected).toHaveBeenCalledTimes(1)
    expect(shadow).toHaveBeenCalledTimes(1)
    expect(logger.error).not.toHaveBeenCalled()
    expect(logger.info).toHaveBeenCalledTimes(1)
    expect(logger.info.mock.calls[0][0]).toMatchObject({
      message: 'ItemDetails Comparison: Results are equal',
      params: JSON.stringify({ productId: '11' }),
      totalDifferences: 0,
    })
  })

  it('logs differences at error level and still returns the selected result', async () => {
    const logger = makeLogger()
    const selected = jest.fn().mockResolvedValue(selectedValue)
    const shadow = jest.fn().mockResolvedValue(shadowValue)

    expect(await compareApiResults(selected, shadow, ALWAYS, logger)).toBe(
      selectedValue
    )

    expect(logger.info).not.toHaveBeenCalled()
    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error.mock.calls[0][0]).toMatchObject({
      message: 'API Comparison: Results differ',
      differenceCount: 1,
      differences: [
        {
          path: 'value',
          type: 'different_value',
          expected: 'selected',
          actual: 'shadow',
        },
      ],
    })
  })

  it('caps the logged differences at ten while reporting the full count', async () => {
    const logger = makeLogger()
    const fifteen = (prefix: string) =>
      Object.fromEntries(
        Array.from({ length: 15 }, (_, i) => [`key${i}`, `${prefix}${i}`])
      )

    await compareApiResults(
      () => Promise.resolve(fifteen('a')),
      () => Promise.resolve(fifteen('b')),
      ALWAYS,
      logger
    )

    expect(logger.error.mock.calls[0][0]).toMatchObject({
      differenceCount: 15,
      totalDifferences: 15,
    })
    expect(logger.error.mock.calls[0][0].differences).toHaveLength(10)
  })

  it('does not report a difference when the ignore patterns cover it', async () => {
    const logger = makeLogger()

    await compareApiResults(
      () => Promise.resolve({ a: 'one', b: 'same' }),
      () => Promise.resolve({ a: 'two', b: 'same' }),
      ALWAYS,
      logger,
      { ignoredDifferences: ['a'] }
    )

    expect(logger.error).not.toHaveBeenCalled()
    expect(logger.info.mock.calls[0][0]).toMatchObject({
      totalDifferences: 1,
      ignoredDifferences: 1,
    })
  })

  it('reports nothing when the shadow side fails, and serves the selected result', async () => {
    const logger = makeLogger()
    const shadow = jest.fn().mockRejectedValue(new Error('upstream is down'))

    expect(
      await compareApiResults(
        () => Promise.resolve(selectedValue),
        shadow,
        ALWAYS,
        logger
      )
    ).toBe(selectedValue)

    expect(shadow).toHaveBeenCalledTimes(1)
    expect(logger.error).not.toHaveBeenCalled()
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('serves the shadow result when only the selected side fails', async () => {
    const logger = makeLogger()

    expect(
      await compareApiResults(
        () => Promise.reject(new Error('selected is down')),
        () => Promise.resolve(shadowValue),
        ALWAYS,
        logger
      )
    ).toBe(shadowValue)

    expect(logger.error).not.toHaveBeenCalled()
  })

  it('rethrows the selected error when both sides fail', async () => {
    const logger = makeLogger()
    const selectedError = new Error('selected is down')

    await expect(
      compareApiResults(
        () => Promise.reject(selectedError),
        () => Promise.reject(new Error('shadow is down')),
        ALWAYS,
        logger
      )
    ).rejects.toBe(selectedError)
  })

  it('survives an exception raised while comparing', async () => {
    const logger = makeLogger()
    const exploding = {}

    Object.defineProperty(exploding, 'boom', {
      enumerable: true,
      get() {
        throw new Error('cannot read this')
      },
    })

    expect(
      await compareApiResults(
        () => Promise.resolve(exploding),
        () => Promise.resolve({ boom: 'fine' }),
        ALWAYS,
        logger
      )
    ).toBe(exploding)

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error.mock.calls[0][0]).toMatchObject({
      message: 'API Comparison: Error during deep comparison',
    })
  })

  it('samples proportionally to the given percentage', async () => {
    const logger = makeLogger()
    const shadow = jest.fn().mockResolvedValue({ a: 1 })
    const random = jest.spyOn(Math, 'random')

    // 0.005 -> 0.5%, inside a 1% sample; 0.05 -> 5%, outside it.
    random.mockReturnValueOnce(0.005)
    await compareApiResults(() => Promise.resolve({ a: 1 }), shadow, 1, logger)
    expect(shadow).toHaveBeenCalledTimes(1)

    random.mockReturnValueOnce(0.05)
    await compareApiResults(() => Promise.resolve({ a: 1 }), shadow, 1, logger)
    expect(shadow).toHaveBeenCalledTimes(1)

    random.mockRestore()
  })
})
