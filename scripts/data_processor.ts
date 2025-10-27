import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

interface Point 
{
    id: number
    latitude: number
    longitude: number
    type: string
    power: number
    area: string
}

interface ConcentratorData 
{
    id: number
    point: Point
    relays: Point[]
}

class DataProcessor 
{
    private points: Point[] = []
    private concentrators: ConcentratorData[] = []
    private dataFile = join(process.cwd(), 'assets', 'generated_data.json')

    constructor() 
    {
        this.loadPoints()
    }

    private loadPoints(): void 
    {
        const csvPath = join(process.cwd(), 'assets', 'points.csv')
        const csvContent = readFileSync(csvPath, 'utf-8')
        const lines = csvContent.split('\n')
        
        // Pular o cabeçalho
        for (let i = 1; i < lines.length; i++) 
        {
            const line = lines[i].trim()
            if (!line) continue
            
            const columns = line.split(';')
            if (columns.length >= 23) 
            {
                const latitude = parseFloat(columns[21])
                const longitude = parseFloat(columns[22])
                const power = parseInt(columns[3]) || 160
                const area = columns[19] || 'Urbano'
                const type = columns[2] || 'Mista'
                
                if (!isNaN(latitude) && !isNaN(longitude)) 
                {
                    this.points.push({
                        id: 14136400 + i, // Gerar ID baseado na posição
                        latitude,
                        longitude,
                        type,
                        power,
                        area
                    })
                }
            }
        }
        
        console.log(`Carregados ${this.points.length} pontos do CSV`)
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number 
    {
        const R = 6371 // Raio da Terra em km
        const dLat = this.deg2rad(lat2 - lat1)
        const dLon = this.deg2rad(lon2 - lon1)
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    private deg2rad(deg: number): number 
    {
        return deg * (Math.PI / 180)
    }

    private selectConcentrators(): Point[] 
    {
        const selected: Point[] = []
        const availablePoints = [...this.points]
        
        // Primeiro concentrador - ponto mais ao centro geograficamente
        const avgLat = availablePoints.reduce((sum, p) => sum + p.latitude, 0) / availablePoints.length
        const avgLon = availablePoints.reduce((sum, p) => sum + p.longitude, 0) / availablePoints.length
        
        let firstConcentrator = availablePoints[0]
        let minDistanceToCenter = this.calculateDistance(avgLat, avgLon, firstConcentrator.latitude, firstConcentrator.longitude)
        
        for (const point of availablePoints) 
        {
            const distance = this.calculateDistance(avgLat, avgLon, point.latitude, point.longitude)
            if (distance < minDistanceToCenter) 
            {
                minDistanceToCenter = distance
                firstConcentrator = point
            }
        }
        
        selected.push(firstConcentrator)
        availablePoints.splice(availablePoints.indexOf(firstConcentrator), 1)
        
        // Selecionar os outros 11 concentradores mantendo distância mínima
        while (selected.length < 12) 
        {
            let bestCandidate = availablePoints[0]
            let maxMinDistance = 0
            
            for (const candidate of availablePoints) 
            {
                let minDistanceToSelected = Infinity
                
                for (const selectedConc of selected) 
                {
                    const distance = this.calculateDistance(
                        candidate.latitude, candidate.longitude,
                        selectedConc.latitude, selectedConc.longitude
                    )
                    minDistanceToSelected = Math.min(minDistanceToSelected, distance)
                }
                
                if (minDistanceToSelected > maxMinDistance) 
                {
                    maxMinDistance = minDistanceToSelected
                    bestCandidate = candidate
                }
            }
            
            selected.push(bestCandidate)
            availablePoints.splice(availablePoints.indexOf(bestCandidate), 1)
        }
        
        return selected
    }

    private assignRelaysToConcentrators(concentratorPoints: Point[]): void 
    {
        const availableRelays = this.points.filter(p => concentratorPoints.indexOf(p) === -1)
        
        for (const concPoint of concentratorPoints) 
        {
            const concentratorData: ConcentratorData = {
                id: concPoint.id,
                point: concPoint,
                relays: []
            }
            
            // Calcular distâncias de todos os relés disponíveis para este concentrador
            const relayDistances = availableRelays
                .filter(relay => !this.isRelayAssigned(relay))
                .map(relay => ({
                    relay,
                    distance: this.calculateDistance(
                        concPoint.latitude, concPoint.longitude,
                        relay.latitude, relay.longitude
                    )
                }))
                .sort((a, b) => a.distance - b.distance)
            
            // Pegar até 200 relés mais próximos
            const maxRelays = Math.min(200, relayDistances.length)
            for (let i = 0; i < maxRelays; i++) 
            {
                concentratorData.relays.push(relayDistances[i].relay)
            }
            
            this.concentrators.push(concentratorData)
        }
    }

    private isRelayAssigned(relay: Point): boolean 
    {
        for (const conc of this.concentrators) 
        {
            if (conc.relays.indexOf(relay) !== -1) 
            {
                return true
            }
        }
        return false
    }

    public generateData(): void 
    {
        if (existsSync(this.dataFile)) 
        {
            console.log('Dados já existem, carregando do arquivo...')
            this.loadExistingData()
            return
        }
        
        console.log('Gerando novos dados...')
        
        const concentratorPoints = this.selectConcentrators()
        console.log(`Selecionados ${concentratorPoints.length} concentradores`)
        
        this.assignRelaysToConcentrators(concentratorPoints)
        
        const totalRelays = this.concentrators.reduce((sum, conc) => sum + conc.relays.length, 0)
        console.log(`Atribuídos ${totalRelays} relés aos concentradores`)
        
        this.saveData()
    }

    private loadExistingData(): void 
    {
        const data = JSON.parse(readFileSync(this.dataFile, 'utf-8'))
        this.concentrators = data.concentrators
    }

    private saveData(): void 
    {
        const data = {
            concentrators: this.concentrators,
            generatedAt: new Date().toISOString()
        }
        
        writeFileSync(this.dataFile, JSON.stringify(data, null, 2))
        console.log('Dados salvos em:', this.dataFile)
    }

    public getConcentrators(): ConcentratorData[] 
    {
        return this.concentrators
    }

    public getConcentratorById(id: number): ConcentratorData | undefined 
    {
        for (const conc of this.concentrators) 
        {
            if (conc.id === id) 
            {
                return conc
            }
        }
        return undefined
    }

    public getRelaysByConcentrator(concentratorId: number): Point[] 
    {
        const concentrator = this.getConcentratorById(concentratorId)
        return concentrator ? concentrator.relays : []
    }

    public getRelayDetails(concentratorId: number, relayId: number): Point | undefined 
    {
        const concentrator = this.getConcentratorById(concentratorId)
        if (!concentrator) return undefined
        
        for (const relay of concentrator.relays) 
        {
            if (relay.id === relayId) 
            {
                return relay
            }
        }
        return undefined
    }
}

export default DataProcessor