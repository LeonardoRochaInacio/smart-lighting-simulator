export interface CommandParameters {
    percentage?: number
    onTime?: string
    offTime?: string
    // Parâmetros para set_scheduled_switch_time
    turn_on_time?: string
    turn_off_time?: string
    // Parâmetros para setup_dimmer
    lighting_up_start_time?: string
    lighting_up_duration_in_minutes?: number
    lighting_up_final_value?: number
    lighting_down_start_time?: string
    lighting_down_duration_in_minutes?: number
    lighting_down_final_value?: number
    // Parâmetros para set_dimmer_value
    dimmer_manual_value?: number
}