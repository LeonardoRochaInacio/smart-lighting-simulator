import MicroserviceProcess from '#models/microservice_process'
import type { HttpContext } from '@adonisjs/core/http'
import { MicroserviceStatus } from '../../contracts/enums/microservice_status.js'
import axios from 'axios'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

export default abstract class MicroserviceControllerBase {
  async register(ctx: HttpContext) {
    logger.info('Registering a new microservice process...')
    const requestData = ctx.request.all()
    const newMicroservice = await MicroserviceProcess.create({
      description: requestData.process?.description,
      type: requestData.process?.type,
      requested_by_url: requestData.process?.requested_by_url,
      responded_by_url: requestData.process?.responded_by_url,
      must_respond_to: requestData.process?.must_respond_to,
      status: requestData.process?.status,
      requested_by_user_id: requestData.process?.requested_by_user_id,
      finished_at: null,
    })

    // eslint-disable-next-line prettier/prettier
    logger.info('[' + newMicroservice.id + ']' + ' The new microservice process was registered as #' + newMicroservice.id)

    ctx.request.all().process.id = newMicroservice.id

    if (requestData.process?.auto_execute) {
      this.process(ctx)
    }

    return newMicroservice
  }

  private async preProcess(process: any) {
    const ms = await MicroserviceProcess.find(process.id)

    if (!ms) return
    const oldStatus = ms.status
    ms.status = MicroserviceStatus.processing
    await ms.save()

    // eslint-disable-next-line prettier/prettier
    logger.info('[' + ms.id + ']' + ' The microservice process was marked as "processing"')

    try {
      await axios.post(
        process.must_respond_to,
        { process: process, new_status: ms.status, old_status: oldStatus },
        {
          // eslint-disable-next-line prettier/prettier
          headers: { 'Authorization': this.getMicroserviceAPI() },
        }
      )
      // eslint-disable-next-line prettier/prettier
      logger.info('[' + ms.id + ']' + ' The microservice responded to the requester after preProcess method')
    } catch (err) {
      ms.status = MicroserviceStatus.error
      await ms.save()
      // eslint-disable-next-line prettier/prettier
      logger.info('[' + ms.id + ']' + ' The microservice process was marked as "error"')
    }
  }

  private async postProcess(process: any) {
    const ms = await MicroserviceProcess.find(process.id)

    if (!ms) return
    const oldStatus = ms.status
    ms.status = MicroserviceStatus.success
    await ms.save()
    // eslint-disable-next-line prettier/prettier
    logger.info('[' + ms.id + ']' + ' The microservice process was marked as "success"')

    try {
      await axios.post(
        process.must_respond_to,
        { process: process, new_status: ms.status, old_status: oldStatus },
        {
          // eslint-disable-next-line prettier/prettier
          headers: { 'Authorization': this.getMicroserviceAPI() },
        }
      )
      // eslint-disable-next-line prettier/prettier
      logger.info('[' + ms.id + ']' + ' The microservice responded to the requester after postProcess method')
    } catch (err) {
      ms.status = MicroserviceStatus.error
      await ms.save()
      // eslint-disable-next-line prettier/prettier
      logger.info('[' + ms.id + ']' + ' The microservice process was marked as "error"')
    }
  }

  async process(ctx: HttpContext) {
    const requestData = ctx.request.all()
    if (requestData.process?.auto_execute) await this.sleep(5000)
    await this.preProcess(requestData.process)
    const internalProcess = await this.internalProcess(ctx)
    await this.postProcess(requestData.process)
    return internalProcess
  }

  private async internalProcess(ctx: HttpContext) {
    const requestData = ctx.request.all()
    const ms = await MicroserviceProcess.find(requestData.process?.id)
    if (!ms) {
      logger.error('MicroserviceProcess id is unkown')
      return
    }

    try {
      return this.exec(ctx)
    } catch (error) {
      ms.status = MicroserviceStatus.error
      await ms.save()
      // eslint-disable-next-line prettier/prettier
      logger.info('[' + ms.id + ']' + ' The microservice process was marked as "error" during exec')
      logger.error(error)
    }
  }

  private getMicroserviceAPI() {
    return 'Basic ' + env.get('MICROSERVICE_API_CONNECTION_KEY')
  }

  protected async sleep(time: number | undefined) {
    return new Promise((resolve) => setTimeout(resolve, time))
  }

  abstract exec(_ctx: HttpContext): any
}
