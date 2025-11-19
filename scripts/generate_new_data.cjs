const fs = require('fs');
const path = require('path');

// Função para calcular número ótimo de concentradores
function calculateOptimalConcentrators(totalPoints, minLcusPerConcentrator = 450, maxLcusPerConcentrator = 500) {
    // Descontar alguns pontos que serão usados como concentradores
    const availableLcus = totalPoints - 20; // Estimativa: 20 concentradores máximo
    
    // Calcular número ótimo visando ~475 LCUs por concentrador
    const targetLcusPerConcentrator = 475;
    let optimalConcentrators = Math.ceil(availableLcus / targetLcusPerConcentrator);
    
    // Verificar se está dentro dos limites
    const avgLcusPerConcentrator = availableLcus / optimalConcentrators;
    
    if (avgLcusPerConcentrator > maxLcusPerConcentrator) {
        optimalConcentrators = Math.ceil(availableLcus / maxLcusPerConcentrator);
    } else if (avgLcusPerConcentrator < minLcusPerConcentrator) {
        optimalConcentrators = Math.ceil(availableLcus / minLcusPerConcentrator);
    }
    
    return optimalConcentrators;
}

// Função para calcular distância entre dois pontos (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const deltaLat = (lat2 - lat1) * Math.PI / 180;
    const deltaLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}

// Carregar pontos do CSV
function loadPointsFromCSV(filepath) {
    console.log('🔄 Carregando dados do CSV...');
    
    const csvContent = fs.readFileSync(filepath, 'utf-8');
    const lines = csvContent.split('\n');
    
    const points = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(';');
        
        try {
            const fid = parseInt(values[1]);
            const lat = parseFloat(values[21].replace(',', '.'));
            const lon = parseFloat(values[22].replace(',', '.'));
            const lampType = values[2] || 'LED';
            const power = parseInt(values[3]) || 80;
            const area = values[19] || 'Urbano';
            
            if (!isNaN(fid) && !isNaN(lat) && !isNaN(lon)) {
                points.push({
                    id: fid,
                    latitude: lat,
                    longitude: lon,
                    type: lampType,
                    power: power,
                    area: area
                });
            }
        } catch (error) {
            // Ignorar linhas com erro
            continue;
        }
    }
    
    console.log(`✅ ${points.length} pontos carregados do CSV`);
    return points;
}

// Selecionar concentradores com melhor distribuição geográfica
function selectConcentrators(points, numConcentrators = null) {
    // Se não especificado, calcular automaticamente
    if (numConcentrators === null) {
        numConcentrators = calculateOptimalConcentrators(points.length);
    }
    
    console.log(`🎯 Calculando ${numConcentrators} concentradores para ${points.length} pontos...`);
    console.log(`📊 Média estimada: ${((points.length - numConcentrators) / numConcentrators).toFixed(1)} LCUs por concentrador`);
    
    // Calcular centro geográfico
    const centerLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
    const centerLon = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
    
    // Usar algoritmo de k-means++ para melhor distribuição
    const concentrators = [];
    const selectedIds = new Set();
    
    // Primeiro concentrador: mais central
    const centerPoint = points.reduce((closest, point) => {
        const distToCenter = calculateDistance(centerLat, centerLon, point.latitude, point.longitude);
        const closestDist = calculateDistance(centerLat, centerLon, closest.latitude, closest.longitude);
        return distToCenter < closestDist ? point : closest;
    });
    
    concentrators.push(centerPoint);
    selectedIds.add(centerPoint.id);
    
    // Demais concentradores: maximizar distância dos já selecionados
    for (let i = 0; i < numConcentrators - 1; i++) {
        const candidates = points.filter(p => !selectedIds.has(p.id));
        
        if (candidates.length === 0) break;
        
        // Para cada candidato, calcular a distância mínima para concentradores existentes
        let bestCandidate = null;
        let maxMinDistance = 0;
        
        for (const candidate of candidates) {
            const minDistance = Math.min(...concentrators.map(conc => 
                calculateDistance(candidate.latitude, candidate.longitude, conc.latitude, conc.longitude)
            ));
            
            if (minDistance > maxMinDistance) {
                maxMinDistance = minDistance;
                bestCandidate = candidate;
            }
        }
        
        if (bestCandidate) {
            concentrators.push(bestCandidate);
            selectedIds.add(bestCandidate.id);
        }
    }
    
    console.log(`📍 Centro geográfico: ${centerLat.toFixed(5)}, ${centerLon.toFixed(5)}`);
    return concentrators;
}
// Atribuir relés aos concentradores com melhor distribuição geográfica
function assignRelaysToConcentrators(points, concentrators) {
    const concentratorIds = new Set(concentrators.map(c => c.id));
    const availablePoints = points.filter(p => !concentratorIds.has(p.id));
    
    console.log(`🔗 Atribuindo ${availablePoints.length} LCUs para ${concentrators.length} concentradores...`);
    
    // Primeira passagem: atribuir cada LCU ao concentrador mais próximo
    const concentratorAssignments = {};
    concentrators.forEach(c => {
        concentratorAssignments[c.id] = [];
    });
    
    for (const point of availablePoints) {
        // Encontrar concentrador mais próximo
        let closestConcentrator = concentrators[0];
        let minDistance = calculateDistance(
            point.latitude, point.longitude,
            closestConcentrator.latitude, closestConcentrator.longitude
        );
        
        for (const concentrator of concentrators) {
            const distance = calculateDistance(
                point.latitude, point.longitude,
                concentrator.latitude, concentrator.longitude
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestConcentrator = concentrator;
            }
        }
        
        concentratorAssignments[closestConcentrator.id].push({
            id: point.id,
            latitude: point.latitude,
            longitude: point.longitude,
            type: point.type,
            power: point.power,
            area: point.area,
            distance: minDistance
        });
    }
    
    // Segunda passagem: balancear cargas (limitar a 500 LCUs por concentrador)
    const maxLcusPerConcentrator = 500;
    const overloaded = {};
    
    for (const [concId, relays] of Object.entries(concentratorAssignments)) {
        if (relays.length > maxLcusPerConcentrator) {
            // Ordenar por distância e manter apenas os mais próximos
            relays.sort((a, b) => a.distance - b.distance);
            overloaded[concId] = relays.slice(maxLcusPerConcentrator);
            concentratorAssignments[concId] = relays.slice(0, maxLcusPerConcentrator);
        }
    }
    
    // Redistribuir LCUs excedentes
    for (const [concId, excessRelays] of Object.entries(overloaded)) {
        for (const relay of excessRelays) {
            // Encontrar concentrador com menor carga
            let bestConcentrator = null;
            let bestDistance = Infinity;
            
            for (const concentrator of concentrators) {
                if (concentratorAssignments[concentrator.id].length < maxLcusPerConcentrator) {
                    const distance = calculateDistance(
                        relay.latitude, relay.longitude,
                        concentrator.latitude, concentrator.longitude
                    );
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestConcentrator = concentrator;
                    }
                }
            }
            
            if (bestConcentrator) {
                relay.distance = bestDistance;
                concentratorAssignments[bestConcentrator.id].push(relay);
            }
        }
    }
    
    // Montar resultado final
    const result = { concentrators: [] };
    
    for (const concentrator of concentrators) {
        const relays = concentratorAssignments[concentrator.id].map(relay => {
            const { distance, ...cleanRelay } = relay;
            return cleanRelay;
        });
        
        result.concentrators.push({
            id: concentrator.id,
            point: {
                id: concentrator.id,
                latitude: concentrator.latitude,
                longitude: concentrator.longitude,
                type: concentrator.type,
                power: concentrator.power,
                area: concentrator.area
            },
            relays: relays
        });
    }
    
    return result;
}

