import { Style, Climate, Character, ShortFormat } from '../../../prisma/generated/client_final';
import { calculateSceneParams } from './scene-calculator';

export interface ScriptwriterPayload {
    premise: string;

    style: {
        name: string;
        hookType: string;           // Do Style.hookType
        hookExample?: string;       // Do Style.hookExample
        ctaType: string;            // Do Style.ctaType
        ctaExample?: string;        // Do Style.ctaExample
        scriptFunction?: string;    // Do Style.scriptFunction
        narratorPosture?: string;   // Do Style.narratorPosture
        contentComplexity?: string; // Do Style.contentComplexity
        visualPrompt: string;       // Do Style.visualPromptBase
        scriptInstructions: string; // Do Style.advancedInstructions
    };

    climate: {
        name: string;
        emotionalState: string;       // Do Climate.emotionalState
        revelationDynamic: string;    // Do Climate.revelationDynamic
        narrativePressure: string;    // Do Climate.narrativePressure
        customInstructions: string;   // Do Climate.promptFragment
        behaviorPreview: string;      // Do Climate.behaviorPreview
    };

    constraints: {
        format: string;               // SHORT | REEL | LONG | YOUTUBE
        maxScenes: number;            // Calculado automaticamente
        avgSceneDuration: number;     // Calculado automaticamente
        totalDuration: number;        // Calculado automaticamente
        isOverridden: boolean;        // Se usuário alterou manualmente
    };

    characters: Array<{
        name: string;
        description: string;
        visualPrompt: string;
        role?: string;
    }>;
}

/**
 * Constrói o payload estruturado para o Scriptwriter.
 */
export function buildScriptwriterPayload(params: {
    premise: string;
    style: any;          // Usando any pois Style no Prisma pode ter campos opcionais
    climate: any;        // Usando any pois Climate no Prisma pode ter campos opcionais
    format: ShortFormat;
    characters?: any[];
    overrides?: {
        maxScenes?: number;
        avgSceneDuration?: number;
    };
}): ScriptwriterPayload {
    const { premise, style, climate, format, characters = [], overrides } = params;

    // 1. Validar campos obrigatórios que o Scriptwriter precisa
    if (!style.hookType) {
        throw new Error(`Style "${style.name}" não possui hookType definido.`);
    }
    if (!style.ctaType) {
        throw new Error(`Style "${style.name}" não possui ctaType definido.`);
    }
    if (!climate.emotionalState) {
        throw new Error(`Climate "${climate.name}" não possui emotionalState definido.`);
    }

    // 2. Calcular constraints
    const calculated = calculateSceneParams(format, climate.narrativePressure);

    const isOverridden = !!(overrides?.maxScenes || overrides?.avgSceneDuration);

    const constraints = {
        format,
        maxScenes: overrides?.maxScenes ?? calculated.maxScenes,
        avgSceneDuration: overrides?.avgSceneDuration ?? calculated.avgSceneDuration,
        totalDuration: (overrides?.maxScenes ?? calculated.maxScenes) * (overrides?.avgSceneDuration ?? calculated.avgSceneDuration),
        isOverridden
    };

    // 3. Montar o payload final
    return {
        premise,
        style: {
            name: style.name,
            hookType: style.hookType,
            hookExample: style.hookExample,
            ctaType: style.ctaType,
            ctaExample: style.ctaExample,
            scriptFunction: style.scriptFunction,
            narratorPosture: style.narratorPosture,
            contentComplexity: style.contentComplexity,
            visualPrompt: style.visualPromptBase || '',
            scriptInstructions: style.advancedInstructions || ''
        },
        climate: {
            name: climate.name,
            emotionalState: climate.emotionalState,
            revelationDynamic: climate.revelationDynamic,
            narrativePressure: climate.narrativePressure,
            customInstructions: climate.promptFragment || '',
            behaviorPreview: climate.behaviorPreview || ''
        },
        constraints,
        characters: characters.map(c => ({
            name: c.name,
            description: c.description || '',
            visualPrompt: c.promptDescription || '',
            role: c.role || 'character'
        }))
    };
}
