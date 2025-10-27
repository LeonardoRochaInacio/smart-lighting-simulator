const fs = require('fs')
const path = require('path')

// Função para calcular distância entre dois pontos
function calculateDistance(lat1, lon1, lat2, lon2) 
{
    const R = 6371 // Raio da Terra em km
    const dLat = deg2rad(lat2 - lat1)
    const dLon = deg2rad(lon2 - lon1)
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function deg2rad(deg) 
{
    return deg * (Math.PI / 180)
}

// Carregar dados do CSV
const csvPath = path.join(__dirname, '../assets/points.csv')
const csvContent = fs.readFileSync(csvPath, 'utf-8')
const lines = csvContent.split('\n')

const points = []

// Processar CSV
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
            points.push({
                id: 14136400 + i,
                latitude,
                longitude,
                type,
                power,
                area
            })
        }
    }
}

console.log(`Carregados ${points.length} pontos do CSV`)

// Selecionar 12 concentradores
const concentrators = []

// Primeiro concentrador - ponto mais ao centro
const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length
const avgLon = points.reduce((sum, p) => sum + p.longitude, 0) / points.length

let firstConcentrator = points[0]
let minDistanceToCenter = calculateDistance(avgLat, avgLon, firstConcentrator.latitude, firstConcentrator.longitude)

for (const point of points) 
{
    const distance = calculateDistance(avgLat, avgLon, point.latitude, point.longitude)
    if (distance < minDistanceToCenter) 
    {
        minDistanceToCenter = distance
        firstConcentrator = point
    }
}

concentrators.push(firstConcentrator)
const availablePoints = points.filter(p => p.id !== firstConcentrator.id)

// Selecionar os outros 11 mantendo distância
while (concentrators.length < 12 && availablePoints.length > 0) 
{
    let bestCandidate = availablePoints[0]
    let maxMinDistance = 0
    
    for (const candidate of availablePoints) 
    {
        let minDistanceToSelected = Infinity
        
        for (const selectedConc of concentrators) 
        {
            const distance = calculateDistance(
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
    
    concentrators.push(bestCandidate)
    const index = availablePoints.findIndex(p => p.id === bestCandidate.id)
    if (index !== -1) 
    {
        availablePoints.splice(index, 1)
    }
}

console.log(`Selecionados ${concentrators.length} concentradores`)

// Atribuir relés aos concentradores
const concentratorData = []

for (const concPoint of concentrators) 
{
    const relayDistances = availablePoints
        .filter(relay => !isRelayAssigned(relay, concentratorData))
        .map(relay => ({
            relay,
            distance: calculateDistance(
                concPoint.latitude, concPoint.longitude,
                relay.latitude, relay.longitude
            )
        }))
        .sort((a, b) => a.distance - b.distance)
    
    const maxRelays = Math.min(200, relayDistances.length)
    const relays = []
    
    for (let i = 0; i < maxRelays; i++) 
    {
        relays.push(relayDistances[i].relay)
    }
    
    concentratorData.push({
        id: concPoint.id,
        point: concPoint,
        relays: relays
    })
}

function isRelayAssigned(relay, concentratorData) 
{
    for (const conc of concentratorData) 
    {
        for (const r of conc.relays) 
        {
            if (r.id === relay.id) return true
        }
    }
    return false
}

const totalRelays = concentratorData.reduce((sum, conc) => sum + conc.relays.length, 0)
console.log(`Atribuídos ${totalRelays} relés aos concentradores`)

// Salvar dados
const data = {
    concentrators: concentratorData,
    generatedAt: new Date().toISOString()
}

const outputPath = path.join(__dirname, '../assets/generated_data.json')
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

console.log('✅ Dados gerados com sucesso!')
console.log('📁 Arquivo salvo em:', outputPath)

// Mostrar resumo
concentratorData.forEach((conc, index) => {
    console.log(`Concentrador ${index + 1}: ID ${conc.id} - ${conc.relays.length} relés`)
})