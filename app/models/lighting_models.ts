import { ConcentratorDetails, RelayDetails, ConcentratorStatus, RelayStatus } from '#app/types/lighting_types'
import { DateTime } from 'luxon'

export class Concentrator 
{
    public id: number
    public label: string
    public lat: number
    public lng: number
    public address: string = ''
    public lastReadings: string
    public hardwareVersion: string
    public softwareVersion: string
    public voltage: number
    public statusConnection: string
    public signal: number
    public ip: string
    public totalRelays: number
    public connectionType: string
    public connectedSince: string
    public disconnectedSince: string
    public installationDate: string
    public status: string
    private relayIds: number[] = []

    constructor(id: number, lat: number, lng: number) 
    {
        this.id = id
        this.lat = lat
        this.lng = lng
        this.label = `CON_${id}`
        
        // Gerar dados simulados
        this.lastReadings = DateTime.now().minus({ minutes: Math.floor(Math.random() * 10) }).toISO() || ''
        this.hardwareVersion = `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}`
        this.softwareVersion = `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 100)}`
        this.voltage = Math.floor(Math.random() * 50) + 210 // 210-260V
        this.statusConnection = DateTime.now().minus({ minutes: Math.floor(Math.random() * 60) }).toISO() || ''
        this.signal = Math.floor(Math.random() * 30) - 70 // -70 to -40 dBm
        this.ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
        this.totalRelays = 0
        this.connectionType = Math.random() > 0.5 ? '4G' : '3G'
        this.connectedSince = DateTime.now().minus({ days: Math.floor(Math.random() * 30) }).toISO() || ''
        this.disconnectedSince = ''
        this.installationDate = DateTime.now().minus({ months: Math.floor(Math.random() * 24) + 1 }).toISO() || ''
        this.status = this.generateRandomStatus()
    }

    private generateRandomStatus(): string 
    {
        const statuses = [
            ConcentratorStatus.OFFLINE_30MIN,
            ConcentratorStatus.OFFLINE_60MIN,
            ConcentratorStatus.ONLINE_CHIP,
            ConcentratorStatus.ONLINE_CABLE,
            ConcentratorStatus.OFFLINE,
            ConcentratorStatus.NEVER_CONNECTED
        ]
        const weights = [0.05, 0.05, 0.4, 0.4, 0.05, 0.05] // Maior probabilidade para status online
        
        const random = Math.random()
        let cumulative = 0
        
        for (let i = 0; i < weights.length; i++) 
        {
            cumulative += weights[i]
            if (random <= cumulative) 
            {
                return statuses[i]
            }
        }
        
        return ConcentratorStatus.ONLINE_CHIP
    }

    public addRelay(relayId: number): void 
    {
        this.relayIds.push(relayId)
        this.totalRelays = this.relayIds.length
    }

    public getRelayIds(): number[] 
    {
        return [...this.relayIds]
    }

    public toDetails(): ConcentratorDetails 
    {
        return {
            id: this.id,
            label: this.label,
            lat: this.lat,
            lng: this.lng,
            address: this.address,
            lastReadings: this.lastReadings,
            hardwareVersion: this.hardwareVersion,
            softwareVersion: this.softwareVersion,
            voltage: this.voltage,
            statusConnection: this.statusConnection,
            signal: this.signal,
            ip: this.ip,
            totalRelays: this.totalRelays,
            connectionType: this.connectionType,
            connectedSince: this.connectedSince,
            disconnectedSince: this.disconnectedSince,
            installationDate: this.installationDate,
            status: this.status
        }
    }
}

export class Relay 
{
    public idRelay: number
    public idConcentrator: number
    public sector?: number
    public isOn: boolean
    public status: string
    public totalPower: number
    public numberOfLights: number = 1
    public version: number
    public installationDate: string
    public voltage: number
    public current: number
    public activePower: number
    public frequency: string = '60'
    public ambientLight: number
    public signal: number
    public latitude: number
    public longitude: number
    public label: string
    public failureDetected: string = ''
    public programmingHour: boolean
    public hourProgrammingValue: string
    public dimmerProgramming: boolean
    public dimmerProgrammingValue: string
    public dimmerPresent: boolean
    public lightSensorPresent: boolean
    public temperatureSensorPresent: boolean
    public lightingTime: string
    public shutdownTime: string
    public timeOn: string

