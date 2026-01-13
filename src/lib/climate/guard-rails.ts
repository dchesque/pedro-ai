import {
    EmotionalState,
    RevelationDynamic,
    NarrativePressure,
    HookType,
    ClosingType
} from '../../../prisma/generated/client_final'

export interface ClimateConfig {
    emotionalState: EmotionalState
    revelationDynamic: RevelationDynamic
    narrativePressure: NarrativePressure
    hookType?: HookType
    closingType?: ClosingType
}

export interface GuardRailRules {
    allowedRevelations: RevelationDynamic[]
    allowedPressures: NarrativePressure[]
    forcedHook: HookType | null
    forcedClosing: ClosingType | null
}

export const VALID_COMBINATIONS: Record<EmotionalState, GuardRailRules> = {
    CURIOSITY: {
        allowedRevelations: [RevelationDynamic.PROGRESSIVE, RevelationDynamic.FRAGMENTS],
        allowedPressures: [NarrativePressure.SLOW, NarrativePressure.FLUID],
        forcedHook: null,
        forcedClosing: null
    },
    THREAT: {
        allowedRevelations: [RevelationDynamic.PROGRESSIVE, RevelationDynamic.HIDDEN],
        allowedPressures: [NarrativePressure.FLUID, NarrativePressure.FAST],
        forcedHook: HookType.SHOCK,
        forcedClosing: ClosingType.CTA_DIRECT
    },
    FASCINATION: {
        allowedRevelations: [RevelationDynamic.PROGRESSIVE, RevelationDynamic.FRAGMENTS, RevelationDynamic.EARLY],
        allowedPressures: [NarrativePressure.SLOW, NarrativePressure.FLUID],
        forcedHook: HookType.MYSTERY,
        forcedClosing: null
    },
    CONFRONTATION: {
        allowedRevelations: [RevelationDynamic.PROGRESSIVE, RevelationDynamic.EARLY],
        allowedPressures: [NarrativePressure.FLUID, NarrativePressure.FAST],
        forcedHook: HookType.CHALLENGE,
        forcedClosing: ClosingType.CHALLENGE
    },
    DARK_INSPIRATION: {
        allowedRevelations: [RevelationDynamic.PROGRESSIVE, RevelationDynamic.HIDDEN],
        allowedPressures: [NarrativePressure.SLOW, NarrativePressure.FLUID],
        forcedHook: HookType.STATEMENT,
        forcedClosing: ClosingType.REVELATION
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
            : rules.allowedPressures[0],
        hookType: rules.forcedHook || config.hookType || HookType.QUESTION,
        closingType: rules.forcedClosing || config.closingType || ClosingType.CTA_DIRECT
    }
}
