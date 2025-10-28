const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./assets/generated_data.json', 'utf-8'));

console.log('📍 Concentradores gerados:');
data.concentrators.forEach((c, i) => {
    console.log(`${i+1}. ID: ${c.id} - Lat: ${c.point.latitude.toFixed(5)}, Lon: ${c.point.longitude.toFixed(5)} - Relés: ${c.relays.length}`);
});

console.log(`\n📊 Total: ${data.concentrators.length} concentradores, ${data.concentrators.reduce((sum, c) => sum + c.relays.length, 0)} relés`);