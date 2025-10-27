# Exemplos de Teste da API Smart Lighting Simulator

## Testar com PowerShell (Windows)

### 1. Status do Sistema
```powershell
Invoke-RestMethod -Uri "http://localhost:3334/status" -Method GET
```

### 2. Listar Concentradores
```powershell
Invoke-RestMethod -Uri "http://localhost:3334/concentrators" -Method GET
```

### 3. Detalhes de um Concentrador
```powershell
Invoke-RestMethod -Uri "http://localhost:3334/concentrators/14136611/details" -Method GET
```

### 4. Listar Relés de um Concentrador
```powershell
Invoke-RestMethod -Uri "http://localhost:3334/concentrators/14136611/relays" -Method GET
```

### 5. Detalhes de um Relé
```powershell
Invoke-RestMethod -Uri "http://localhost:3334/concentrators/14136611/relays/14136401/details" -Method GET
```

### 6. Executar Comando - Ligar Luminária
```powershell
$body = @{
    command = "turn_light_on"
    concentratorId = 14136611
    relayId = 14136401
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3334/commands" -Method POST -Body $body -ContentType "application/json"
```

### 7. Executar Comando - Programar Dimmer
```powershell
$body = @{
    command = "program_dimmer_percentage"
    concentratorId = 14136611
    relayId = 14136401
    parameters = @{
        percentage = 75
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3334/commands" -Method POST -Body $body -ContentType "application/json"
```

### 8. Executar Comando - Programar Horário
```powershell
$body = @{
    command = "setup_light_time_program"
    concentratorId = 14136611
    relayId = 14136401
    parameters = @{
        onTime = "18:30"
        offTime = "06:00"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3334/commands" -Method POST -Body $body -ContentType "application/json"
```

## Testar com cURL (Linux/Mac/Windows)

### 1. Status do Sistema
```bash
curl http://localhost:3334/status
```

### 2. Listar Concentradores
```bash
curl http://localhost:3334/concentrators
```

### 3. Executar Comando
```bash
curl -X POST http://localhost:3334/commands \
  -H "Content-Type: application/json" \
  -d '{
    "command": "turn_light_on",
    "concentratorId": 14136611,
    "relayId": 14136401
  }'
```

## Endpoints de Compatibilidade

Todos os endpoints também funcionam com os aliases para compatibilidade:

- `GET /get_concentrators` (igual a `/concentrators`)
- `GET /get_concentrator_details/:id` (igual a `/concentrators/:id/details`)
- `GET /get_relays/:id` (igual a `/concentrators/:id/relays`)
- `GET /get_relay_details/:concentratorId/:relayId` (igual a `/concentrators/:concentratorId/relays/:relayId/details`)
- `POST /execute_command` (igual a `/commands`)

## Comandos Disponíveis

1. `turn_light_on` - Liga a luminária
2. `turn_light_off` - Desliga a luminária  
3. `enable_dimmer` - Habilita dimmerização
4. `disable_dimmer` - Desabilita dimmerização
5. `program_dimmer_percentage` - Programa percentual do dimmer (requer parameters.percentage)
6. `disable_light_sensor` - Desabilita sensor de luz
7. `enable_light_time_program` - Habilita programação horária
8. `setup_light_time_program` - Configura horários (requer parameters.onTime e parameters.offTime)

## Exemplo de Resposta de Sucesso

```json
{
    "success": true,
    "message": "Comando 'turn_light_on' executado com sucesso no relé 14136401 através do concentrador 14136611. Luminária foi ligada.",
    "timestamp": "2024-10-27T20:45:12.000Z",
    "commandDetails": {
        "command": "turn_light_on",
        "concentratorId": 14136611,
        "relayId": 14136401,
        "parameters": {}
    }
}
```

## IDs dos Concentradores Disponíveis

Para testar, use os seguintes IDs de concentradores (baseados nos dados gerados):
- 14136611
- 14138037  
- 14136459
- 14136436
- 14137712
- 14137318
- 14137422
- 14137498
- 14137649
- 14137340
- 14136629
- 14137289

Cada concentrador tem até 200 relés associados. Para descobrir os IDs dos relés, use o endpoint `/concentrators/:id/relays`.