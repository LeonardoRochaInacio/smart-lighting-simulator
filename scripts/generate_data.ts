import DataProcessor from './data_processor'

console.log('=== Smart Lighting Simulator - Inicialização de Dados ===')

try 
{
    const processor = new DataProcessor()
    processor.generateData()
    
    const concentrators = processor.getConcentrators()
    console.log('\n=== Resumo dos Dados Gerados ===')
    console.log(`Total de concentradores: ${concentrators.length}`)
    
    let totalRelays = 0
    concentrators.forEach((conc, index) => {
        console.log(`Concentrador ${index + 1}: ID ${conc.id} - ${conc.relays.length} relés`)
        totalRelays += conc.relays.length
    })
    
    console.log(`Total de relés: ${totalRelays}`)
    
    // Mostrar alguns exemplos de concentradores e relés
    if (concentrators.length > 0) 
    {
        const firstConc = concentrators[0]
        console.log('\n=== Exemplo de Concentrador ===')
        console.log(`ID: ${firstConc.id}`)
        console.log(`Localização: ${firstConc.point.latitude}, ${firstConc.point.longitude}`)
        console.log(`Relés conectados: ${firstConc.relays.length}`)
        
        if (firstConc.relays.length > 0) 
        {
            const firstRelay = firstConc.relays[0]
            console.log('\n=== Exemplo de Relé ===')
            console.log(`ID: ${firstRelay.id}`)
            console.log(`Concentrador: ${firstConc.id}`)
            console.log(`Localização: ${firstRelay.latitude}, ${firstRelay.longitude}`)
            console.log(`Potência: ${firstRelay.power}W`)
        }
    }
    
    console.log('\n✅ Dados gerados com sucesso!')
    console.log('📁 Arquivo salvo em: assets/generated_data.json')
    
} 
catch (error) 
{
    console.error('❌ Erro ao gerar dados:', error.message)
    process.exit(1)
}