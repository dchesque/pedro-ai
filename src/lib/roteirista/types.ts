// Status do Short no pipeline
export type ShortStatus =
    | 'DRAFT'
    | 'GENERATING_SCRIPT'
    | 'SCRIPT_READY'
    | 'SCRIPT_APPROVED'
    | 'GENERATING_IMAGES'
    | 'IMAGES_READY'
    | 'GENERATING_VIDEO'
    | 'VIDEO_READY'
    | 'PUBLISHED'
    | 'COMPLETED'
    | 'FAILED'

// Etapas do wizard
export type WizardStep = 'concept' | 'characters' | 'scenes' | 'review'

// Dados do formulário do wizard
export interface ScriptFormData {
    // Etapa 1: Conceito
    title: string
    theme: string           // Tema/premissa curta
    synopsis: string        // Descrição expandida
    styleId?: string        // ID do estilo visual
    modelId?: string        // ID do modelo de IA
    tone: string            // Tom: épico, dramático, aventura, etc.

    // Etapa 2: Personagens
    characterIds: string[]  // IDs de personagens da biblioteca
    charactersDescription?: string  // Descrição textual para IA criar

    // Etapa 3: Cenas
    scenes: SceneData[]

    // Metadados
    sceneCount: number      // Número desejado de cenas
}

export interface SceneData {
    id: string              // ID temporário (cuid ou uuid)
    orderIndex: number
    narration: string       // Texto da narração
    visualPrompt: string    // Prompt para geração de imagem
    duration?: number       // Duração estimada em segundos
}

// Ações do assistente de IA
export type AIAction =
    | 'improve'      // Melhorar texto
    | 'expand'       // Expandir/detalhar
    | 'rewrite'      // Reescrever completamente
    | 'summarize'    // Resumir
    | 'translate'    // Traduzir para inglês (prompts visuais)

// Request para API de assistente
export interface AIAssistantRequest {
    text: string
    action: AIAction
    context?: {
        title?: string
        synopsis?: string
        tone?: string
        fieldType?: 'title' | 'synopsis' | 'narration' | 'visualPrompt'
    }
}

// Response da API de assistente
export interface AIAssistantResponse {
    original: string
    suggestion: string
    action: AIAction
}

// Request para gerar cenas
export interface GenerateScenesRequest {
    title: string
    synopsis: string
    tone: string
    characterDescriptions?: string
    sceneCount: number
    stylePrompt?: string    // Prompt do estilo visual selecionado
}

// Response de cenas geradas
export interface GenerateScenesResponse {
    scenes: SceneData[]
}

// Request para gerar prompt visual
export interface GenerateVisualPromptRequest {
    narration: string
    stylePrompt?: string
    characterDescriptions?: string
    tone?: string
}

// Response de prompt visual
export interface GenerateVisualPromptResponse {
    visualPrompt: string
}
