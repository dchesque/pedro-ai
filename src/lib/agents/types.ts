// Tipos compartilhados entre agentes

export interface ScriptScene {
    order: number
    narration: string
    visualDescription: string
    duration: number
    mood: string
}

export interface ShortScript {
    title: string
    hook: string
    scenes: ScriptScene[]
    cta: string
    totalDuration: number
    style: string
}

export interface ScenePrompt {
    sceneOrder: number
    imagePrompt: string
    negativePrompt: string
    suggestedDuration: number
    aspectRatio: '9:16' | '16:9' | '1:1'
}

export interface PromptEngineerOutput {
    prompts: ScenePrompt[]
    style: string
    consistency: string  // Dicas para manter consistência visual
}
