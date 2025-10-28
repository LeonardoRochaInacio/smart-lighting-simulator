const fs = require('fs');
const path = require('path');

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
    const header = lines[0].split(';');
    
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

// Selecionar concentradores equidistantes
function selectConcentrators(points, numConcentrators = 12) {
    console.log('🎯 Selecionando 12 concentradores equidistantes...');
    
    // Calcular centro geográfico
    const centerLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length;
    const centerLon = points.reduce((sum, p) => sum + p.longitude, 0) / points.length;
    
    console.log(`📍 Centro geográfico: ${centerLat.toFixed(5)}, ${centerLon.toFixed(5)}`);
    
    // Calcular raio aproximado da área
    const maxDistance = Math.max(...points.map(p => 
        calculateDistance(centerLat, centerLon, p.latitude, p.longitude)
    ));
    
    const concentrators = [];
    const selectedIds = new Set();
    
    // Primeiro concentrador no centro
    const centerPoint = points.reduce((closest, point) => {
        const distToCenter = calculateDistance(centerLat, centerLon, point.latitude, point.longitude);
        const closestDist = calculateDistance(centerLat, centerLon, closest.latitude, closest.longitude);
        return distToCenter < closestDist ? point : closest;
    });
    
    concentrators.push(centerPoint);
    selectedIds.add(centerPoint.id);
    
    // Selecionar os demais concentradores em um padrão radial
    const remaining = numConcentrators - 1;
    for (let i = 0; i < remaining; i++) {
        const angle = (2 * Math.PI * i) / remaining;
        const radius = maxDistance * 0.7; // 70% do raio máximo
        
        const targetLat = centerLat + (radius / 111.0) * Math.cos(angle); // 1° ≈ 111km
        const targetLon = centerLon + (radius / (111.0 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
        
        // Encontrar o ponto mais próximo da posição target que não foi selecionado
        const candidates = points.filter(p => !selectedIds.has(p.id));
        if (candidates.length > 0) {
            const bestPoint = candidates.reduce((closest, point) => {
                const distToTarget = calculateDistance(targetLat, targetLon, point.latitude, point.longitude);
                const closestDist = calculateDistance(targetLat, targetLon, closest.latitude, closest.longitude);
                return distToTarget < closestDist ? point : closest;
            });
            
            concentrators.push(bestPoint);
            selectedIds.add(bestPoint.id);
        }
    }
    
    console.log(`✅ ${concentrators.length} concentradores selecionados`);
    
    // Exibir concentradores selecionados
    console.log('\n📍 Concentradores selecionados:');
    concentrators.forEach((c, i) => {
        console.log(`  ${i + 1}. ID: ${c.id} - Lat: ${c.latitude.toFixed(5)}, Lon: ${c.longitude.toFixed(5)}`);
    });
    
    return concentrators;
}

// Atribuir relés aos concentradores
function assignRelaysToConcentrators(points, concentrators, maxRelaysPerConcentrator = 200) {
    console.log('\n🔗 Atribuindo relés aos concentradores...');
    
    const concentratorIds = new Set(concentrators.map(c => c.id));
    const availablePoints = points.filter(p => !concentratorIds.has(p.id));
    
    const result = {
        concentrators: []
    };
    
    const assignedRelayIds = new Set();
    
    for (const concentrator of concentrators) {
        // Calcular distâncias de todos os pontos disponíveis para este concentrador
        const distances = [];
        for (const point of availablePoints) {
            if (!assignedRelayIds.has(point.id)) {
                const dist = calculateDistance(
                    concentrator.latitude, concentrator.longitude,
                    point.latitude, point.longitude
                );
                distances.push({ distance: dist, point: point });
            }
        }
        
        // Ordenar por distância e pegar os mais próximos
        distances.sort((a, b) => a.distance - b.distance);
        
        // Atribuir até maxRelaysPerConcentrator relés mais próximos
        const relays = [];
        for (let i = 0; i < Math.min(distances.length, maxRelaysPerConcentrator); i++) {
            const { point } = distances[i];
            if (!assignedRelayIds.has(point.id)) {
                relays.push({
                    id: point.id,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    type: point.type,
                    power: point.power,
                    area: point.area
                });
                assignedRelayIds.add(point.id);
            }
        }
        
        const concentratorData = {
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
        };
        
        result.concentrators.push(concentratorData);
    }
    
    return result;
}

function main() {
    try {
        console.log('🚀 Iniciando geração de novo generated_data.json\n');
        
        // Carregar pontos do CSV
        const csvPath = path.join(__dirname, '..', 'assets', 'points.csv');
        const points = loadPointsFromCSV(csvPath);
        
        if (points.length < 12) {
            console.log('❌ Erro: Não há pontos suficientes para criar 12 concentradores');
            return;
        }
        
        // Selecionar concentradores
        const concentrators = selectConcentrators(points, 12);
        
        // Atribuir relés
        const result = assignRelaysToConcentrators(points, concentrators, 150); // Limitando a 150 por concentrador para melhor distribuição
        
        // Estatísticas
        const totalRelays = result.concentrators.reduce((sum, c) => sum + c.relays.length, 0);
        console.log('\n📊 Estatísticas:');
        console.log(`  • Total de concentradores: ${result.concentrators.length}`);
        console.log(`  • Total de relés: ${totalRelays}`);
        console.log(`  • Pontos não atribuídos: ${points.length - concentrators.length - totalRelays}`);
        
        // Distribuição de relés por concentrador
        console.log('\n🏗️ Distribuição de relés:');
        result.concentrators.forEach((c, i) => {
            console.log(`  • Concentrador ${i + 1} (ID: ${c.id}): ${c.relays.length} relés`);
        });
        
        // Salvar resultado
        const outputPath = path.join(__dirname, '..', 'assets', 'generated_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
        
        console.log(`\n✅ Arquivo salvo em: ${outputPath}`);
        console.log('🌟 Geração concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a geração:', error);
    }
}

main();