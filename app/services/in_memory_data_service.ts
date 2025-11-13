import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { 
    ConcentratorSummary, 
    RelaySummary, 
    ConcentratorDetails, 
    RelayDetails
} from '../types/lighting_types.js'
import { ConcentratorStatus, RelayStatus } from '../types/lighting_types.js'

type ConcentratorStatusType = typeof ConcentratorStatus[keyof typeof ConcentratorStatus]
type RelayStatusType = typeof RelayStatus[keyof typeof RelayStatus]

interface LoadedData {
    concentrators: Array<{
        id: number
        point: {
            latitude: number
            longitude: number
        }
        relays: Array<{
            id: number
            latitude: number
            longitude: number
        }>
    }>
}

export class InMemoryDataService {
    private static instance: InMemoryDataService | null = null
    private concentrators: Map<number, ConcentratorDetails> = new Map()
    private relays: Map<string, RelayDetails> = new Map() // key: `${concentratorId}_${relayId}`
    private concentratorToRelays: Map<number, Set<number>> = new Map()
    private isInitialized = false

    constructor() {}

    static getInstance(): InMemoryDataService {
        if (!InMemoryDataService.instance) {
            InMemoryDataService.instance = new InMemoryDataService()
        }
        return InMemoryDataService.instance
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return
        }

