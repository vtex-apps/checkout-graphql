import { AuthorizationMetrics } from './authorization'
import { WithSegment } from './withSegment'
import { WithOrderFormId } from './withOrderFormId'
import { NoCache } from './noCache'
import { WithOwnerId } from './withOwnerId'

export const schemaDirectives = {
  withAuthMetrics: AuthorizationMetrics,
  withSegment: WithSegment,
  withOrderFormId: WithOrderFormId,
  withOwnerId: WithOwnerId,
  noCache: NoCache,
}
