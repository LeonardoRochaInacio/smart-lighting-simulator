# Exemplo de teste completo do comando POST

# Primeiro, vamos buscar um concentrador disponível
$concentrators = Invoke-RestMethod -Uri "http://localhost:3334/concentrators" -Method GET
$firstConcentrator = $concentrators.data[0]
Write-Host "Usando concentrador: $($firstConcentrator.id)"

# Buscar um relé deste concentrador
$relays = Invoke-RestMethod -Uri "http://localhost:3334/concentrators/$($firstConcentrator.id)/relays" -Method GET
$firstRelay = $relays.data[0]
Write-Host "Usando relé: $($firstRelay.idRelay)"

# Executar comando para ligar a luz
$body = @{
    command = "turn_light_on"
    concentratorId = [int]$firstConcentrator.id
    relayId = [int]$firstRelay.idRelay
} | ConvertTo-Json

Write-Host "Executando comando turn_light_on..."
$result = Invoke-RestMethod -Uri "http://localhost:3334/commands" -Method POST -Body $body -ContentType "application/json"
Write-Host "Resultado: $($result.message)"