        try {
            const dataPath = join(process.cwd(), 'assets', 'generated_data.json')
            
            if (!existsSync(dataPath)) {
                throw new Error('Dados não encontrados. Execute: node scripts/generate_data.cjs')
            }
            
            const rawData: LoadedData = JSON.parse(readFileSync(dataPath, 'utf-8'))
            this.loadInitialData(rawData)
            this.isInitialized = true
            
            console.log(`✅ Dados carregados em memória: ${this.concentrators.size} concentradores, ${this.relays.size} relés`)
        } catch (error) {
            console.error('❌ Erro ao carregar dados iniciais:', error)
            throw error
        }
    }

    private loadInitialData(data: LoadedData): void {
        data.concentrators.forEach(concentratorData => {
            // Criar dados do concentrador
            const concentrator: ConcentratorDetails = {
                id: concentratorData.id,
                label: `CON_${concentratorData.id}`,
                lat: concentratorData.point.latitude,
                lng: concentratorData.point.longitude,
                address: '',
                lastReadings: new Date(Date.now() - Math.random() * 600000).toISOString(),
                hardwareVersion: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}`,
                softwareVersion: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 100)}`,
                voltage: Math.floor(Math.random() * 50) + 210,
                statusConnection: new Date(Date.now() - Math.random() * 3600000).toISOString(),
                signal: Math.floor(Math.random() * 30) - 70,
                ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                totalRelays: concentratorData.relays.length,
                connectionType: Math.random() > 0.5 ? '4G' : '3G',
                connectedSince: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
                disconnectedSince: '',
                installationDate: new Date(Date.now() - Math.random() * 63072000000).toISOString(),
                status: this.getRandomConcentratorStatus()
            }

            this.concentrators.set(concentratorData.id, concentrator)

            // Criar mapeamento de relés para este concentrador
            const relayIds = new Set<number>()
            
            concentratorData.relays.forEach(relayData => {
                const relayKey = `${concentratorData.id}_${relayData.id}`
                
                const relay: RelayDetails = {
                    idRelay: relayData.id,
                    idConcentrator: concentratorData.id,
                    sector: Math.random() > 0.3 ? Math.floor(Math.random() * 10) + 1 : undefined,
                    isOn: this.calculateInitialRelayState(),
                    status: this.getRandomRelayStatus(),
                    totalPower: 0, // Será calculado
                    numberOfLights: 1,
                    version: Math.floor(Math.random() * 10) + 1,
                    installationDate: new Date(Date.now() - Math.random() * 94608000000).toISOString(),
                    voltage: Math.floor(Math.random() * 40) + 200,
                    current: parseFloat((Math.random() * 3 + 1).toFixed(2)),
                    activePower: 0, // Será calculado
                    reactivePower: 0, // Será calculado
                    apparentPower: 0, // Será calculado
                    powerFactor: parseFloat((Math.random() * 0.2 + 0.8).toFixed(2)),
                    frequency: '60',
                    ambientLight: this.calculateAmbientLight(),
                    signal: Math.floor(Math.random() * 40) - 80,
                    latitude: relayData.latitude,
                    longitude: relayData.longitude,
                    label: `REL_${relayData.id}`,
                    failureDetected: '',
                    programmingHour: Math.random() > 0.5,
                    hourProgrammingValue: '',
                    dimmerProgramming: false,
                    dimmerProgrammingValue: '',
                    dimmerPresent: Math.random() > 0.4,
                    lightSensorPresent: Math.random() > 0.2,
                    temperatureSensorPresent: Math.random() > 0.8,
                    lightingTime: '',
                    shutdownTime: '',
                    timeOn: '00:00:00',
                    energyConsumption: parseFloat((Math.random() * 1000).toFixed(2)),
                    firmwareVersion: `v1.3.5`,
                    hardwareVersion: `v0.9`
                }

                // Calcular todas as potências usando o novo método
                this.calculatePowerValues(relay)

                // Configurar programação horária se ativo
                if (relay.programmingHour) {
                    relay.hourProgrammingValue = '18:00,06:00'
                }

                // Configurar dimmer se presente e programado
                if (relay.dimmerPresent && Math.random() > 0.7) {
                    relay.dimmerProgramming = true
                    relay.dimmerProgrammingValue = `${Math.floor(Math.random() * 50) + 50}%`
                }

                // Configurar horários baseados no estado atual
                this.updateRelayTimes(relay)

                this.relays.set(relayKey, relay)
                relayIds.add(relayData.id)
            })

            this.concentratorToRelays.set(concentratorData.id, relayIds)
        })
    }

    private calculateInitialRelayState(): boolean {
        const now = new Date()
        const isNight = now.getHours() >= 18 || now.getHours() <= 6
        // À noite, 99% ligado, de dia 1% ligado
        return Math.random() < (isNight ? 0.99 : 0.01)
    }

    private calculateAmbientLight(): number {
        const now = new Date()
        const isNight = now.getHours() >= 18 || now.getHours() <= 6
        return isNight ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * 500) + 500
    }

    private calculateTotalPower(): number {
        // Potência típica de LED para iluminação pública: 50-150W
        return Math.floor(Math.random() * 100) + 50
    }

    private calculatePowerValues(relay: RelayDetails): void {
        if (!relay.isOn) {
            relay.activePower = 0
            relay.reactivePower = 0
            relay.apparentPower = 0
            relay.totalPower = 0
            return
        }

        // Calcular potência aparente (S = V × I)
        relay.apparentPower = parseFloat((relay.voltage * relay.current).toFixed(2))
        
        // Calcular potência ativa (P = S × cos(φ), onde cos(φ) é o fator de potência)
        relay.activePower = parseFloat((relay.apparentPower * relay.powerFactor).toFixed(2))
        
        // Calcular potência reativa (Q = S × sen(φ), onde sen(φ) = √(1 - cos²(φ)))
        const sinPhi = Math.sqrt(1 - Math.pow(relay.powerFactor, 2))
        relay.reactivePower = parseFloat((relay.apparentPower * sinPhi).toFixed(2))
        
        // Atualizar potência total (para compatibilidade com código existente)
        relay.totalPower = relay.activePower + Math.floor(Math.random() * 20)
    }

    private updateRelayTimes(relay: RelayDetails): void {
        const now = new Date()
        const isNight = now.getHours() >= 18 || now.getHours() <= 6
        
        if (relay.isOn && isNight) {
            relay.lightingTime = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
            relay.timeOn = `${String(Math.floor(Math.random() * 12)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
        } else if (!relay.isOn && !isNight) {
            relay.shutdownTime = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
            relay.timeOn = '00:00:00'
        }
    }

    private getRandomConcentratorStatus(): ConcentratorStatusType {
        const statuses: ConcentratorStatusType[] = ['0001', '0010', '0011', '0101', '0110', '0111']
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

    private getRandomRelayStatus(): RelayStatusType {
        const now = new Date()
        const isNight = now.getHours() >= 18 || now.getHours() <= 6
        
        if (isNight) {
            // À noite, 95% ligado, 3% desligado, 2% outros status
            const nightStatuses: RelayStatusType[] = ['0101', '0110', '0111', '0001', '0010', '0011', '0100', '1000', '1001', '1010', '1011']
            const nightWeights = [0.85, 0.03, 0.10, 0.005, 0.005, 0.002, 0.002, 0.002, 0.002, 0.001, 0.001]
            
            const random = Math.random()
            let cumulative = 0
            
            for (let i = 0; i < nightWeights.length; i++) {
                cumulative += nightWeights[i]
                if (random <= cumulative) {
                    return nightStatuses[i]
                }
            }
        } else {
            // Durante o dia, 98% desligado, apenas 1-2% ligado
            const dayStatuses: RelayStatusType[] = ['0110', '0101', '0010', '0001', '0011', '0100', '0111', '1000', '1001', '1010', '1011']
            const dayWeights = [0.98, 0.01, 0.002, 0.002, 0.001, 0.001, 0.001, 0.001, 0.001, 0.0005, 0.0005]
            
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

    // Métodos públicos para acessar os dados

    getAllConcentrators(offset = 0, limit = 1000): { data: ConcentratorSummary[], total: number } {
        const allConcentrators = Array.from(this.concentrators.values()).map((conc, index) => ({
            id: conc.id.toString(),
            label: `Concentrador_${index + 1}`,
            lat: conc.lat.toFixed(5),
            lng: conc.lng.toFixed(5),
            status: conc.status
        }))
        
        const total = allConcentrators.length
        const data = allConcentrators.slice(offset, offset + limit)
        
        return { data, total }
    }

    getConcentratorDetails(concentratorId: number): ConcentratorDetails | null {
        return this.concentrators.get(concentratorId) || null
    }

    getConcentratorRelays(concentratorId: number, offset = 0, limit = 1000): { data: RelaySummary[], total: number } | null {
        const relayIds = this.concentratorToRelays.get(concentratorId)
        if (!relayIds) {
            return null
        }

        const allRelays: RelaySummary[] = []
        
        relayIds.forEach(relayId => {
            const relayKey = `${concentratorId}_${relayId}`
            const relay = this.relays.get(relayKey)
            if (relay) {
                allRelays.push({
                    idRelay: relay.idRelay.toString(),
                    etiqueta: relay.label,
                    idSimcon: concentratorId.toString(),
                    lat: relay.latitude.toFixed(5),
                    lng: relay.longitude.toFixed(5),
                    status: relay.status,
                    type: 'Lista Simucs'
                })
            }
        })

        const total = allRelays.length
        const data = allRelays.slice(offset, offset + limit)
        
        return { data, total }
    }

    getRelayDetails(concentratorId: number, relayId: number): RelayDetails | null {
        const relayKey = `${concentratorId}_${relayId}`
        return this.relays.get(relayKey) || null
    }

    executeCommand(concentratorId: number, relayId: number, command: string, parameters?: any): boolean {
        const relayKey = `${concentratorId}_${relayId}`
        const relay = this.relays.get(relayKey)
        
        if (!relay) {
            return false
        }

        // Atualizar último acesso do concentrador
        const concentrator = this.concentrators.get(concentratorId)
        if (concentrator) {
            concentrator.lastReadings = new Date().toISOString()
        }

        // Executar comando no relé
        switch (command) {
            case 'turn_light_on':
                relay.isOn = true
                relay.status = '0101' // Luminária Ligado
                relay.lightingTime = new Date().toISOString().split('T')[1].split('.')[0]
                break
                
            case 'turn_light_off':
                relay.isOn = false
                relay.status = '0110' // Luminária Desligado
                relay.shutdownTime = new Date().toISOString().split('T')[1].split('.')[0]
                relay.timeOn = '00:00:00'
                break
                
            case 'enable_dimmer':
                if (relay.dimmerPresent) {
                    relay.dimmerProgramming = true
                    relay.status = '0111' // Luminária Dimerizado
                }
                break
                
            case 'disable_dimmer':
                relay.dimmerProgramming = false
                relay.dimmerProgrammingValue = ''
                break
                
            case 'program_dimmer_percentage':
                if (relay.dimmerPresent && parameters?.percentage) {
                    relay.dimmerProgramming = true
                    relay.dimmerProgrammingValue = `${parameters.percentage}%`
                    relay.status = '0111' // Luminária Dimerizado
                }
                break
                
            case 'disable_light_sensor':
                if(relay.lightSensorPresent)
                relay.lightSensorPresent = false
                break
                
            case 'enable_light_time_program':
                relay.programmingHour = true
                break
                
            case 'setup_light_time_program':
                if (parameters?.onTime && parameters?.offTime) {
                    relay.programmingHour = true
                    relay.hourProgrammingValue = `${parameters.onTime},${parameters.offTime}`
                }
                break
                
            default:
                return false
        }

        // Recalcular potências se estado mudou
        if (command.includes('turn_light')) {
            this.calculatePowerValues(relay)
        }

        return true
    }

    // Método público para recalcular potências de um relé específico
    updateRelayPowerValues(concentratorId: number, relayId: number): boolean {
        const relayKey = `${concentratorId}_${relayId}`
        const relay = this.relays.get(relayKey)
        
        if (!relay) {
            return false
        }

        this.calculatePowerValues(relay)
        return true
    }

    // Método público para atualizar parâmetros de um relé e recalcular potências
    updateRelayParameters(concentratorId: number, relayId: number, updates: Partial<Pick<RelayDetails, 'voltage' | 'current' | 'powerFactor' | 'isOn'>>): boolean {
        const relayKey = `${concentratorId}_${relayId}`
        const relay = this.relays.get(relayKey)
        
        if (!relay) {
            return false
        }

        // Atualizar parâmetros fornecidos
        if (updates.voltage !== undefined) relay.voltage = updates.voltage
        if (updates.current !== undefined) relay.current = updates.current
        if (updates.powerFactor !== undefined) relay.powerFactor = updates.powerFactor
        if (updates.isOn !== undefined) relay.isOn = updates.isOn

        // Recalcular potências com novos valores
        this.calculatePowerValues(relay)
        return true
    }

    // Método para simular mudanças automáticas no sistema (chamado periodicamente)
    simulateSystemUpdates(): void {
        // Atualizar dados dos concentradores
        this.concentrators.forEach(concentrator => {
            // Simular última leitura a cada 3 minutos (com variação)
            if (Math.random() < 0.1) { // 10% de chance a cada chamada
                concentrator.lastReadings = new Date().toISOString()
            }
        })

        // Atualizar dados dos relés baseado em horário e sensores
        this.relays.forEach(relay => {
            // Simular mudanças baseadas em sensor de luz
            if (relay.lightSensorPresent && !relay.programmingHour) {
                const now = new Date()
                const isNight = now.getHours() >= 18 || now.getHours() <= 6
                
                if (isNight && !relay.isOn && Math.random() < 0.03) {
                    // À noite, chance de ligar relés que estão desligados
                    relay.isOn = true
                    relay.status = '0101'
                    relay.lightingTime = new Date().toISOString().split('T')[1].split('.')[0]
                } else if (!isNight && relay.isOn && Math.random() < 0.8) {
                    // Durante o dia, alta chance de desligar relés que estão ligados
                    relay.isOn = false
                    relay.status = '0110'
                    relay.shutdownTime = new Date().toISOString().split('T')[1].split('.')[0]
                } else if (!isNight && !relay.isOn && Math.random() < 0.001) {
                    // Durante o dia, chance mínima de ligar (apenas para simulação realística)
                    relay.isOn = true
                    relay.status = '0001' // Acesa durante o dia (situação anômala)
                }
            }

            // Atualizar luz ambiente
            relay.ambientLight = this.calculateAmbientLight()
            
            // Recalcular todas as potências
            this.calculatePowerValues(relay)
        })
    }
}