import { ShortFormat } from '../../prisma/generated/client_final';

// Re-export do enum para uso no frontend
export { ShortFormat };

// Labels amigáveis para o enum
export const FORMAT_LABELS: Record<ShortFormat, string> = {
    SHORT: 'Short (15-60s)',
    REEL: 'Reel (30-90s)',
    LONG: 'Long (60-180s)',
    YOUTUBE: 'YouTube (3-10min)'
};

// Descrições para tooltip/ajuda
export const FORMAT_DESCRIPTIONS: Record<ShortFormat, string> = {
    SHORT: 'Ideal para TikTok e Reels curtos. Conteúdo direto e impactante.',
    REEL: 'Formato padrão do Instagram. Permite desenvolvimento moderado.',
    LONG: 'YouTube Shorts. Mais espaço para narrativa completa.',
    YOUTUBE: 'Vídeo tradicional. Narrativa completa com múltiplos atos.'
};

// Interface para o formulário
export interface ScriptFormData {
    premise: string;
    title: string;
    styleId: string;
    climateId: string;
    format: ShortFormat;
    characterIds: string[];
    modelId?: string;

    // Modo avançado (opcional)
    advancedMode?: {
        enabled: boolean;
        maxScenes?: number;
        avgSceneDuration?: number;
    };
}

// Interface para parâmetros calculados (exibir na UI)
export interface CalculatedParams {
    maxScenes: number;
    avgSceneDuration: number;
    totalDuration: number;
    isOverridden: boolean;
}
