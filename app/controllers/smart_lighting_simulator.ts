import { HttpContext } from '@adonisjs/core/http'
import { InMemoryDataService } from '#services/in_memory_data_service'
import { Commands } from '../types/lighting_types.js'

export default class SmartLightingSimulator
{
    private dataService: InMemoryDataService

    constructor() 
    {
        this.dataService = InMemoryDataService.getInstance()
    }

    /**
     * GET /concentrators
     * Retorna lista paginada de concentradores
     */
    public async getConcentrators({ request, response }: HttpContext)
    {
        try 
        {
            const offset = parseInt(request.input('offset', '0'))
            const limit = parseInt(request.input('limit', '1000'))
            
            const result = this.dataService.getAllConcentrators(offset, limit)
            
            return response.json({
                data: result.data,
                total: result.total,
                offset,
                limit,
                success: true,
                elapsedTime: `${(Math.random() * 50 + 10).toFixed(4)}ms`,
                totalRetornado: result.data.length
            })
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
            
            const concentrator = this.dataService.getConcentratorDetails(concentratorId)
            
            if (!concentrator) {
                return response.status(404).json({
                    success: false,
                    message: `Concentrador ${concentratorId} não encontrado`
                })
            }
            
            return response.json({
                data: concentrator,
                success: true
            })
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
     * GET /concentrators/:id/relays
     * Retorna lista paginada de relés de um concentrador
     */
    public async getRelays({ params, request, response }: HttpContext)
    {
        try 
        {
            const concentratorId = parseInt(params.id)
            const offset = parseInt(request.input('offset', '0'))
            const limit = parseInt(request.input('limit', '1000'))
            
            if (isNaN(concentratorId)) 
            {
                return response.status(400).json({
                    success: false,
                    message: 'ID do concentrador deve ser um número válido'
                })
            }
            
            const result = this.dataService.getConcentratorRelays(concentratorId, offset, limit)
            
            if (!result) {
                return response.status(404).json({
                    success: false,
                    message: `Concentrador ${concentratorId} não encontrado`
                })
            }
            
            return response.json({
                data: result.data,
                total: result.total,
                offset,
                limit,
                success: true,
                elapsedTime: `${(Math.random() * 100 + 20).toFixed(4)}ms`,
                totalRetornado: result.data.length
            })
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
            
            const relay = this.dataService.getRelayDetails(concentratorId, relayId)
            if (!relay) {
                return response.status(404).json({
                    success: false,
                    message: `Relé ${relayId} não encontrado no concentrador ${concentratorId}`
                })
            }
            
            console.log(relay)
            return response.json({
                data: relay,
                success: true
            })
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
            
            const success = this.dataService.executeCommand(
                parseInt(concentratorId), 
                parseInt(relayId), 
                command, 
                parameters
            )
            
            if (!success) {
                return response.status(404).json({
                    success: false,
                    message: `Relé ${relayId} não encontrado no concentrador ${concentratorId}`
                })
            }
            
            // Gerar mensagem de sucesso
            let resultMessage = `Comando '${command}' executado com sucesso no relé ${relayId} através do concentrador ${concentratorId}`
            
            // Adicionar informações específicas do comando
            switch (command) {
                case Commands.TURN_LIGHT_ON:
                    resultMessage += '. Luminária foi ligada.'
                    break
                case Commands.TURN_LIGHT_OFF:
                    resultMessage += '. Luminária foi desligada.'
                    break
                case Commands.PROGRAM_DIMMER_PERCENTAGE:
                    if (parameters?.percentage) {
                        resultMessage += `. Dimmer programado para ${parameters.percentage}%.`
                    }
                    break
                case Commands.SETUP_LIGHT_TIME_PROGRAM:
                    if (parameters?.onTime && parameters?.offTime) {
                        resultMessage += `. Programação horária configurada: Liga ${parameters.onTime}, Desliga ${parameters.offTime}.`
                    }
                    break
            }
            
            return response.json({
                success: true,
                message: resultMessage,
                timestamp: new Date().toISOString(),
                commandDetails: {
                    command,
                    concentratorId: parseInt(concentratorId),
                    relayId: parseInt(relayId),
                    parameters: parameters || {}
                }
            })
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
            // Obter dados do sistema através do dataService
            const allConcentrators = this.dataService.getAllConcentrators(0, 999999)
            const totalRelays = allConcentrators.data.reduce((total, concentrator) => {
                const concentratorDetails = this.dataService.getConcentratorDetails(parseInt(concentrator.id))
                return total + (concentratorDetails?.totalRelays || 0)
            }, 0)
            
            return response.json({
                success: true,
                message: 'Sistema de simulação de iluminação inteligente operacional',
                timestamp: new Date().toISOString(),
                totalConcentrators: allConcentrators.total,
                totalRelays: totalRelays,
                availableEndpoints: {
                    concentrators: [
                        'GET /concentrators - Lista concentradores',
                        'GET /concentrators/:id/details - Detalhes do concentrador',
                        'GET /get_concentrators - Alias para compatibilidade',
                        'GET /get_concentrator_details/:id - Alias para compatibilidade'
                    ],
                    relays: [
                        'GET /concentrators/:id/relays - Lista relés do concentrador',
                        'GET /concentrators/:concentratorId/relays/:relayId/details - Detalhes do relé',
                        'GET /get_relays/:id - Alias para compatibilidade', 
                        'GET /get_relay_details/:concentratorId/:relayId - Alias para compatibilidade'
                    ],
                    commands: [
                        'POST /commands - Executa comando no relé',
                        'POST /execute_command - Alias para compatibilidade'
                    ]
                },
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
