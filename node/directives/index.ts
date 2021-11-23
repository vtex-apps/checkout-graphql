import { AuthorizationMetrics } from './authorization'
import { WithSegment } from './withSegment'
import { WithOrderFormId } from './withOrderFormId'
import { NoCache } from './noCache'

export const schemaDirectives = {
  withAuthMetrics: AuthorizationMetrics,
  withSegment: WithSegment,
  withOrderFormId: WithOrderFormId,
  noCache: NoCache,
}
