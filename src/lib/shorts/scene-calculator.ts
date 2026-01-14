import { ShortFormat, NarrativePressure } from '../../../prisma/generated/client_final';

// Configuração base por formato
export const FORMAT_CONFIG = {
    SHORT: {
        minDuration: 15,
        maxDuration: 60,
        defaultDuration: 30,
        baseScenes: 4,
        minSceneDuration: 3,
        maxSceneDuration: 10,
        defaultSceneDuration: 5
    },
    REEL: {
        minDuration: 30,
        maxDuration: 90,
        defaultDuration: 60,
        baseScenes: 6,
        minSceneDuration: 5,
        maxSceneDuration: 12,
        defaultSceneDuration: 8
    },
    LONG: {
        minDuration: 60,
        maxDuration: 180,
        defaultDuration: 120,
        baseScenes: 10,
        minSceneDuration: 8,
        maxSceneDuration: 15,
        defaultSceneDuration: 10
    },
    YOUTUBE: {
        minDuration: 180,
        maxDuration: 600,
        defaultDuration: 300,
        baseScenes: 20,
        minSceneDuration: 10,
        maxSceneDuration: 20,
        defaultSceneDuration: 15
    }
} as const;

// Multiplicador baseado na pressão narrativa do Clima
export const PRESSURE_MULTIPLIER: Record<NarrativePressure, number> = {
    SLOW: 0.7,    // Menos cenas, mais longas (contemplativo)
    FLUID: 1.0,   // Padrão
    FAST: 1.4     // Mais cenas, mais curtas (urgente)
} as const;

export interface SceneCalculation {
    maxScenes: number;
    avgSceneDuration: number;
    totalDuration: number;
    formatConfig: typeof FORMAT_CONFIG[keyof typeof FORMAT_CONFIG];
}

/**
 * Calcula os parâmetros de cena com base no formato e na pressão narrativa do clima.
 */
export function calculateSceneParams(
    format: ShortFormat,
    pressure: NarrativePressure = 'FLUID'
): SceneCalculation {
    const config = FORMAT_CONFIG[format];
    const multiplier = PRESSURE_MULTIPLIER[pressure];

    // Número base de cenas ajustado pela pressão
    let maxScenes = Math.round(config.baseScenes * multiplier);

    // Duração média por cena (usamos o padrão do formato)
    const avgSceneDuration = config.defaultSceneDuration;

    // Duração total estimada
    let totalDuration = maxScenes * avgSceneDuration;

    // Ajustar se total exceder limites do formato
    if (totalDuration > config.maxDuration) {
        // Se exceder, reduzimos o número de cenas para caber no máximo
        maxScenes = Math.floor(config.maxDuration / avgSceneDuration);
        totalDuration = maxScenes * avgSceneDuration;
    } else if (totalDuration < config.minDuration) {
        // Se for menor que o mínimo, aumentamos proporcionalmente
        maxScenes = Math.ceil(config.minDuration / avgSceneDuration);
        totalDuration = maxScenes * avgSceneDuration;
    }

    return {
        maxScenes: Math.max(1, maxScenes),
        avgSceneDuration,
        totalDuration,
        formatConfig: config
    };
}

/**
 * Valida se valores manuais estão dentro dos limites permitidos para o formato.
 */
export function validateOverrides(
    format: ShortFormat,
    overrides: { maxScenes?: number; avgSceneDuration?: number }
): { isValid: boolean; warnings: string[] } {
    const config = FORMAT_CONFIG[format];
    const warnings: string[] = [];

    if (overrides.maxScenes) {
        const minScenes = 1;
        const maxScenesLimit = config.baseScenes * 2.5; // Limite razoável
        if (overrides.maxScenes < minScenes || overrides.maxScenes > maxScenesLimit) {
            warnings.push(`Número de cenas sugerido para ${format} é entre ${minScenes} e ${Math.round(maxScenesLimit)}.`);
        }
    }

    if (overrides.avgSceneDuration) {
        if (overrides.avgSceneDuration < config.minSceneDuration || overrides.avgSceneDuration > config.maxSceneDuration) {
            warnings.push(`Duração por cena para ${format} deve estar entre ${config.minSceneDuration}s e ${config.maxSceneDuration}s.`);
        }
    }

    return {
        isValid: warnings.length === 0,
        warnings
    };
}

/**
 * Obtém os limites para exibição na UI.
 */
export function getFormatLimits(format: ShortFormat) {
    const config = FORMAT_CONFIG[format];

    return {
        scenes: {
            min: 1,
            max: Math.round(config.baseScenes * 2.5),
            suggested: config.baseScenes
        },
        duration: {
            min: config.minSceneDuration,
            max: config.maxSceneDuration,
            suggested: config.defaultSceneDuration
        }
    };
}
