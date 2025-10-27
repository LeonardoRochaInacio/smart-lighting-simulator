import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

export default class ApiTokenCheckMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authorizationHeader = ctx.request.header('Authorization')
    const token = authorizationHeader ? authorizationHeader.replace('Basic ', '') : ''
    if (token !== env.get('MICROSERVICE_API_CONNECTION_KEY')) {
      return ctx.response.status(401).send('Unauthorized')
    }
    const output = await next()
    return output
  }
}
