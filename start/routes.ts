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

// Função auxiliar para carregar dados
async function loadData() {
    const fs = await import('fs')
    const path = await import('path')
    const dataPath = path.join(process.cwd(), 'assets', 'generated_data.json')
    
    if (!fs.existsSync(dataPath)) {
        throw new Error('Dados não encontrados. Execute: node scripts/generate_data.cjs')
    }
    
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
}

// Função para gerar status aleatório de concentrador
function getRandomConcentratorStatus(): string {
    const statuses = ['0001', '0010', '0011', '0101', '0110', '0111']
    const weights = [0.05, 0.05, 0.4, 0.4, 0.05, 0.05] // Maior probabilidade para online
    
    const random = Math.random()
    let cumulative = 0
    
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i]
        if (random <= cumulative) {
            return statuses[i]
        }
    }
    
    return '0011' // Online com internet do Chip (padrão)
}

// Função para gerar status aleatório de relé baseado no horário
function getRandomRelayStatus(): string {
    const now = new Date()
    const isNight = now.getHours() >= 18 || now.getHours() <= 6
    
    if (isNight) {
        // À noite, maior probabilidade de estar ligado
        const nightStatuses = ['0101', '0110', '0001', '0010', '0011', '0100', '0111', '1000', '1001', '1010', '1011']
        const nightWeights = [0.6, 0.15, 0.05, 0.1, 0.02, 0.02, 0.03, 0.01, 0.01, 0.005, 0.005]
        
        const random = Math.random()
        let cumulative = 0
        
        for (let i = 0; i < nightWeights.length; i++) {
            cumulative += nightWeights[i]
            if (random <= cumulative) {
                return nightStatuses[i]
            }
        }
    } else {
        // Durante o dia, maior probabilidade de estar desligado
        const dayStatuses = ['0110', '0101', '0010', '0001', '0011', '0100', '0111', '1000', '1001', '1010', '1011']
        const dayWeights = [0.6, 0.1, 0.05, 0.1, 0.02, 0.02, 0.03, 0.01, 0.01, 0.005, 0.005]
        
        const random = Math.random()
        let cumulative = 0
        
        for (let i = 0; i < dayWeights.length; i++) {
            cumulative += dayWeights[i]
            if (random <= cumulative) {
                return dayStatuses[i]
            }
        }
    }
    
    return isNight ? '0101' : '0110' // Padrão
}

