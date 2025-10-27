/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const SimpleTestController = () => import('#controllers/simple_test_controller')
import { middleware } from '#start/kernel'

router.post('/report/register', [SimpleTestController, 'register']).as('report.register')

router
  .get('/report/process', [SimpleTestController, 'process'])
  .as('report.process')
  .use([middleware.microservice_process_check()])