// Função principal
function main() {
    console.log('🚀 Iniciando geração de novo generated_data.json\n');
    
    const csvPath = path.join(__dirname, '..', 'assets', 'points.csv');
    const outputPath = path.join(__dirname, '..', 'assets', 'generated_data.json');
    
    // Carregar pontos do CSV
    const points = loadPointsFromCSV(csvPath);
    
    if (points.length < 10) {
        console.log('❌ Erro: Não há pontos suficientes para criar concentradores');
        return;
    }
    
    // Calcular número ótimo de concentradores
    const numConcentrators = calculateOptimalConcentrators(points.length);
    console.log(`📊 Número ótimo de concentradores calculado: ${numConcentrators}`);
    
    // Selecionar concentradores
    console.log('\n🎯 Selecionando concentradores com distribuição geográfica otimizada...');
    const concentrators = selectConcentrators(points, numConcentrators);
    console.log(`✅ ${concentrators.length} concentradores selecionados`);
    
    // Exibir concentradores selecionados
    console.log('\n📍 Concentradores selecionados:');
    concentrators.forEach((c, i) => {
        console.log(`  ${(i+1).toString().padStart(2)}. ID: ${c.id.toString().padStart(7)} - Lat: ${c.latitude.toFixed(5)}, Lon: ${c.longitude.toFixed(5)}`);
    });
    
    // Atribuir relés
    console.log('\n🔗 Atribuindo relés aos concentradores com balanceamento de carga...');
    const result = assignRelaysToConcentrators(points, concentrators);
    
    // Estatísticas detalhadas
    const totalRelays = result.concentrators.reduce((sum, c) => sum + c.relays.length, 0);
    console.log(`\n📊 Estatísticas finais:`);
    console.log(`  • Total de concentradores: ${result.concentrators.length}`);
    console.log(`  • Total de relés atribuídos: ${totalRelays}`);
    console.log(`  • Pontos não utilizados: ${points.length - concentrators.length - totalRelays}`);
    console.log(`  • Média de LCUs por concentrador: ${(totalRelays / concentrators.length).toFixed(1)}`);
    
    // Distribuição detalhada
    console.log(`\n🏗️ Distribuição de relés por concentrador:`);
    result.concentrators.forEach((c, i) => {
        const numRelays = c.relays.length;
        const status = (numRelays >= 450 && numRelays <= 500) ? '✅' : 
                       (numRelays > 500) ? '⚠️' : '📊';
        console.log(`  ${status} Concentrador ${(i+1).toString().padStart(2)} (ID: ${c.id.toString().padStart(7)}): ${numRelays.toString().padStart(3)} relés`);
    });
    
    // Análise de distribuição
    const withinRange = result.concentrators.filter(c => c.relays.length >= 450 && c.relays.length <= 500).length;
    const overLimit = result.concentrators.filter(c => c.relays.length > 500).length;
    
    console.log(`\n📈 Análise de distribuição:`);
    console.log(`  • Concentradores na faixa ideal (450-500): ${withinRange}/${concentrators.length}`);
    console.log(`  • Concentradores acima do limite (>500): ${overLimit}/${concentrators.length}`);
    
    // Salvar resultado
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    
    console.log(`\n✅ Arquivo salvo em: ${outputPath}`);
    console.log('🌟 Geração concluída com sucesso!');
}

// Executar função principal
if (require.main === module) {
    main();
}

module.exports = {
    calculateOptimalConcentrators,
    calculateDistance,
    loadPointsFromCSV,
    selectConcentrators,
    assignRelaysToConcentrators,
    main
};