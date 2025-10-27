export interface ConcentratorDetails 
{
    id: number
    label: string
    lat: number
    lng: number
    address: string
    lastReadings: string
    hardwareVersion: string
    softwareVersion: string
    voltage: number
    statusConnection: string
    signal: number
    ip: string
    totalRelays: number
    connectionType: string
    connectedSince: string
    disconnectedSince: string
    installationDate: string
    status: string
}

export interface ConcentratorSummary 
{
    id: string
    label: string
    lat: string
    lng: string
    status: string
}

export interface RelayDetails 
{
    idRelay: number
    idConcentrator: number
    sector?: number
    isOn: boolean
    status: string
    totalPower: number
    numberOfLights: number
    version: number
    installationDate: string
    voltage: number
    current: number
    activePower: number
    frequency: string
    ambientLight: number
    signal: number
    latitude: number
    longitude: number
    label: string
    failureDetected: string
    programmingHour: boolean
    hourProgrammingValue: string
    dimmerProgramming: boolean
    dimmerProgrammingValue: string
    dimmerPresent: boolean
    lightSensorPresent: boolean
    temperatureSensorPresent: boolean
    lightingTime: string
    shutdownTime: string
    timeOn: string
}

export interface RelaySummary 
{
    idRelay: string
    etiqueta: string
    idSimcon: string
    lat: string
    lng: string
    status: string
    type: string
}

export interface PaginatedResponse<T> 
{
    data: T[]
    total: number
    offset: number
    limit: number
    success: boolean
    elapsedTime: string
    totalRetornado: number
}

export interface CommandRequest 
{
    command: string
    concentratorId: number
    relayId: number
    parameters?: { [key: string]: any }
}

export const RelayStatus = {
    LIGHT_ON_DAY: '0001',           // LUMINÁRIA acesa durante o dia
    LIGHT_OFF_NIGHT: '0010',        // LUMINÁRIA apagada durante a noite
    POWER_DROP: '0011',             // LUMINÁRIA com queda de potência
    FAULT_DEFECT: '0100',           // LUMINÁRIA com falha e defeito
    RELAY_ON: '0101',               // Luminária Ligado
    RELAY_OFF: '0110',              // Luminária Desligado
    DIMMED: '0111',                 // Luminária Dimerizado
    NO_COMMUNICATION: '1000',       // relé sem comunicação
    NO_READINGS: '1001',            // relé sem leituras coletadas desde a instalação
    LOW_VOLTAGE: '1010',            // REDE em tensão abaixo de 190V
    HIGH_VOLTAGE: '1011'            // REDE em tensão alta > 264V
} as const

export const ConcentratorStatus = {
    OFFLINE_30MIN: '0001',          // concentrador offline, sem conexão (30+ minutos)
    OFFLINE_60MIN: '0010',          // concentrador offline, sem conexão (60+ minutos)
    ONLINE_CHIP: '0011',            // concentrador Online com internet do Chip
    ONLINE_CABLE: '0101',           // concentrador online com internet cabeada
    OFFLINE: '0110',                // concentrador Offline
    NEVER_CONNECTED: '0111'         // concentrador Cadastrado mas nunca ligado
} as const

export const Commands = {
    TURN_LIGHT_ON: 'turn_light_on',
    TURN_LIGHT_OFF: 'turn_light_off',
    ENABLE_DIMMER: 'enable_dimmer',
    DISABLE_DIMMER: 'disable_dimmer',
    PROGRAM_DIMMER_PERCENTAGE: 'program_dimmer_percentage',
    DISABLE_LIGHT_SENSOR: 'disable_light_sensor',
    ENABLE_LIGHT_TIME_PROGRAM: 'enable_light_time_program',
    SETUP_LIGHT_TIME_PROGRAM: 'setup_light_time_program'
} as const