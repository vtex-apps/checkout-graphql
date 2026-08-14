// Type-only usage, so TypeScript elides this import and the module is never
// loaded at runtime.
import { Logger } from '@vtex/api'

/**
 * Runs two implementations of the same operation in parallel on a sampled
 * percentage of calls and logs whether they agree. Ported from
 * `vtex.search-resolver` (`node/utils/compareResults.ts`), which uses it to
 * validate its own migration to the Intelligent Search API.
 *
 * Deleted together with the `searchGraphQL` provider once the migration is
 * complete — there is nothing left to compare against at that point.
 */

export interface ObjectDifference {
  path: string
  type:
    | 'missing_key'
    | 'extra_key'
    | 'different_value'
    | 'different_type'
    | 'null_mismatch'
    | 'array_length_mismatch'
  expected?: unknown
  actual?: unknown
}

export interface DeepComparisonResult {
  isEqual: boolean
  differences: ObjectDifference[]
}

/**
 * Fields whose arrays are matched by identity instead of by position. A plain
 * string targets a list of primitives (matched by value); the object form
 * targets a list of objects and names the property that identifies an element.
 */
export type ExistenceComparePattern = string | { path: string; key: string }

export interface FindDifferencesOptions {
  maxDepth?: number
  existenceCompareFields?: ExistenceComparePattern[]
}

/**
 * Expected differences to filter out. Path patterns support `[*]` (any array
 * index, numeric or named) and `*` (any chars except dots and brackets).
 * Omitting `type` ignores every difference type at the matched path.
 */
export type IgnoredDifference =
  | string
  | {
      path: string
      type?: ObjectDifference['type']
    }

const DEFAULT_MAX_DEPTH = 20
const MAX_LOGGED_DIFFERENCES = 10

/**
 * Turns a path pattern into a RegExp. Special chars are escaped first, then the
 * wildcard tokens are un-escaped: `[*]` matches `[0]` or `[name:foo]`, and `*`
 * matches any chars except dots and brackets.
 */
const patternToRegex = (pattern: string): RegExp => {
  let regex = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  regex = regex.replace(/\\\[\\\*\\\]/g, '(?:\\[\\d+\\]|\\[name:[^\\]]+\\])')
  regex = regex.replace(/\\\*/g, '[^.\\[\\]]*')

  return new RegExp(`^${regex}$`)
}

const matchesExistencePattern = (path: string, pattern: string): boolean => {
  // A bare field name matches the last segment at any depth.
  if (!pattern.includes('.') && !pattern.includes('[')) {
    const parts = path.split('.')
    const leaf = (parts[parts.length - 1] ?? '')
      .replace(/\[\d+\]/, '')
      .replace(/\[name:.*?\]/, '')

    return leaf === pattern
  }

  return patternToRegex(pattern).test(path)
}

const findMatchingExistencePattern = (
  path: string,
  patterns: ExistenceComparePattern[]
): { key: string | null } | null => {
  for (const pattern of patterns) {
    const patternPath = typeof pattern === 'string' ? pattern : pattern.path
    const key = typeof pattern === 'string' ? null : pattern.key

    if (matchesExistencePattern(path, patternPath)) {
      return { key }
    }
  }

  return null
}

const extractKey = (item: unknown, customKey: string | null): string | null => {
  if (!customKey) {
    return String(item)
  }

  if (typeof item !== 'object' || item === null) {
    return null
  }

  let value: unknown = item

  for (const segment of customKey.split('.')) {
    if (
      value &&
      typeof value === 'object' &&
      segment in (value as Record<string, unknown>)
    ) {
      value = (value as Record<string, unknown>)[segment]
    } else {
      return null
    }
  }

  return value != null ? String(value) : null
}

const indexByKey = (items: unknown[], customKey: string | null) => {
  const byKey = new Map<string, unknown>()
  const withoutKey: unknown[] = []

  for (const item of items) {
    const key = extractKey(item, customKey)

    if (key != null) {
      byKey.set(key, item)
    } else {
      withoutKey.push(item)
    }
  }

  return { byKey, withoutKey }
}

/**
 * Compares two arrays by element identity rather than position. Elements
 * missing from either side are still reported, so nothing is hidden — only the
 * ordering stops mattering.
 */
