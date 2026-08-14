import { LRUCache, Service, RecorderState } from '@vtex/api'

import { Clients } from './clients'
import { schemaDirectives } from './directives'
import { resolvers } from './resolvers'

const THREE_SECONDS_MS = 3 * 1000
const TEN_SECONDS_MS = 10 * 1000

// Segments are small and immutable.
const MAX_SEGMENT_CACHE = 10000
const segmentCache = new LRUCache<string, any>({ max: MAX_SEGMENT_CACHE })
metrics.trackCache('segment', segmentCache)

const searchGraphQLCache = new LRUCache<string, any>({ max: 5000 })
metrics.trackCache('searchGraphQL', searchGraphQLCache)

const intschCache = new LRUCache<string, any>({ max: 5000 })
metrics.trackCache('intsch', intschCache)

export default new Service<Clients, RecorderState, CustomContext>({
  clients: {
    implementation: Clients,
    options: {
      checkout: {
        timeout: TEN_SECONDS_MS,
      },
      default: {
        retries: 2,
        timeout: THREE_SECONDS_MS,
      },
      searchGraphQL: {
        memoryCache: searchGraphQLCache,
        timeout: THREE_SECONDS_MS,
      },
      /**
       * One request per distinct product in the cart, so a retry would multiply
       * an already fanned-out call. Concurrency is capped for the same reason.
       */
      intsch: {
        concurrency: 10,
        memoryCache: intschCache,
        retries: 0,
        timeout: THREE_SECONDS_MS,
      },
      segment: {
        memoryCache: segmentCache,
        timeout: THREE_SECONDS_MS,
      },
      countryDataSettings: {
        timeout: THREE_SECONDS_MS,
      },
    },
  },
  graphql: {
    resolvers,
    schemaDirectives,
  },
})
