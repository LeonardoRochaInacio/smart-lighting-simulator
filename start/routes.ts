/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { InMemoryDataService } from '#services/in_memory_data_service'

// Rota de teste simples
router.get('/test', async ({ response }) => {
    return response.json({
        success: true,
        message: 'Servidor funcionando!',
        timestamp: new Date().toISOString()
    })
}) 

// Implementação completa dos endpoints solicitados

// Status do sistema  
router.get('/status', async ({ response }) => {
    return response.json({
        success: true,
        message: 'Sistema de simulação de iluminação inteligente operacional',
        timestamp: new Date().toISOString(),
        totalConcentrators: 12,
        totalRelays: 1681,
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
            'turn_light_on', 'turn_light_off', 'enable_dimmer',
            'disable_dimmer', 'program_dimmer_percentage', 'disable_light_sensor',
            'enable_light_time_program', 'setup_light_time_program'
        ]
    })
})

// Helper para obter instância do serviço de dados
function getDataService(): InMemoryDataService {
    return InMemoryDataService.getInstance()
}

// GET /concentrators - Lista concentradores (paginado)
router.get('/concentrators', async ({ request, response }) => {
    try {
        const offset = parseInt(request.input('offset', '0'))
        const limit = parseInt(request.input('limit', '1000'))
        
        const dataService = getDataService()
        const result = dataService.getAllConcentrators(offset, limit)
        
        return response.json({
            data: result.data,
            total: result.total,
            offset,
            limit,
            success: true,
            elapsedTime: `${(Math.random() * 50 + 10).toFixed(4)}ms`,
            totalRetornado: result.data.length
        })
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// GET /concentrators/:id/details - Detalhes do concentrador
router.get('/concentrators/:id/details', async ({ params, response }) => {
    try {
        const concentratorId = parseInt(params.id)
        const dataService = getDataService()
        
        const concentrator = dataService.getConcentratorDetails(concentratorId)
        
        if (!concentrator) {
            return response.status(404).json({
                success: false,
                message: `Concentrador ${concentratorId} não encontrado`
            })
        }
        
        return response.json(concentrator)
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// GET /concentrators/:id/relays - Lista relés do concentrador (paginado)  
router.get('/concentrators/:id/relays', async ({ params, request, response }) => {
    try {
        const concentratorId = parseInt(params.id)
        const offset = parseInt(request.input('offset', '0'))
        const limit = parseInt(request.input('limit', '1000'))
        
        const dataService = getDataService()
        const result = dataService.getConcentratorRelays(concentratorId, offset, limit)
        
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
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// GET /concentrators/:concentratorId/relays/:relayId/details - Detalhes do relé
router.get('/concentrators/:concentratorId/relays/:relayId/details', async ({ params, response }) => {
    try {
        const concentratorId = parseInt(params.concentratorId)
        const relayId = parseInt(params.relayId)
        
        const dataService = getDataService()
        const relay = dataService.getRelayDetails(concentratorId, relayId)
        
        if (!relay) {
            return response.status(404).json({
                success: false,
                message: `Relé ${relayId} não encontrado no concentrador ${concentratorId}`
            })
        }
        
        return response.json(relay)
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// POST /commands - Executa comando no relé
router.post('/commands', async ({ request, response }) => {
    try {
        const { command, concentratorId, relayId, parameters } = request.only(['command', 'concentratorId', 'relayId', 'parameters'])
        
        if (!command || !concentratorId || !relayId) {
            return response.status(400).json({
                success: false,
                message: 'Campos obrigatórios: command, concentratorId, relayId'
            })
        }
        
        const validCommands = [
            'turn_light_on', 'turn_light_off', 'enable_dimmer', 
            'disable_dimmer', 'program_dimmer_percentage', 'disable_light_sensor',
            'enable_light_time_program', 'setup_light_time_program'
        ]
        
        if (!validCommands.includes(command)) {
            return response.status(400).json({
                success: false,
                message: `Comando inválido. Comandos válidos: ${validCommands.join(', ')}`
            })
        }
        
        // Executar comando através do serviço de dados
        const dataService = getDataService()
        const success = dataService.executeCommand(parseInt(concentratorId), parseInt(relayId), command, parameters)
        
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
            case 'turn_light_on':
                resultMessage += '. Luminária foi ligada.'
                break
            case 'turn_light_off':
                resultMessage += '. Luminária foi desligada.'
                break
            case 'program_dimmer_percentage':
                if (parameters?.percentage) {
                    resultMessage += `. Dimmer programado para ${parameters.percentage}%.`
                }
                break
            case 'setup_light_time_program':
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
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        })
    }
})

// Aliases para compatibilidade com o agregador
router.get('/get_concentrators', async ({ request, response }) => {
    try {
        const offset = parseInt(request.input('offset', '0'))
        const limit = parseInt(request.input('limit', '1000'))
        
        const dataService = getDataService()
        const result = dataService.getAllConcentrators(offset, limit)
        
        return response.json({
            data: result.data,
            total: result.total,
            offset,
            limit,
            success: true,
            elapsedTime: `${(Math.random() * 50 + 10).toFixed(4)}ms`,
            totalRetornado: result.data.length
        })
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        })
    }
})

router.get('/get_concentrator_details/:id', async ({ params, response }) => {
    try {
        const concentratorId = parseInt(params.id)
        const dataService = getDataService()
        
        const concentrator = dataService.getConcentratorDetails(concentratorId)
        
        if (!concentrator) {
            return response.status(404).json({
                success: false,
                message: `Concentrador ${concentratorId} não encontrado`
            })
        }
        
        return response.json(concentrator)
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        })
    }
})

router.get('/get_relays/:id', async ({ params, request, response }) => {
    try {
        const concentratorId = parseInt(params.id)
        const offset = parseInt(request.input('offset', '0'))
        const limit = parseInt(request.input('limit', '1000'))
        
        const dataService = getDataService()
        const result = dataService.getConcentratorRelays(concentratorId, offset, limit)
        
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
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        })
    }
})

router.get('/get_relay_details/:concentratorId/:relayId', async ({ params, response }) => {
    try {
        const concentratorId = parseInt(params.concentratorId)
        const relayId = parseInt(params.relayId)
        
        const dataService = getDataService()
        const relay = dataService.getRelayDetails(concentratorId, relayId)
        
        if (!relay) {
            return response.status(404).json({
                success: false,
                message: `Relé ${relayId} não encontrado no concentrador ${concentratorId}`
            })
        }
        
        return response.json(relay)
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        })
    }
})

router.post('/execute_command', async ({ request, response }) => {
    try {
        const { command, concentratorId, relayId, parameters } = request.only(['command', 'concentratorId', 'relayId', 'parameters'])
        
        if (!command || !concentratorId || !relayId) {
            return response.status(400).json({
                success: false,
                message: 'Campos obrigatórios: command, concentratorId, relayId'
            })
        }
        
        const validCommands = [
            'turn_light_on', 'turn_light_off', 'enable_dimmer', 
            'disable_dimmer', 'program_dimmer_percentage', 'disable_light_sensor',
            'enable_light_time_program', 'setup_light_time_program'
        ]
        
        if (!validCommands.includes(command)) {
            return response.status(400).json({
                success: false,
                message: `Comando inválido. Comandos válidos: ${validCommands.join(', ')}`
            })
        }
        
        const dataService = getDataService()
        const success = dataService.executeCommand(parseInt(concentratorId), parseInt(relayId), command, parameters)
        
        if (!success) {
            return response.status(404).json({
                success: false,
                message: `Relé ${relayId} não encontrado no concentrador ${concentratorId}`
            })
        }
        
        let resultMessage = `Comando '${command}' executado com sucesso no relé ${relayId} através do concentrador ${concentratorId}`
        
        switch (command) {
            case 'turn_light_on':
                resultMessage += '. Luminária foi ligada.'
                break
            case 'turn_light_off':
                resultMessage += '. Luminária foi desligada.'
                break
            case 'program_dimmer_percentage':
                if (parameters?.percentage) {
                    resultMessage += `. Dimmer programado para ${parameters.percentage}%.`
                }
                break
            case 'setup_light_time_program':
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
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: error.message
        })
    }
})