// GET /concentrators - Lista concentradores (paginado)
router.get('/concentrators', async ({ request, response }) => {
    try {
        const offset = parseInt(request.input('offset', '0'))
        const limit = parseInt(request.input('limit', '1000'))
        
        const data = await loadData()
        const allConcentrators = data.concentrators.map((conc: any, index: number) => ({
            id: conc.id.toString(),
            label: `Concentrador_${index + 1}`,
            lat: conc.point.latitude.toFixed(5),
            lng: conc.point.longitude.toFixed(5),
            status: getRandomConcentratorStatus()
        }))
        
        const total = allConcentrators.length
        const paginatedData = allConcentrators.slice(offset, offset + limit)
        
        return response.json({
            data: paginatedData,
            total,
            offset,
            limit,
            success: true,
            elapsedTime: `${(Math.random() * 50 + 10).toFixed(4)}ms`,
            totalRetornado: paginatedData.length
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
        const data = await loadData()
        
        const concentrator = data.concentrators.find((c: any) => c.id === concentratorId)
        
        if (!concentrator) {
            return response.status(404).json({
                success: false,
                message: `Concentrador ${concentratorId} não encontrado`
            })
        }
        
        return response.json({
            id: concentrator.id,
            label: `CON_${concentrator.id}`,
            lat: concentrator.point.latitude,
            lng: concentrator.point.longitude,
            address: '',
            lastReadings: new Date(Date.now() - Math.random() * 600000).toISOString(),
            hardwareVersion: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}`,
            softwareVersion: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 100)}`,
            voltage: Math.floor(Math.random() * 50) + 210,
            statusConnection: new Date(Date.now() - Math.random() * 3600000).toISOString(),
            signal: Math.floor(Math.random() * 30) - 70,
            ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            totalRelays: concentrator.relays.length,
            connectionType: Math.random() > 0.5 ? '4G' : '3G',
            connectedSince: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
            disconnectedSince: '',
            installationDate: new Date(Date.now() - Math.random() * 63072000000).toISOString(),
            status: getRandomConcentratorStatus()
        })
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
        
        const data = await loadData()
        const concentrator = data.concentrators.find((c: any) => c.id === concentratorId)
        
        if (!concentrator) {
            return response.status(404).json({
                success: false,
                message: `Concentrador ${concentratorId} não encontrado`
            })
        }
        
        const allRelays = concentrator.relays.map((relay: any) => ({
            idRelay: relay.id.toString(),
            etiqueta: `REL_${relay.id}`,
            idSimcon: concentratorId.toString(),
            lat: relay.latitude.toFixed(5),
            lng: relay.longitude.toFixed(5),
            status: getRandomRelayStatus(),
            type: 'Lista Simucs'
        }))
        
        const total = allRelays.length
        const paginatedData = allRelays.slice(offset, offset + limit)
        
        return response.json({
            data: paginatedData,
            total,
            offset,
            limit,
            success: true,
            elapsedTime: `${(Math.random() * 100 + 20).toFixed(4)}ms`,
            totalRetornado: paginatedData.length
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
        
        const data = await loadData()
        const concentrator = data.concentrators.find((c: any) => c.id === concentratorId)
        
        if (!concentrator) {
            return response.status(404).json({
                success: false,
                message: `Concentrador ${concentratorId} não encontrado`
            })
        }
        
        const relay = concentrator.relays.find((r: any) => r.id === relayId)
        
        if (!relay) {
            return response.status(404).json({
                success: false,
                message: `Relé ${relayId} não encontrado no concentrador ${concentratorId}`
            })
        }
        
        const now = new Date()
        const isNight = now.getHours() >= 18 || now.getHours() <= 6
        const isOn = Math.random() > 0.3 ? isNight : !isNight
        const voltage = Math.floor(Math.random() * 40) + 200
        const current = Math.random() * 3 + 1
        const hasTimeProgram = Math.random() > 0.5
        const hasDimmer = Math.random() > 0.4
        const hasLightSensor = Math.random() > 0.2
        
        return response.json({
            idRelay: relay.id,
            idConcentrator: concentratorId,
            sector: Math.random() > 0.3 ? Math.floor(Math.random() * 10) + 1 : undefined,
            isOn,
            status: getRandomRelayStatus(),
            totalPower: Math.floor(voltage * current + Math.random() * 20),
            numberOfLights: 1,
            version: Math.floor(Math.random() * 10) + 1,
            installationDate: new Date(Date.now() - Math.random() * 94608000000).toISOString(),
            voltage: Math.floor(voltage),
            current: parseFloat(current.toFixed(2)),
            activePower: Math.floor(voltage * current),
            frequency: '60',
            ambientLight: isNight ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * 500) + 500,
            signal: Math.floor(Math.random() * 40) - 80,
            latitude: relay.latitude,
            longitude: relay.longitude,
            label: `REL_${relay.id}`,
            failureDetected: '',
            programmingHour: hasTimeProgram,
            hourProgrammingValue: hasTimeProgram ? '18:00,06:00' : '',
            dimmerProgramming: hasDimmer && Math.random() > 0.7,
            dimmerProgrammingValue: hasDimmer && Math.random() > 0.7 ? `${Math.floor(Math.random() * 50) + 50}%` : '',
            dimmerPresent: hasDimmer,
            lightSensorPresent: hasLightSensor,
            temperatureSensorPresent: Math.random() > 0.8,
            lightingTime: isNight && isOn ? `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : '',
            shutdownTime: !isNight && !isOn ? `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : '',
            timeOn: isNight && isOn ? `${String(Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : '00:00:00'
        })
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
        
        // Verificar se concentrador e relé existem
        const data = await loadData()
        const concentrator = data.concentrators.find((c: any) => c.id === parseInt(concentratorId))
        
        if (!concentrator) {
            return response.status(404).json({
                success: false,
                message: `Concentrador ${concentratorId} não encontrado`
            })
        }
        
        const relay = concentrator.relays.find((r: any) => r.id === parseInt(relayId))
        
        if (!relay) {
            return response.status(404).json({
                success: false,
                message: `Relé ${relayId} não encontrado no concentrador ${concentratorId}`
            })
        }
        
        // Simular execução do comando
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
    // Redirecionar para o endpoint principal
    const offset = request.input('offset', '0')
    const limit = request.input('limit', '1000')
    
    const newRequest = { ...request, input: () => ({ offset, limit }) }
    return router.get('/concentrators').handler({ request: newRequest, response } as any)
})

router.get('/get_concentrator_details/:id', async ({ params, response }) => {
    return router.get('/concentrators/:id/details').handler({ params, response } as any)
})

router.get('/get_relays/:id', async ({ params, request, response }) => {
    return router.get('/concentrators/:id/relays').handler({ params, request, response } as any)
})

router.get('/get_relay_details/:concentratorId/:relayId', async ({ params, response }) => {
    return router.get('/concentrators/:concentratorId/relays/:relayId/details').handler({ params, response } as any)
})

router.post('/execute_command', async ({ request, response }) => {
    return router.post('/commands').handler({ request, response } as any)
})