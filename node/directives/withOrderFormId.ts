import { defaultFieldResolver, GraphQLField } from 'graphql'
import { SchemaDirectiveVisitor } from 'graphql-tools'

import { getLocaleFromCookie, getOrderFormIdFromCookie } from '../utils'
import { VTEX_RC_SESSION_COOKIE, VTEX_RC_MAC_COOKIE } from '../constants'

export class WithOrderFormId extends SchemaDirectiveVisitor {
  public visitFieldDefinition(field: GraphQLField<any, any>) {
    const { resolve = defaultFieldResolver } = field
    field.resolve = async (root: any, args: any, ctx: Context, info: any) => {
      const checkoutOrderFormId = getOrderFormIdFromCookie(ctx.cookies)
      ctx.vtex.orderFormId = checkoutOrderFormId
      // Checkout issues `CheckoutLocale` together with the orderForm cookie, so
      // it rides along here: every field that talks to Checkout carries this
      // directive, which is not true of `@withSegment`.
      ctx.vtex.checkoutLocale = getLocaleFromCookie(ctx.cookies)
      ctx.vtex.vtexRCSessionIdv7 =
        ctx.cookies.get(VTEX_RC_SESSION_COOKIE) ??
        ctx.get(VTEX_RC_SESSION_COOKIE)
      ctx.vtex.vtexRCMacIdv7 =
        ctx.cookies.get(VTEX_RC_MAC_COOKIE) ?? ctx.get(VTEX_RC_MAC_COOKIE)
      return resolve(root, args, ctx, info)
    }
  }
}