    constructor(id: number, concentratorId: number, lat: number, lng: number, basePower: number = 160) 
    {
        this.idRelay = id
        this.idConcentrator = concentratorId
        this.latitude = lat
        this.longitude = lng
        this.label = `REL_${id}`
        
        // Gerar dados simulados baseados no horário atual
        const now = DateTime.now()
        const isNight = now.hour >= 18 || now.hour <= 6
        
        this.isOn = Math.random() > 0.3 ? isNight : !isNight // 70% chance de estar correto
        this.status = this.generateRandomStatus(isNight)
        
        this.voltage = Math.floor(Math.random() * 40) + 200 // 200-240V
        this.current = Math.floor(Math.random() * 3) + 1 // 1-4A
        this.activePower = this.voltage * this.current
        this.totalPower = this.activePower + Math.floor(Math.random() * 20) // Perdas adicionais
        
        this.version = Math.floor(Math.random() * 10) + 1
        this.installationDate = DateTime.now().minus({ months: Math.floor(Math.random() * 36) + 1 }).toISO() || ''
        this.ambientLight = isNight ? Math.floor(Math.random() * 100) : Math.floor(Math.random() * 500) + 500
        this.signal = Math.floor(Math.random() * 40) - 80 // -80 to -40 dBm
        
        this.programmingHour = Math.random() > 0.5
        this.hourProgrammingValue = this.programmingHour ? '18:00,06:00' : ''
        this.dimmerProgramming = Math.random() > 0.7
        this.dimmerProgrammingValue = this.dimmerProgramming ? '80%' : ''
        this.dimmerPresent = Math.random() > 0.4
        this.lightSensorPresent = Math.random() > 0.2
        this.temperatureSensorPresent = Math.random() > 0.8
        
        this.lightingTime = isNight && this.isOn ? DateTime.now().minus({ hours: Math.floor(Math.random() * 12) }).toFormat('HH:mm:ss') : ''
        this.shutdownTime = !isNight && !this.isOn ? DateTime.now().minus({ hours: Math.floor(Math.random() * 12) }).toFormat('HH:mm:ss') : ''
        const hours = Math.floor(Math.random() * 12)
        const minutes = Math.floor(Math.random() * 60)
        const seconds = Math.floor(Math.random() * 60)
        const formatTime = (num: number): string => num < 10 ? '0' + num : num.toString()
        this.timeOn = isNight && this.isOn ? `${hours}:${formatTime(minutes)}:${formatTime(seconds)}` : '00:00:00'
        
        this.sector = Math.random() > 0.3 ? Math.floor(Math.random() * 10) + 1 : undefined
    }

    private generateRandomStatus(isNight: boolean): string 
    {
        const weights = {
            [RelayStatus.RELAY_ON]: isNight ? 0.6 : 0.1,
            [RelayStatus.RELAY_OFF]: isNight ? 0.15 : 0.6,
            [RelayStatus.LIGHT_ON_DAY]: isNight ? 0.05 : 0.1,
            [RelayStatus.LIGHT_OFF_NIGHT]: isNight ? 0.1 : 0.05,
            [RelayStatus.POWER_DROP]: 0.02,
            [RelayStatus.FAULT_DEFECT]: 0.02,
            [RelayStatus.DIMMED]: 0.03,
            [RelayStatus.NO_COMMUNICATION]: 0.01,
            [RelayStatus.NO_READINGS]: 0.01,
            [RelayStatus.LOW_VOLTAGE]: 0.005,
            [RelayStatus.HIGH_VOLTAGE]: 0.005
        }
        
        const random = Math.random()
        let cumulative = 0
        
        for (const status in weights) 
        {
            if (weights.hasOwnProperty(status)) 
            {
                cumulative += weights[status]
                if (random <= cumulative) 
                {
                    return status
                }
            }
        }
        
        return isNight ? RelayStatus.RELAY_ON : RelayStatus.RELAY_OFF
    }

    public toDetails(): RelayDetails 
    {
        return {
            idRelay: this.idRelay,
            idConcentrator: this.idConcentrator,
            sector: this.sector,
            isOn: this.isOn,
            status: this.status,
            totalPower: this.totalPower,
            numberOfLights: this.numberOfLights,
            version: this.version,
            installationDate: this.installationDate,
            voltage: this.voltage,
            current: this.current,
            activePower: this.activePower,
            frequency: this.frequency,
            ambientLight: this.ambientLight,
            signal: this.signal,
            latitude: this.latitude,
            longitude: this.longitude,
            label: this.label,
            failureDetected: this.failureDetected,
            programmingHour: this.programmingHour,
            hourProgrammingValue: this.hourProgrammingValue,
            dimmerProgramming: this.dimmerProgramming,
            dimmerProgrammingValue: this.dimmerProgrammingValue,
            dimmerPresent: this.dimmerPresent,
            lightSensorPresent: this.lightSensorPresent,
            temperatureSensorPresent: this.temperatureSensorPresent,
            lightingTime: this.lightingTime,
            shutdownTime: this.shutdownTime,
            timeOn: this.timeOn
        }
    }

    public executeCommand(command: string, parameters?: { [key: string]: any }): boolean 
    {
        const now = DateTime.now()
        
        switch (command) 
        {
            case 'turn_light_on':
                this.isOn = true
                this.status = RelayStatus.RELAY_ON
                this.lightingTime = now.toFormat('HH:mm:ss')
                return true
                
            case 'turn_light_off':
                this.isOn = false
                this.status = RelayStatus.RELAY_OFF
                this.shutdownTime = now.toFormat('HH:mm:ss')
                return true
                
            case 'enable_dimmer':
                if (this.dimmerPresent) 
                {
                    this.dimmerProgramming = true
                    this.status = RelayStatus.DIMMED
                    return true
                }
                return false
                
            case 'disable_dimmer':
                this.dimmerProgramming = false
                this.status = this.isOn ? RelayStatus.RELAY_ON : RelayStatus.RELAY_OFF
                return true
                
            case 'program_dimmer_percentage':
                if (this.dimmerPresent && parameters?.percentage) 
                {
                    this.dimmerProgrammingValue = `${parameters.percentage}%`
                    this.dimmerProgramming = true
                    return true
                }
                return false
                
            case 'disable_light_sensor':
                this.lightSensorPresent = false
                return true
                
            case 'enable_light_time_program':
                this.programmingHour = true
                return true
                
            case 'setup_light_time_program':
                if (parameters?.onTime && parameters?.offTime) 
                {
                    this.hourProgrammingValue = `${parameters.onTime},${parameters.offTime}`
                    this.programmingHour = true
                    return true
                }
                return false
                
            default:
                return false
        }
    }
}