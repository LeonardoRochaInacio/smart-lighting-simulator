import { HttpContext } from '@adonisjs/core/http'
import { LightingService } from '#app/services/lighting_service'
import { Commands } from '#app/types/lighting_types'

export default class SmartLightingSimulator
{
    private lightingService: LightingService

    constructor() 
    {
        this.lightingService = LightingService.getInstance()
    }

    /**
     * GET /concentrators
     * Retorna lista paginada de concentradores
     */
    public async getConcentrators({ request, response }: HttpContext)
    {
        try 
        {
            const offset = request.input('offset', 0)
            const limit = request.input('limit', 1000)
            
            const result = await this.lightingService.getConcentrators(
                parseInt(offset), 
                parseInt(limit)
            )
            
            return response.json(result)
        } 
        catch (error) 
        {
            return response.status(500).json({
                success: false,
                message: error.message || 'Erro interno do servidor'
            })
        }
    }

    /**
     * GET /concentrators/:id/details
     * Retorna detalhes de um concentrador específico
     */
    public async getConcentratorDetails({ params, response }: HttpContext)
    {
        try 
        {
            const concentratorId = parseInt(params.id)
            
            if (isNaN(concentratorId)) 
            {
                return response.status(400).json({
                    success: false,
                    message: 'ID do concentrador deve ser um número válido'
                })
            }
            
            const result = await this.lightingService.getConcentratorDetails(concentratorId)
            
            return response.json({
                success: true,
                data: result
            })
        } 
        catch (error) 
        {
            return response.status(404).json({
                success: false,
                message: error.message || 'Concentrador não encontrado'
            })
        }
    }

    /**
     * GET /concentrators/:id/relays
     * Retorna lista paginada de relés de um concentrador
     */
    public async getRelays({ params, request, response }: HttpContext)
    {
        try 
        {
            const concentratorId = parseInt(params.id)
            const offset = request.input('offset', 0)
            const limit = request.input('limit', 1000)
            
            if (isNaN(concentratorId)) 
            {
                return response.status(400).json({
                    success: false,
                    message: 'ID do concentrador deve ser um número válido'
                })
            }
            
            const result = await this.lightingService.getRelaysByConcentrator(
                concentratorId,
                parseInt(offset), 
                parseInt(limit)
            )
            
            return response.json(result)
        } 
        catch (error) 
        {
            return response.status(404).json({
                success: false,
                message: error.message || 'Concentrador não encontrado'
            })
        }
    }

    /**
     * GET /concentrators/:concentratorId/relays/:relayId/details
     * Retorna detalhes de um relé específico
     */
    public async getRelayDetails({ params, response }: HttpContext)
    {
        try 
        {
            const concentratorId = parseInt(params.concentratorId)
            const relayId = parseInt(params.relayId)
            
            if (isNaN(concentratorId) || isNaN(relayId)) 
            {
                return response.status(400).json({
                    success: false,
                    message: 'IDs do concentrador e relé devem ser números válidos'
                })
            }
            
            const result = await this.lightingService.getRelayDetails(concentratorId, relayId)
            
            return response.json({
                success: true,
                data: result
            })
        } 
        catch (error) 
        {
            return response.status(404).json({
                success: false,
                message: error.message || 'Relé não encontrado'
            })
        }
    }

    /**
     * POST /commands
     * Executa comandos nos relés através dos concentradores
     */
    public async executeCommand({ request, response }: HttpContext)
    {
        try 
        {
            const { command, concentratorId, relayId, parameters } = request.body()
            
            // Validar dados de entrada
            if (!command || !concentratorId || !relayId) 
            {
                return response.status(400).json({
                    success: false,
                    message: 'Comando, ID do concentrador e ID do relé são obrigatórios'
                })
            }
            
            // Verificar se o comando é válido
            const validCommands = [
                Commands.TURN_LIGHT_ON,
                Commands.TURN_LIGHT_OFF,
                Commands.ENABLE_DIMMER,
                Commands.DISABLE_DIMMER,
                Commands.PROGRAM_DIMMER_PERCENTAGE,
                Commands.DISABLE_LIGHT_SENSOR,
                Commands.ENABLE_LIGHT_TIME_PROGRAM,
                Commands.SETUP_LIGHT_TIME_PROGRAM
            ]
            let commandValid = false
            for (const validCommand of validCommands) 
            {
                if (validCommand === command) 
                {
                    commandValid = true
                    break
                }
            }
            if (!commandValid) 
            {
                return response.status(400).json({
                    success: false,
                    message: `Comando inválido. Comandos válidos: ${validCommands.join(', ')}`
                })
            }
            
            const result = await this.lightingService.executeCommand({
                command,
                concentratorId: parseInt(concentratorId),
                relayId: parseInt(relayId),
                parameters
            })
            
            return response.json(result)
        } 
        catch (error) 
        {
            return response.status(500).json({
                success: false,
                message: error.message || 'Erro interno do servidor'
            })
        }
    }

    /**
     * GET /status
     * Retorna informações gerais do sistema
     */
    public async getSystemStatus({ response }: HttpContext)
    {
        try 
        {
            await this.lightingService.initialize()
            
            return response.json({
                success: true,
                message: 'Sistema de simulação de iluminação inteligente operacional',
                timestamp: new Date().toISOString(),
                availableCommands: [
                    Commands.TURN_LIGHT_ON,
                    Commands.TURN_LIGHT_OFF,
                    Commands.ENABLE_DIMMER,
                    Commands.DISABLE_DIMMER,
                    Commands.PROGRAM_DIMMER_PERCENTAGE,
                    Commands.DISABLE_LIGHT_SENSOR,
                    Commands.ENABLE_LIGHT_TIME_PROGRAM,
                    Commands.SETUP_LIGHT_TIME_PROGRAM
                ]
            })
        } 
        catch (error) 
        {
            return response.status(500).json({
                success: false,
                message: error.message || 'Erro ao verificar status do sistema'
            })
        }
    }
}
