import {
    EmotionalState,
    RevelationDynamic,
    NarrativePressure
} from '../../../prisma/generated/client_final'

export interface ClimateConfig {
    emotionalState: EmotionalState
    revelationDynamic: RevelationDynamic
    narrativePressure: NarrativePressure
}

export interface GuardRailRules {
    allowedRevelations: RevelationDynamic[]
    allowedPressures: NarrativePressure[]
}

export const VALID_COMBINATIONS: Record<EmotionalState, GuardRailRules> = {
    CURIOSITY: {
        allowedRevelations: [RevelationDynamic.PROGRESSIVE, RevelationDynamic.FRAGMENTS],
        allowedPressures: [NarrativePressure.SLOW, NarrativePressure.FLUID]
    },
    THREAT: {
        allowedRevelations: [RevelationDynamic.PROGRESSIVE, RevelationDynamic.HIDDEN],
        allowedPressures: [NarrativePressure.FLUID, NarrativePressure.FAST]
    },
    FASCINATION: {
        allowedRevelations: [RevelationDynamic.PROGRESSIVE, RevelationDynamic.FRAGMENTS, RevelationDynamic.EARLY],
        allowedPressures: [NarrativePressure.SLOW, NarrativePressure.FLUID]
    },
    CONFRONTATION: {
        allowedRevelations: [RevelationDynamic.PROGRESSIVE, RevelationDynamic.EARLY],
        allowedPressures: [NarrativePressure.FLUID, NarrativePressure.FAST]
    },
    DARK_INSPIRATION: {
        allowedRevelations: [RevelationDynamic.PROGRESSIVE, RevelationDynamic.HIDDEN],
        allowedPressures: [NarrativePressure.SLOW, NarrativePressure.FLUID]
    }
}

export function validateClimateConfiguration(config: Partial<ClimateConfig>) {
    const state = config.emotionalState || EmotionalState.CURIOSITY
    const rules = VALID_COMBINATIONS[state]

    const errors: string[] = []

    if (config.revelationDynamic && !rules.allowedRevelations.includes(config.revelationDynamic)) {
        errors.push(`Revelação "${config.revelationDynamic}" não é recomendada para o estado "${state}"`)
    }

    if (config.narrativePressure && !rules.allowedPressures.includes(config.narrativePressure)) {
        errors.push(`Pressão "${config.narrativePressure}" não é recomendada para o estado "${state}"`)
    }

    return {
        valid: errors.length === 0,
        errors,
        corrected: getCorrectedConfig(config)
    }
}

export function getCorrectedConfig(config: Partial<ClimateConfig>): ClimateConfig {
    const state = config.emotionalState || EmotionalState.CURIOSITY
    const rules = VALID_COMBINATIONS[state]

    return {
        emotionalState: state,
        revelationDynamic: config.revelationDynamic && rules.allowedRevelations.includes(config.revelationDynamic)
            ? config.revelationDynamic
            : rules.allowedRevelations[0],
        narrativePressure: config.narrativePressure && rules.allowedPressures.includes(config.narrativePressure)
            ? config.narrativePressure
            : rules.allowedPressures[0]
    }
}
