import { HttpContext } from '@adonisjs/core/http'

export default class TestController
{
    public async test({ response }: HttpContext)
    {
        return response.json({
            success: true,
            message: 'Servidor funcionando!',
            timestamp: new Date().toISOString()
        })
    }
}