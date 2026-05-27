/**
 * Manual Jest mock for `@vtex/api`.
 *
 * Why we need it:
 *
 * The published `@opentelemetry/exporter-logs-otlp-http` package (a transitive
 * dependency of `@vtex/api`) uses Node 16+ "exports" subpaths that the
 * Jest 24 / Node 12 resolver shipped with `@vtex/test-tools@3.1.0` cannot
 * understand. When a test runtime-loads `@vtex/api` (e.g. by importing a
 * resolver that ultimately requires `utils/index.ts`) the test runner blows
 * up trying to resolve `@opentelemetry/otlp-exporter-base/node-http`.
 *
 * Tests that go through the codebase only via type-only imports (which the
 * TypeScript compiler erases) never trigger the real `@vtex/api` module load
 * and keep working. As soon as a test needs runtime access to the resolver
 * layer it must opt-in by calling `jest.mock('@vtex/api')`, which causes
 * Jest to use this file instead of the real package.
 *
 * The stubs below provide just enough surface for class declarations
 * (`extends X`) and module-level imports to succeed. Tests never instantiate
 * these classes directly — production code reaches the network through the
 * mocked `Clients` factory in `__fixtures__/clients.ts`.
 */

class StubBase {}

export class IOClients extends StubBase {}
export class JanusClient extends StubBase {}
export class AppClient extends StubBase {}
export class GraphQLClient extends StubBase {}
export class Logger {}

export class AuthenticationError extends Error {
  public constructor(_e?: unknown) {
    super('AuthenticationError')
  }
}

export class ForbiddenError extends Error {
  public constructor(_e?: unknown) {
    super('ForbiddenError')
  }
}

export class UserInputError extends Error {
  public constructor(_e?: unknown) {
    super('UserInputError')
  }
}

// Used only by node/index.ts at module-scope (cache + service bootstrap). They
// are not exercised in tests but keeping the symbols present avoids surprises
// if a future test imports node/index.ts.
export class Service {
  public constructor(_opts?: unknown) {}
}

export class LRUCache<K = string, V = unknown> {
  public constructor(public opts?: unknown) {}
  public get(_key: K): V | undefined {
    return undefined
  }

  public set(_key: K, _value: V): void {}
}

export const RecorderState = {}