const compareArraysByExistence = (
  expected: unknown[],
  actual: unknown[],
  path: string,
  customKey: string | null,
  options: FindDifferencesOptions,
  depth: number
): ObjectDifference[] => {
  const differences: ObjectDifference[] = []
  const first = indexByKey(expected, customKey)
  const second = indexByKey(actual, customKey)

  // Elements with no extractable key fall back to positional comparison.
  const unkeyedLength = Math.max(
    first.withoutKey.length,
    second.withoutKey.length
  )

  for (let i = 0; i < unkeyedLength; i++) {
    const currentPath = path ? `${path}[${i}]` : `[${i}]`

    if (i >= first.withoutKey.length) {
      differences.push({
        path: currentPath,
        type: 'extra_key',
        actual: second.withoutKey[i],
      })
    } else if (i >= second.withoutKey.length) {
      differences.push({
        path: currentPath,
        type: 'missing_key',
        expected: first.withoutKey[i],
      })
    } else {
      differences.push(
        ...findDifferences(
          first.withoutKey[i],
          second.withoutKey[i],
          currentPath,
          options,
          depth + 1
        )
      )
    }
  }

  const pathFor = (key: string) =>
    path ? `${path}[name:${key}]` : `[name:${key}]`

  for (const [key, item] of second.byKey) {
    if (!first.byKey.has(key)) {
      differences.push({ path: pathFor(key), type: 'extra_key', actual: item })
    }
  }

  for (const [key, item] of first.byKey) {
    if (!second.byKey.has(key)) {
      differences.push({
        path: pathFor(key),
        type: 'missing_key',
        expected: item,
      })
    } else {
      differences.push(
        ...findDifferences(
          item,
          second.byKey.get(key),
          pathFor(key),
          options,
          depth + 1
        )
      )
    }
  }

  return differences
}

/**
 * Recursively collects the differences between two values. Types are named from
 * the second value's perspective: `extra_key` is present only in `actual`,
 * `missing_key` only in `expected`.
 */
export function findDifferences(
  expected: unknown,
  actual: unknown,
  path = '',
  options: FindDifferencesOptions = {},
  depth = 0
): ObjectDifference[] {
  const differences: ObjectDifference[] = []

  if (expected === actual) {
    return differences
  }

  if (expected == null || actual == null) {
    differences.push({ path, type: 'null_mismatch', expected, actual })

    return differences
  }

  if (typeof expected !== typeof actual) {
    differences.push({
      path,
      type: 'different_type',
      expected: typeof expected,
      actual: typeof actual,
    })

    return differences
  }

  if (typeof expected !== 'object' || typeof actual !== 'object') {
    differences.push({ path, type: 'different_value', expected, actual })

    return differences
  }

  if (depth > (options.maxDepth ?? DEFAULT_MAX_DEPTH)) {
    return differences
  }

  if (Array.isArray(expected) !== Array.isArray(actual)) {
    differences.push({
      path,
      type: 'different_type',
      expected: Array.isArray(expected) ? 'array' : 'object',
      actual: Array.isArray(actual) ? 'array' : 'object',
    })

    return differences
  }

  if (Array.isArray(expected) && Array.isArray(actual)) {
    const match = path
      ? findMatchingExistencePattern(path, options.existenceCompareFields ?? [])
      : null

    if (match) {
      return compareArraysByExistence(
        expected,
        actual,
        path,
        match.key,
        options,
        depth
      )
    }

    if (expected.length !== actual.length) {
      differences.push({
        path,
        type: 'array_length_mismatch',
        expected: expected.length,
        actual: actual.length,
      })
    }

    const maxLength = Math.max(expected.length, actual.length)

    for (let i = 0; i < maxLength; i++) {
      const currentPath = path ? `${path}[${i}]` : `[${i}]`

      if (i >= expected.length) {
        differences.push({
          path: currentPath,
          type: 'extra_key',
          actual: actual[i],
        })
      } else if (i >= actual.length) {
        differences.push({
          path: currentPath,
          type: 'missing_key',
          expected: expected[i],
        })
      } else {
        differences.push(
          ...findDifferences(
            expected[i],
            actual[i],
            currentPath,
            options,
            depth + 1
          )
        )
      }
    }

    return differences
  }

  const expectedObject = expected as Record<string, unknown>
  const actualObject = actual as Record<string, unknown>
  const allKeys = new Set([
    ...Object.keys(expectedObject),
    ...Object.keys(actualObject),
  ])

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key
    const inExpected = Object.prototype.hasOwnProperty.call(expectedObject, key)
    const inActual = Object.prototype.hasOwnProperty.call(actualObject, key)

    if (inExpected && !inActual) {
      differences.push({
        path: currentPath,
        type: 'missing_key',
        expected: expectedObject[key],
      })
    } else if (!inExpected && inActual) {
      differences.push({
        path: currentPath,
        type: 'extra_key',
        actual: actualObject[key],
      })
    } else {
      differences.push(
        ...findDifferences(
          expectedObject[key],
          actualObject[key],
          currentPath,
          options,
          depth + 1
        )
      )
    }
  }

  return differences
}

