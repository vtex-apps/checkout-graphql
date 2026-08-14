/**
 * Reusable factory for a mocked `Context` (Koa + VTEX IO) used in resolver
 * and utility tests. The shape is intentionally loose: production code only
 * touches a small subset of `Context`, and TypeScript-strict typing would
 * pull most of `@vtex/api` into the test surface for no real benefit.
 *
 * Tests get back a strongly typed `ContextMock` (full jest mock access) and
 * can pass `toContext(ctx)` when the production signature demands `Context`.
 */

import { ClientsMock, makeClientsMock } from './clients'

export interface CookieJarMock {
  get: jest.Mock<string | undefined, [string]>
  set: jest.Mock<void, [string, string, object?]>
  secure: boolean
}

export interface LoggerMock {
  warn: jest.Mock
  error: jest.Mock
  info: jest.Mock
}

export interface VtexMock {
  logger: LoggerMock
  segment?: { cultureInfo: string; channel?: string }
  locale?: string
  tenant?: { locale: string }
  orderFormId?: string
  ownerId?: string
  vtexRCSessionIdv7?: string
  vtexRCMacIdv7?: string
  platform?: string
}

export interface ContextMock {
  clients: ClientsMock
  vtex: VtexMock
  cookies: CookieJarMock
  get: jest.Mock<string | undefined, [string]>
}

export interface ContextOverrides {
  clients?: ClientsMock
  cookies?: Record<string, string>
  headers?: Record<string, string>
  vtex?: Partial<VtexMock>
}

const makeCookieJar = (
  initialCookies: Record<string, string> = {}
): CookieJarMock => {
  const store = new Map<string, string>(Object.entries(initialCookies))

  return {
    get: jest.fn(((name: string) => store.get(name)) as any),
    set: jest.fn(((name: string, value: string) => {
      store.set(name, value)
    }) as any),
    secure: false,
  }
}

/**
 * Build a `ContextMock` with sensible defaults. Override per test only what
 * matters for the case under exam.
 */
export const makeContext = (overrides: ContextOverrides = {}): ContextMock => {
  const headers = overrides.headers ?? {}

  return {
    clients: overrides.clients ?? makeClientsMock(),
    vtex: {
      logger: {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
      },
      segment: { cultureInfo: 'pt-BR' },
      platform: 'vtex',
      ...overrides.vtex,
    },
    cookies: makeCookieJar(overrides.cookies),
    get: jest.fn(((name: string) => headers[name]) as any),
  }
}

/**
 * Casts the mock to the real `Context` type. Use only at the boundary when
 * handing the mock to production code.
 */
export const toContext = (mock: ContextMock): Context =>
  (mock as unknown) as Context
