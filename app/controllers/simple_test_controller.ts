import type { HttpContext } from '@adonisjs/core/http'
import MicroserviceControllerBase from './microservice_controller_base.js'

export default class SimpleTestController extends MicroserviceControllerBase {
  async exec(_ctx: HttpContext) {
    await this.sleep(5000)
    return 'Execução finalizada!'
  }
}
