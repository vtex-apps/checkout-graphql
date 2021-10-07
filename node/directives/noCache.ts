
import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

export class NoCache extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async (root: any, args: any, ctx: Context, info: any) => {
      const {
        graphql: { cacheControl }
      } = ctx

      cacheControl.noCache = true
      cacheControl.noStore = true

      return resolve(root, args, ctx, info)
    }
  }
}
