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
    subSector?: number
    areaGroup?: number
    observation?: string
    isOn: boolean
    status: string
    totalPower: number
    numberOfLights: number
    version: number
    hardwareVersion: string
    installationDate: string
    voltage: number
    current: number
    activePower: number
    reactivePower: number
    apparentPower: number
    powerFactor: number
    activeEnergy: number
    frequency: string
    ambientLight: number
    signal: number
    latitude: number
    longitude: number
    label: string
    failureDetected: string
    lastDetectedFailure?: string
    lastDetectedFailureDate?: string
    switchType?: string
    defaultOnTime?: string
    defaultOffTime?: string
    firmwareVersion: string
    programmingHour: boolean
    hourProgrammingValue: string
    dimmerProgramming: boolean
    dimmerProgrammingValue: string
    dimmerPresent: boolean
    currentDimmerValue?: number
    
    // Agendamento de liga/desliga
    scheduledSwitchEnabled?: boolean
    scheduledTurnOnTime?: string   // Formato HH:MM
    scheduledTurnOffTime?: string  // Formato HH:MM
    
    // Configuração avançada de dimmer (usa dimmerProgramming)
    lightingUpStartTime?: string        // Formato HH:MM
    lightingUpDurationMinutes?: number  // Duração em minutos
    lightingUpFinalValue?: number       // Valor final 0-100%
    lightingDownStartTime?: string      // Formato HH:MM
    lightingDownDurationMinutes?: number // Duração em minutos
    lightingDownFinalValue?: number     // Valor final 0-100%
    
    // Valor manual do dimmer (undefined = não manual)
    dimmerManualValue?: number  // Valor manual 0-100%
    lightSensorPresent: boolean
    isLightSensorEnabled?: boolean
    gpsPresent?: boolean
    temperatureSensorPresent: boolean
    currentTemperatureValue?: number
    temperatureUnit?: string
    humiditySensorPresent?: boolean
    currentHumidityValue?: number
    humidityUnit?: string
    motionSensorPresent?: boolean
    motionLevel?: number
    motionLevelUnit?: string
    lastMotionDetectedTime?: string
    motionDetectedCount?: number
    lightingTime: string
    shutdownTime: string
    timeOn: string
    energyConsumption: number
    signal1Range?: string
    signal1Strength?: number
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
    ENABLE_LIGHT_SENSOR: 'enable_light_sensor',
    DISABLE_LIGHT_SENSOR: 'disable_light_sensor',
    ENABLE_LIGHT_TIME_PROGRAM: 'enable_light_time_program',
    DISABLE_LIGHT_TIME_PROGRAM: 'disable_light_time_program',
    SET_SCHEDULED_SWITCH_TIME: 'set_scheduled_switch_time',
    SETUP_DIMMER: 'setup_dimmer',
    SET_DIMMER_VALUE: 'set_dimmer_value'
} as const