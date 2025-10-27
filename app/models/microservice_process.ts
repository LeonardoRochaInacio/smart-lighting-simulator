import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { MicroserviceStatus } from '../../contracts/enums/microservice_status.js'

export default class MicroserviceProcess extends BaseModel {
  static get table() {
    return 'microservice_process'
  }

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare description: string

  @column()
  declare type: string

  @column()
  declare requested_by_url: string

  @column()
  declare responded_by_url: string

  @column()
  declare must_respond_to: string

  @column()
  declare status: MicroserviceStatus

  @column()
  declare requested_by_user_id: number

  @column.dateTime()
  declare finished_at: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
