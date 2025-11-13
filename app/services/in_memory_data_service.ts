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

    // Método para obter horário brasileiro (GMT-3)
    private getBrazilTime(): Date {
        const now = new Date()
        // Ajustar para GMT-3 (Brasil)
        const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000))
        return brazilTime
    }

    // Método para obter timestamp brasileiro
    private getBrazilTimestamp(): string {
        return this.getBrazilTime().toISOString()
    }

    // Método para verificar se é horário noturno no Brasil
    private isNightTime(): boolean {
        const brazilTime = this.getBrazilTime()
        const hour = brazilTime.getHours()
        return hour >= 18 || hour <= 6
    }

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
                    subSector: Math.random() > 0.4 ? Math.floor(Math.random() * 5) + 1 : undefined,
                    areaGroup: Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : undefined,
                    observation: Math.random() > 0.7 ? this.generateRandomObservation() : undefined,
                    isOn: this.calculateInitialRelayState(),
                    status: '0110', // Será definido após configurar dimmer
                    totalPower: 0, // Será calculado
                    numberOfLights: Math.floor(Math.random() * 3) + 1, // 1-3 luminárias
                    version: Math.floor(Math.random() * 10) + 1,
                    hardwareVersion: `v0.9`,
                    installationDate: new Date(Date.now() - Math.random() * 94608000000).toISOString(),
                    voltage: Math.floor(Math.random() * 40) + 200,
                    current: parseFloat((Math.random() * 3 + 1).toFixed(2)),
                    activePower: 0, // Será calculado
                    reactivePower: 0, // Será calculado
                    apparentPower: 0, // Será calculado
                    powerFactor: parseFloat((Math.random() * 0.2 + 0.8).toFixed(2)),
                    activeEnergy: parseFloat((Math.random() * 5000 + 1000).toFixed(2)), // kWh acumulado
                    frequency: '60',
                    ambientLight: this.calculateAmbientLight(),
                    signal: Math.floor(Math.random() * 40) - 80,
                    latitude: relayData.latitude,
                    longitude: relayData.longitude,
                    label: `REL_${relayData.id}`,
                    failureDetected: '',
                    lastDetectedFailure: Math.random() > 0.8 ? this.generateRandomFailure() : undefined,
                    lastDetectedFailureDate: Math.random() > 0.8 ? new Date(Date.now() - Math.random() * 2592000000).toISOString() : undefined,
                    switchType: Math.random() > 0.5 ? 'NO' : 'NC', // Normally Open ou Normally Closed
                    defaultOnTime: Math.random() > 0.6 ? '18:00' : undefined,
                    defaultOffTime: Math.random() > 0.6 ? '06:00' : undefined,
                    firmwareVersion: `v1.7.5`,
                    programmingHour: Math.random() > 0.5,
                    hourProgrammingValue: '',
                    dimmerProgramming: false,
                    dimmerProgrammingValue: '',
                    dimmerPresent: Math.random() > 0.4,
                    currentDimmerValue: Math.random() > 0.4 ? Math.floor(Math.random() * 101) : 0, // 0-100%
                    lightSensorPresent: true,
                    isLightSensorEnabled: undefined, // Será definido após lightSensorPresent
                    gpsPresent: Math.random() > 0.7,
                    temperatureSensorPresent: Math.random() > 0.8,
                    currentTemperatureValue: Math.random() > 0.8 ? parseFloat((Math.random() * 20 + 15).toFixed(1)) : undefined, // 15-35°C
                    temperatureUnit: 'Celsius',
                    humiditySensorPresent: Math.random() > 0.6,
                    currentHumidityValue: Math.random() > 0.6 ? Math.floor(Math.random() * 60 + 30) : undefined, // 30-90%
                    humidityUnit: 'Porcentagem (%)',
                    motionSensorPresent: Math.random() > 0.3,
                    motionLevel: Math.random() > 0.3 ? Math.floor(Math.random() * 101) : undefined, // 0-100%
                    motionLevelUnit: 'Porcentagem (%)',
                    lastMotionDetectedTime: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 86400000).toISOString() : undefined,
                    motionDetectedCount: Math.random() > 0.3 ? Math.floor(Math.random() * 50) : undefined,
                    lightingTime: '',
                    shutdownTime: '',
                    timeOn: '00:00:00',
                    energyConsumption: parseFloat((Math.random() * 1000).toFixed(2)),
                    signal1Range: '300kHz',
                    signal1Strength: Math.floor(Math.random() * 40) - 80 // -80 a -40 dBm
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
                    const percentage = Math.floor(Math.random() * 50) + 50
                    relay.dimmerProgrammingValue = `${percentage}%`
                    relay.currentDimmerValue = percentage
                } else if (relay.dimmerPresent) {
                    relay.currentDimmerValue = relay.isOn ? 100 : 0
                }

                // Definir status baseado na presença de dimmer
                relay.status = this.getRandomRelayStatus(relay.dimmerPresent)

                // Configurar sensor de luz: habilitado por padrão se sensor estiver fisicamente presente
                relay.isLightSensorEnabled = relay.lightSensorPresent

                // Inicializar sensores de temperatura e umidade baseado na presença
                if (relay.temperatureSensorPresent && relay.currentTemperatureValue === undefined) {
                    relay.currentTemperatureValue = parseFloat((Math.random() * 20 + 15).toFixed(1))
                }
                
                if (relay.humiditySensorPresent && relay.currentHumidityValue === undefined) {
                    relay.currentHumidityValue = Math.floor(Math.random() * 60 + 30)
                }
                
                if (relay.motionSensorPresent) {
                    if (relay.motionLevel === undefined) relay.motionLevel = 0
                    if (relay.motionDetectedCount === undefined) relay.motionDetectedCount = 0
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
        const isNight = this.isNightTime()
        // À noite, 99% ligado, de dia 1% ligado
        return Math.random() < (isNight ? 0.99 : 0.01)
    }

    private calculateAmbientLight(): number {
        const isNight = this.isNightTime()
        return isNight ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * 500) + 500
    }

    // Simular comportamento do sensor de luz (LDR)
    private simulateLightSensor(relay: RelayDetails): boolean {
        // Sensor precisa estar fisicamente presente E habilitado
        if (!relay.lightSensorPresent || !relay.isLightSensorEnabled) return false

        const currentLight = relay.ambientLight
        const isNight = this.isNightTime()
        
        // Limiares do sensor LDR (ajustáveis)
        const NIGHT_THRESHOLD = 150  // Abaixo deste valor, considera noite
        const DAY_THRESHOLD = 400    // Acima deste valor, considera dia
        
        // Sensor detecta baixa luminosidade (noite)
        if (currentLight < NIGHT_THRESHOLD && !relay.isOn && isNight) {
            // LDR detecta escuridão, liga automaticamente
            relay.isOn = true
            relay.status = '0101'
            relay.lightingTime = this.getBrazilTimestamp().split('T')[1].split('.')[0]
            return true
        }
        
        // Sensor detecta alta luminosidade (dia)
        if (currentLight > DAY_THRESHOLD && relay.isOn && !isNight) {
            // LDR detecta claridade, desliga automaticamente
            relay.isOn = false
            relay.status = '0110'
            relay.shutdownTime = this.getBrazilTimestamp().split('T')[1].split('.')[0]
            return true
        }
        
        return false
    }

    private calculateTotalPower(): number {
        // Potência típica de LED para iluminação pública: 50-150W
        return Math.floor(Math.random() * 100) + 50
    }

    private generateRandomObservation(): string {
        const observations = [
            'Poste danificado',
            'Luminária com defeito',
            'Cabo exposto',
            'Manutenção preventiva necessária',
            'Vidro quebrado',
            'Oxidação detectada',
            'Necessita limpeza',
            'Ajuste de posição',
            'Trepidação no vento',
            'Iluminação insuficiente'
        ]
        return observations[Math.floor(Math.random() * observations.length)]
    }

    private generateRandomFailure(): string {
        const failures = [
            'LAMP_FAILURE',
            'VOLTAGE_DROP',
            'OVERHEAT',
            'COMMUNICATION_LOSS',
            'SENSOR_ERROR',
            'DIMMER_FAULT',
            'POWER_SUPPLY_ISSUE',
            'RELAY_STUCK',
            'SHORT_CIRCUIT',
            'OVERCURRENT'
        ]
        return failures[Math.floor(Math.random() * failures.length)]
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

    private getRandomRelayStatus(hasDimmer: boolean = false): RelayStatusType {
        const isNight = this.isNightTime()
        
        if (isNight) {
            // À noite: só podem existir status noturnos ou neutros
            // '0001' (acesa durante dia) NÃO pode existir à noite
            // '0010' (apagada durante noite) PODE existir à noite
            let nightStatuses: RelayStatusType[] = ['0101', '0110', '0010', '0011', '0100', '1000', '1001', '1010', '1011']
            let nightWeights = [0.85, 0.03, 0.05, 0.002, 0.002, 0.002, 0.002, 0.001, 0.001]
            
            // Adicionar status dimerizado apenas se o dimmer estiver presente
            if (hasDimmer) {
                nightStatuses.splice(2, 0, '0111') // Inserir '0111' na posição 2
                nightWeights.splice(2, 0, 0.10) // Inserir peso 0.10 na posição 2
                // Ajustar outros pesos proporcionalmente
                nightWeights[0] = 0.75 // Reduzir peso do ligado normal
                nightWeights[2] = 0.03 // Reduzir peso do apagada durante noite
            }
            
            const random = Math.random()
            let cumulative = 0
            
            for (let i = 0; i < nightWeights.length; i++) {
                cumulative += nightWeights[i]
                if (random <= cumulative) {
                    return nightStatuses[i]
                }
            }
        } else {
            // Durante o dia: só podem existir status diurnos ou neutros
            // '0010' (apagada durante noite) NÃO pode existir durante o dia
            // '0001' (acesa durante dia) PODE existir durante o dia (situação anômala)
            let dayStatuses: RelayStatusType[] = ['0110', '0101', '0001', '0011', '0100', '1000', '1001', '1010', '1011']
            let dayWeights = [0.98, 0.01, 0.002, 0.001, 0.001, 0.001, 0.001, 0.0005, 0.0005]
            
            // Status dimerizado durante o dia é raro, mas possível se dimmer presente
            if (hasDimmer) {
                dayStatuses.splice(2, 0, '0111') // Inserir '0111' na posição 2
                dayWeights.splice(2, 0, 0.002) // Inserir peso pequeno
                dayWeights[0] = 0.975 // Ajustar peso do desligado
            }
            
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
            concentrator.lastReadings = this.getBrazilTimestamp()
        }

        // Executar comando no relé
        switch (command) {
            case 'turn_light_on':
                relay.isOn = true
                relay.status = '0101' // Luminária Ligado
                relay.lightingTime = this.getBrazilTimestamp().split('T')[1].split('.')[0]
                break
                
            case 'turn_light_off':
                relay.isOn = false
                relay.status = '0110' // Luminária Desligado
                relay.shutdownTime = this.getBrazilTimestamp().split('T')[1].split('.')[0]
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
                // Se estava dimerizado e dimmer foi desabilitado, voltar para status normal
                if (relay.status === '0111') {
                    relay.status = relay.isOn ? '0101' : '0110'
                }
                break
                
            case 'program_dimmer_percentage':
                if (relay.dimmerPresent && parameters?.percentage) {
                    relay.dimmerProgramming = true
                    relay.dimmerProgrammingValue = `${parameters.percentage}%`
                    relay.status = '0111' // Luminária Dimerizado
                }
                break
                
            case 'enable_light_sensor':
                if (relay.lightSensorPresent) {
                    relay.isLightSensorEnabled = true
                    // Sensor de luz (LDR) habilitado: luminária será controlada automaticamente
                    // Liga quando luminosidade < 150 lux (noite), desliga quando > 400 lux (dia)
                } else {
                    return false // Não pode habilitar se sensor não estiver fisicamente presente
                }
                break
                
            case 'disable_light_sensor':
                relay.isLightSensorEnabled = false
                // Sensor de luz (LDR) desabilitado: sem controle automático por luminosidade
                // Controle apenas manual ou por programação horária
                break
                
            case 'enable_light_time_program':
                relay.programmingHour = true
                break

             case 'disable_light_time_program':
                relay.programmingHour = false
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

    // Método para validar consistência dos dados dos relés
    validateRelayData(): { totalRelays: number, invalidDimmerStatus: number, invalidTimeStatus: number, corrected: number } {
        let totalRelays = 0
        let invalidDimmerStatus = 0
        let invalidTimeStatus = 0
        let corrected = 0
        
        const isNight = this.isNightTime()
        
        this.relays.forEach(relay => {
            totalRelays++
            
            // Verificar se status dimerizado existe sem dimmer presente
            if (relay.status === '0111' && !relay.dimmerPresent) {
                invalidDimmerStatus++
                relay.status = relay.isOn ? '0101' : '0110'
                corrected++
            }
            
            // Verificar inconsistências temporais
            if (isNight && relay.status === '0001') {
                // À noite não pode ter "acesa durante o dia"
                invalidTimeStatus++
                relay.status = '0101' // Trocar para ligado normal
                corrected++
            } else if (!isNight && relay.status === '0010') {
                // Durante o dia não pode ter "apagada durante a noite"
                invalidTimeStatus++
                relay.status = '0110' // Trocar para desligado normal
                corrected++
            }
            
            // Verificar se dimmer programming existe sem dimmer presente
            if (relay.dimmerProgramming && !relay.dimmerPresent) {
                relay.dimmerProgramming = false
                relay.dimmerProgrammingValue = ''
                relay.currentDimmerValue = 0
                corrected++
            }
        })
        
        return { totalRelays, invalidDimmerStatus, invalidTimeStatus, corrected }
    }

    // Método público para obter estatísticas dos sensores
    getSensorStatistics(): {
        totalRelays: number
        sensorsPresent: {
            dimmer: number
            lightSensor: number
            lightSensorEnabled: number
            gps: number
            temperature: number
            humidity: number
            motion: number
        }
        averageValues: {
            temperature?: number
            humidity?: number
            motionLevel?: number
            ambientLight: number
        }
    } {
        const allRelays = Array.from(this.relays.values())
        const totalRelays = allRelays.length
        
        const sensorsPresent = {
            dimmer: allRelays.filter(r => r.dimmerPresent).length,
            lightSensor: allRelays.filter(r => r.lightSensorPresent).length,
            lightSensorEnabled: allRelays.filter(r => r.lightSensorPresent && r.isLightSensorEnabled).length,
            gps: allRelays.filter(r => r.gpsPresent).length,
            temperature: allRelays.filter(r => r.temperatureSensorPresent).length,
            humidity: allRelays.filter(r => r.humiditySensorPresent).length,
            motion: allRelays.filter(r => r.motionSensorPresent).length,
        }
        
        const tempValues = allRelays.filter(r => r.currentTemperatureValue !== undefined)
            .map(r => r.currentTemperatureValue!!)
        const humidityValues = allRelays.filter(r => r.currentHumidityValue !== undefined)
            .map(r => r.currentHumidityValue!!)
        const motionValues = allRelays.filter(r => r.motionLevel !== undefined)
            .map(r => r.motionLevel!!)
        
        const averageValues = {
            temperature: tempValues.length > 0 ? parseFloat((tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(1)) : undefined,
            humidity: humidityValues.length > 0 ? Math.floor(humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length) : undefined,
            motionLevel: motionValues.length > 0 ? Math.floor(motionValues.reduce((a, b) => a + b, 0) / motionValues.length) : undefined,
            ambientLight: Math.floor(allRelays.reduce((a, b) => a + b.ambientLight, 0) / totalRelays)
        }
        
        return { totalRelays, sensorsPresent, averageValues }
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
                concentrator.lastReadings = this.getBrazilTimestamp()
            }
        })

        // Atualizar dados dos relés baseado em horário e sensores
        this.relays.forEach(relay => {
            // Atualizar luz ambiente primeiro
            relay.ambientLight = this.calculateAmbientLight()
            
            // Simular sensor de luz (LDR) - apenas se sensor presente, habilitado e sem programação horária manual
            if (relay.lightSensorPresent && relay.isLightSensorEnabled && !relay.programmingHour) {
                this.simulateLightSensor(relay)
            }
            
            // Simular sensor de temperatura
            if (relay.temperatureSensorPresent && relay.currentTemperatureValue !== undefined) {
                // Variação pequena de temperatura (-2°C a +2°C)
                const variation = (Math.random() - 0.5) * 4
                relay.currentTemperatureValue = parseFloat((relay.currentTemperatureValue + variation).toFixed(1))
                // Manter entre 10°C e 40°C
                relay.currentTemperatureValue = Math.max(10, Math.min(40, relay.currentTemperatureValue))
            }
            
            // Simular sensor de umidade
            if (relay.humiditySensorPresent && relay.currentHumidityValue !== undefined) {
                // Variação pequena de umidade (-5% a +5%)
                const variation = (Math.random() - 0.5) * 10
                relay.currentHumidityValue = Math.floor(relay.currentHumidityValue + variation)
                // Manter entre 20% e 95%
                relay.currentHumidityValue = Math.max(20, Math.min(95, relay.currentHumidityValue))
            }
            
            // Simular sensor de movimento
            if (relay.motionSensorPresent) {
                // Movimento detectado com mais frequência à noite
                const isNight = this.isNightTime()
                const motionChance = isNight ? 0.15 : 0.05
                
                if (Math.random() < motionChance && relay.motionDetectedCount !== undefined) {
                    relay.lastMotionDetectedTime = this.getBrazilTimestamp()
                    relay.motionDetectedCount++
                    relay.motionLevel = Math.floor(Math.random() * 61 + 40) // 40-100% quando movimento detectado
                } else if (relay.motionLevel !== undefined) {
                    // Diminuir gradualmente o nível de movimento quando não há detecção
                    relay.motionLevel = Math.max(0, relay.motionLevel - Math.floor(Math.random() * 10))
                }
            }
            
            // Atualizar valor do dimmer baseado no estado
            if (relay.dimmerPresent) {
                if (relay.dimmerProgramming && relay.dimmerProgrammingValue) {
                    // Extrair percentual do valor programado
                    const match = relay.dimmerProgrammingValue.match(/(\\d+)%/)
                    if (match) {
                        relay.currentDimmerValue = parseInt(match[1])
                    }
                } else if (relay.isOn) {
                    relay.currentDimmerValue = 100 // 100% quando ligado sem dimerização
                } else {
                    relay.currentDimmerValue = 0 // 0% quando desligado
                }
            }
            
            // Validar e corrigir status baseado na presença de dimmer e horário
            const isNight = this.isNightTime()
            
            if (relay.status === '0111' && !relay.dimmerPresent) {
                // Se status é dimerizado mas não tem dimmer, corrigir para ligado ou desligado
                relay.status = relay.isOn ? '0101' : '0110'
            }
            
            // Validar consistência temporal dos status
            if (isNight && relay.status === '0001') {
                // À noite não pode ter "acesa durante o dia"
                relay.status = '0101' // Trocar para ligado normal
            } else if (!isNight && relay.status === '0010') {
                // Durante o dia não pode ter "apagada durante a noite" 
                relay.status = '0110' // Trocar para desligado normal
            }
            
            // Simular acúmulo de energia ativa (apenas quando ligado)
            if (relay.isOn && relay.activePower > 0) {
                // Acumular energia baseado na potência ativa (simulando 1 hora de operação por ciclo)
                const energyIncrement = relay.activePower / 1000 // Converter W para kW
                relay.activeEnergy = parseFloat((relay.activeEnergy + energyIncrement).toFixed(2))
            }
            
            // Recalcular todas as potências
            this.calculatePowerValues(relay)
        })
    }
}