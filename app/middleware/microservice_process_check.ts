import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'
import MicroserviceProcess from '#models/microservice_process'

export default class MicroserviceProcessCheck {
  async handle(ctx: HttpContext, next: NextFn) {
    const payload = ctx.request.all()
    const processId = payload.process?.id

    if (!processId) {
      return ctx.response.badRequest({ message: 'Process ID need to be informed!' })
    }

    const microServiceFromDatabase = await MicroserviceProcess.find(processId)

    if (!microServiceFromDatabase) {
      return ctx.response.badRequest({ message: 'Microservice process not found!' })
    }

    const output = await next()
    return output
  }
}