export const isDeepEqual = (
  expected: unknown,
  actual: unknown,
  options: FindDifferencesOptions = {}
): DeepComparisonResult => {
  const differences = findDifferences(expected, actual, '', {
    maxDepth: DEFAULT_MAX_DEPTH,
    ...options,
  })

  return { isEqual: differences.length === 0, differences }
}

export const shouldIgnoreDifference = (
  difference: ObjectDifference,
  pattern: IgnoredDifference
): boolean => {
  const path = typeof pattern === 'string' ? pattern : pattern.path
  const type = typeof pattern === 'string' ? undefined : pattern.type

  if (!patternToRegex(path).test(difference.path)) {
    return false
  }

  return type === undefined || difference.type === type
}

export const filterIgnoredDifferences = (
  differences: ObjectDifference[],
  ignoredDifferences: IgnoredDifference[] = []
): { filtered: ObjectDifference[]; ignored: ObjectDifference[] } => {
  if (ignoredDifferences.length === 0) {
    return { filtered: differences, ignored: [] }
  }

  const filtered: ObjectDifference[] = []
  const ignored: ObjectDifference[] = []

  for (const difference of differences) {
    if (
      ignoredDifferences.some(pattern =>
        shouldIgnoreDifference(difference, pattern)
      )
    ) {
      ignored.push(difference)
    } else {
      filtered.push(difference)
    }
  }

  return { filtered, ignored }
}

export interface CompareApiResultsOptions {
  args?: unknown
  logPrefix?: string
  ignoredDifferences?: IgnoredDifference[]
  existenceCompareFields?: ExistenceComparePattern[]
}

interface CapturedError {
  __error: unknown
}

const isCapturedError = (value: unknown): value is CapturedError =>
  typeof value === 'object' && value !== null && '__error' in value

/**
 * Runs `selected` and, on a sampled percentage of calls, `shadow` in parallel,
 * logging whether the two results agree. Never lets the comparison change what
 * the caller receives: the returned value is always `selected`'s, unless it
 * failed and `shadow` did not.
 *
 * @param sample percentage of calls that run both sides, 0-100
 */
export async function compareApiResults<T>(
  selected: () => Promise<T>,
  shadow: () => Promise<T>,
  sample: number,
  logger: Logger,
  options: CompareApiResultsOptions = {}
): Promise<T> {
  const {
    logPrefix = 'API Comparison',
    ignoredDifferences = [],
    existenceCompareFields,
  } = options

  if (!(Math.random() * 100 < sample)) {
    return selected()
  }

  const [selectedResult, shadowResult] = await Promise.all([
    selected().catch((error: unknown) => ({ __error: error })),
    shadow().catch((error: unknown) => ({ __error: error })),
  ])

  const selectedFailed = isCapturedError(selectedResult)
  const shadowFailed = isCapturedError(shadowResult)

  if (!selectedFailed && !shadowFailed) {
    try {
      const { differences } = isDeepEqual(selectedResult, shadowResult, {
        existenceCompareFields,
      })

      const { filtered, ignored } = filterIgnoredDifferences(
        differences,
        ignoredDifferences
      )

      if (filtered.length > 0) {
        logger.error({
          message: `${logPrefix}: Results differ`,
          params: JSON.stringify(options.args),
          differences: filtered.slice(0, MAX_LOGGED_DIFFERENCES),
          differenceCount: filtered.length,
          totalDifferences: differences.length,
          ignoredDifferences: ignored.length,
        })
      } else {
        // Logged at info level on purpose: the log level is indexed, so the
        // agreement rate is derivable without a dedicated metric.
        logger.info({
          message: `${logPrefix}: Results are equal`,
          params: JSON.stringify(options.args),
          totalDifferences: differences.length,
          ignoredDifferences: ignored.length,
        })
      }
    } catch (error) {
      logger.error({
        message: `${logPrefix}: Error during deep comparison`,
        error,
      })
    }
  }

  if (!selectedFailed) {
    return selectedResult as T
  }

  if (!shadowFailed) {
    return shadowResult as T
  }

  throw (selectedResult as CapturedError).__error
}
