import { Concentrator, Relay } from '#app/models/lighting_models'
import { 
    ConcentratorSummary, 
    RelaySummary, 
    PaginatedResponse, 
    CommandRequest 
} from '#app/types/lighting_types'
import DataProcessor from '../../scripts/data_processor'
import { DateTime } from 'luxon'

export class LightingService 
{
    private static instance: LightingService
    private concentrators: Map<number, Concentrator> = new Map()
    private relays: Map<number, Relay> = new Map()
    private dataProcessor: DataProcessor
    private initialized: boolean = false

    constructor() 
    {
        this.dataProcessor = new DataProcessor()
    }

    public static getInstance(): LightingService 
    {
        if (!LightingService.instance) 
        {
            LightingService.instance = new LightingService()
        }
        return LightingService.instance
    }

    public async initialize(): Promise<void> 
    {
        if (this.initialized) return

        console.log('Inicializando dados de iluminação...')
        
        // Gerar ou carregar dados do processador
        this.dataProcessor.generateData()
        
        // Criar instâncias de concentradores e relés
        const concentratorData = this.dataProcessor.getConcentrators()
        
        for (const concData of concentratorData) 
        {
            const concentrator = new Concentrator(
                concData.id, 
                concData.point.latitude, 
                concData.point.longitude
            )
            
            // Adicionar relés ao concentrador
            for (const relayPoint of concData.relays) 
            {
                const relay = new Relay(
                    relayPoint.id,
                    concData.id,
                    relayPoint.latitude,
                    relayPoint.longitude,
                    relayPoint.power
                )
                
                concentrator.addRelay(relay.idRelay)
                this.relays.set(relay.idRelay, relay)
            }
            
            this.concentrators.set(concentrator.id, concentrator)
        }

        this.initialized = true
        console.log(`Inicializado com ${this.concentrators.size} concentradores e ${this.relays.size} relés`)
    }

    public async getConcentrators(offset: number = 0, limit: number = 1000): Promise<PaginatedResponse<ConcentratorSummary>> 
    {
        const startTime = DateTime.now()
        await this.initialize()

        const allConcentrators = Array.from(this.concentrators.values())
        const total = allConcentrators.length
        const paginatedConcentrators = allConcentrators.slice(offset, offset + limit)

        const data: ConcentratorSummary[] = paginatedConcentrators.map(conc => ({
            id: conc.id.toString(),
            label: conc.label,
            lat: conc.lat.toFixed(5),
            lng: conc.lng.toFixed(5),
            status: conc.status
        }))

        const elapsedTime = DateTime.now().diff(startTime).toMillis().toFixed(4) + 'ms'

        return {
            data,
            total,
            offset,
            limit,
            success: true,
            elapsedTime,
            totalRetornado: data.length
        }
    }

    public async getRelaysByConcentrator(concentratorId: number, offset: number = 0, limit: number = 1000): Promise<PaginatedResponse<RelaySummary>> 
    {
        const startTime = DateTime.now()
        await this.initialize()

        const concentrator = this.concentrators.get(concentratorId)
        if (!concentrator) 
        {
            throw new Error(`Concentrador ${concentratorId} não encontrado`)
        }

        const relayIds = concentrator.getRelayIds()
        const total = relayIds.length
        const paginatedRelayIds = relayIds.slice(offset, offset + limit)

        const data: RelaySummary[] = paginatedRelayIds.map(relayId => {
            const relay = this.relays.get(relayId)!
            return {
                idRelay: relay.idRelay.toString(),
                etiqueta: relay.label,
                idSimcon: relay.idConcentrator.toString(),
                lat: relay.latitude.toFixed(5),
                lng: relay.longitude.toFixed(5),
                status: relay.status,
                type: 'Lista Simucs'
            }
        })

        const elapsedTime = DateTime.now().diff(startTime).toMillis().toFixed(4) + 'ms'

        return {
            data,
            total,
            offset,
            limit,
            success: true,
            elapsedTime,
            totalRetornado: data.length
        }
    }

    public async getConcentratorDetails(concentratorId: number) 
    {
        
        await this.initialize()   
        
        const concentrator = this.concentrators.get(concentratorId)
        if (!concentrator) 
        {
            throw new Error(`Concentrador ${concentratorId} não encontrado`)
        }

        return concentrator.toDetails()
    }

    public async getRelayDetails(concentratorId: number, relayId: number) 
    { 
        await this.initialize()
        

        const concentrator = this.concentrators.get(concentratorId)
        if (!concentrator) 
        {
            throw new Error(`Concentrador ${concentratorId} não encontrado`)
        }

        const relay = this.relays.get(relayId)
        if (!relay || relay.idConcentrator !== concentratorId) 
        {
            throw new Error(`Relé ${relayId} não encontrado no concentrador ${concentratorId}`)
        }

        return relay.toDetails()
    }

    public async executeCommand(commandRequest: CommandRequest): Promise<{ success: boolean, message: string }> 
    {
        await this.initialize()

        const { command, concentratorId, relayId, parameters } = commandRequest

        // Verificar se o concentrador existe
        const concentrator = this.concentrators.get(concentratorId)
        if (!concentrator) 
        {
            return { 
                success: false, 
                message: `Concentrador ${concentratorId} não encontrado` 
            }
        }

        // Verificar se o relé existe e pertence ao concentrador
        const relay = this.relays.get(relayId)
        if (!relay || relay.idConcentrator !== concentratorId) 
        {
            return { 
                success: false, 
                message: `Relé ${relayId} não encontrado no concentrador ${concentratorId}` 
            }
        }

        // Executar comando no relé
        const success = relay.executeCommand(command, parameters)
        
        if (success) 
        {
            // Simular atualização do tempo de última leitura do concentrador
            concentrator.lastReadings = DateTime.now().toISO() || ''
            
            return { 
                success: true, 
                message: `Comando ${command} executado com sucesso no relé ${relayId}` 
            }
        } else 
        {
            return { 
                success: false, 
                message: `Falha ao executar comando ${command} no relé ${relayId}` 
            }
        }
    }

    // Método para simular mudanças automáticas nos relés (como ciclo dia/noite)
    public simulateTimeBasedChanges(): void 
    {
        const now = DateTime.now()
        const isNight = now.hour >= 18 || now.hour <= 6

        for (const relay of this.relays.values()) 
        {
            // Simular mudanças baseadas em programação horária
            if (relay.programmingHour && relay.hourProgrammingValue) 
            {
                const [onTime, offTime] = relay.hourProgrammingValue.split(',')
                const currentTime = now.toFormat('HH:mm')
                
                if (onTime === currentTime && !relay.isOn) 
                {
                    relay.executeCommand('turn_light_on')
                } else if (offTime === currentTime && relay.isOn) 
                {
                    relay.executeCommand('turn_light_off')
                }
            }
            
            // Simular mudanças baseadas em sensor de luz
            if (relay.lightSensorPresent) 
            {
                const shouldBeOn = isNight
                if (relay.isOn !== shouldBeOn && Math.random() > 0.1) // 90% chance de funcionar corretamente
                {
                    relay.executeCommand(shouldBeOn ? 'turn_light_on' : 'turn_light_off')
                }
            }
        }
    }
}