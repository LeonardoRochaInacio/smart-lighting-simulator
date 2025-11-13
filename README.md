# Smart Lighting Simulator

Sistema simulador de iluminação inteligente que fornece APIs para gerenciamento de concentradores e relés de iluminação pública.

## ✅ Sistema Implementado com Sucesso!

### Características Implementadas:
- **12 Concentradores** distribuídos geograficamente (baseados em dados reais do CSV)
- **1681 Relés** distribuídos entre os concentradores (máximo 200 por concentrador)  
- **Simulação realista** de estados baseados em horário, sensores e programações
- **API REST completa** com todos os endpoints solicitados

### Dados Processados:
- ✅ Análise do arquivo `points.csv` com 1693 pontos reais
- ✅ Seleção inteligente de 12 concentradores geograficamente distribuídos
- ✅ Atribuição de relés aos concentradores mais próximos
- ✅ Geração de dados simulados realistas para todos os dispositivos

## Instalação e Uso

### 1. Instalar Dependências
```bash
npm install
```

### 2. Gerar Dados Iniciais
```bash
node scripts/generate_data.cjs
```

### 3. Iniciar o Servidor
```bash
npm run dev
```

**Servidor disponível em:** `http://localhost:3334`

## Endpoints Implementados

### ✅ Concentradores
- `GET /concentrators` - Lista todos os concentradores (paginado)
- `GET /concentrators/:id/details` - Detalhes completos do concentrador
- `GET /get_concentrators` - Alias para compatibilidade  
- `GET /get_concentrator_details/:id` - Alias para compatibilidade

### ✅ Relés  
- `GET /concentrators/:id/relays` - Lista relés do concentrador (paginado)
- `GET /concentrators/:concentratorId/relays/:relayId/details` - Detalhes completos do relé
- `GET /get_relays/:id` - Alias para compatibilidade
- `GET /get_relay_details/:concentratorId/:relayId` - Alias para compatibilidade

### ✅ Comandos
- `POST /commands` - Executa comandos nos relés através dos concentradores
- `POST /execute_command` - Alias para compatibilidade

### ✅ Sistema
- `GET /status` - Status do sistema
- `GET /test` - Endpoint de teste

## Comandos Disponíveis
- `turn_light_on` - Liga a luminária  
- `turn_light_off` - Desliga a luminária
- `enable_dimmer` - Habilita dimmerização
- `disable_dimmer` - Desabilita dimmerização
- `program_dimmer_percentage` - Programa percentual do dimmer
- `disable_light_sensor` - Desabilita sensor de luz
- `enable_light_time_program` - Habilita programação horária
- `setup_light_time_program` - Configura horários de liga/desliga

## Códigos de Status Implementados

### Relés:
- `0001` - Luminária acesa durante o dia
- `0010` - Luminária apagada durante a noite
- `0011` - Luminária com queda de potência  
- `0100` - Luminária com falha e defeito
- `0101` - Luminária Ligado ⭐ (mais comum à noite)
- `0110` - Luminária Desligado ⭐ (mais comum de dia)
- `0111` - Luminária Dimerizado
- `1000` - Relé sem comunicação
- `1001` - Relé sem leituras desde instalação
- `1010` - Rede com tensão baixa (<190V)
- `1011` - Rede com tensão alta (>264V)

### Concentradores:
- `0001` - Offline há 30+ minutos
- `0010` - Offline há 60+ minutos  
- `0011` - Online com internet 4G/3G ⭐ (mais comum)
- `0101` - Online com internet cabeada ⭐ (mais comum)
- `0110` - Offline
- `0111` - Cadastrado mas nunca conectado

## Simulação Inteligente Implementada

### 🌅 Ciclo Dia/Noite Automático
- Relés acendem automaticamente entre 18h-6h
- Estados ajustados conforme horário atual do sistema

### 📊 Dados Realistas Simulados  
- **Tensão:** 200-240V (variação realística)
- **Corrente:** 1-4A (baseada na potência das lâmpadas)
- **Potência:** 30-200W (conforme tipo de lâmpada)
- **Sinal RF:** -80 a -40 dBm (qualidade de sinal)
- **Luz ambiente:** Varia conforme dia/noite

### ⚙️ Funcionalidades Avançadas
- **80%** dos relés têm sensor de luz
- **50%** têm programação horária configurada  
- **30%** suportam dimmerização
- **20%** têm sensor de temperatura
- **2-5%** simulam falhas realísticas

## Estrutura dos Dados

### 📁 Arquivos Principais Criados:
- `scripts/data_processor.ts` - Processamento inteligente do CSV
- `scripts/generate_data.cjs` - Script de geração executável  
- `app/models/lighting_models.ts` - Modelos completos de Concentrador e Relé
- `app/services/lighting_service.ts` - Lógica de negócio e simulação
- `app/controllers/smart_lighting_simulator.ts` - Controlador da API
- `app/types/lighting_types.ts` - Interfaces TypeScript
- `assets/generated_data.json` - Dados processados e persistidos

## Integração com Agregador

✅ **Totalmente compatível** com o `smart-lighting-api-aggregator`
- Mesma estrutura de resposta JSON  
- Paginação padronizada
- Códigos de status idênticos
- Tempos de resposta simulados
- Aliases de endpoints para compatibilidade

## Teste do Sistema

O sistema está **funcionando perfeitamente**:
- ✅ Servidor iniciado com sucesso na porta 3334
- ✅ Dados gerados e carregados (12 concentradores, 1681 relés)
- ✅ Endpoints respondendo corretamente
- ✅ Simulação de estados funcionando
- ✅ Compatível com agregador de APIs

### Para testar:
```bash
docker exec -it microservice_s1 sh
```

## Docker compose build
```bash  
docker-compose up -d --build
```
