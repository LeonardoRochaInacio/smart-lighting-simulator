/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const SmartLightingSimulator = () => import('#controllers/smart_lighting_simulator')

// Rota de teste simples
router.get('/test', async ({ response }) => {
    return response.json({
        success: true,
        message: 'Servidor funcionando!',
        timestamp: new Date().toISOString()
    })
}) 

// Implementação completa dos endpoints solicitados

// Status do sistema usando controller
router.get('/status', [SmartLightingSimulator, 'getSystemStatus'])

// Usando controllers para organizar melhor a lógica de negócio

// GET /concentrators - Lista concentradores (paginado)
router.get('/concentrators', [SmartLightingSimulator, 'getConcentrators'])

// GET /concentrators/:id/details - Detalhes do concentrador
router.get('/concentrators/:id/details', [SmartLightingSimulator, 'getConcentratorDetails'])

// GET /concentrators/:id/relays - Lista relés do concentrador (paginado)  
router.get('/concentrators/:id/relays', [SmartLightingSimulator, 'getRelays'])

// GET /concentrators/:concentratorId/relays/:relayId/details - Detalhes do relé
router.get('/concentrators/:concentratorId/relays/:relayId/details', [SmartLightingSimulator, 'getRelayDetails'])

// POST /commands - Executa comando no relé
router.post('/commands', [SmartLightingSimulator, 'executeCommand'])

// Endpoints de conectividade
router.get('/connectivity', [SmartLightingSimulator, 'getConnectivity'])
router.post('/concentrators/:id/reconnect', [SmartLightingSimulator, 'reconnectConcentrator'])
router.post('/concentrators/:id/disconnect', [SmartLightingSimulator, 'disconnectConcentrator'])

// Endpoint para validação e correção de status
router.post('/validate/statuses', [SmartLightingSimulator, 'validateAndCorrectStatuses'])

// Aliases para compatibilidade com o agregador
router.get('/get_concentrators', [SmartLightingSimulator, 'getConcentrators'])
router.get('/get_concentrator_details/:id', [SmartLightingSimulator, 'getConcentratorDetails'])
router.get('/get_relays/:id', [SmartLightingSimulator, 'getRelays'])
router.get('/get_relay_details/:concentratorId/:relayId', [SmartLightingSimulator, 'getRelayDetails'])
router.post('/execute_command', [SmartLightingSimulator, 'executeCommand'])