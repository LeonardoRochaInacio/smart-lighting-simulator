import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'

export default class RequestLoggerMiddleware 
{
    async handle(ctx: HttpContext, next: NextFn) 
    {
        const url= ctx.request.url()
        logger.info('[INCOMING REQUEST] For route: ' + url)
        await next()
    }
}