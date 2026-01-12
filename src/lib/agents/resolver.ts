import { db } from '@/lib/db'
import { AgentType } from '../../../prisma/generated/client_final'
import { DEFAULT_AGENT_PROMPTS, DEFAULT_STYLES, getDefaultStyle } from './defaults'
import { getDefaultModel } from '@/lib/ai/model-resolver'

// ============================================
// TIPOS
// ============================================

export interface ResolvedAgent {
    name: string
    systemPrompt: string
    model: string
    temperature: number
    source: 'user' | 'global' | 'default'
}

export interface ResolvedStyle {
    key: string
    name: string
    description: string
    icon: string
    scriptwriterPrompt: string
    promptEngineerPrompt: string
    visualStyle: string
    negativePrompt: string
    source: 'user' | 'global' | 'default'
}

// ============================================
// RESOLVER DE AGENTES
// ============================================

export async function resolveAgent(
    type: AgentType,
    userId?: string
): Promise<ResolvedAgent> {
    // 1. Tentar buscar agente do usuário
    if (userId) {
        const userAgent = await db.userAgent.findFirst({
            where: { userId, type, isActive: true },
        })

        if (userAgent) {
            // Se o usuário não definiu um modelo, buscar do admin/default
            const model = userAgent.model ?? await getDefaultModelForAgent(type)

            return {
                name: userAgent.name,
                systemPrompt: userAgent.systemPrompt,
                model,
                temperature: userAgent.temperature ?? DEFAULT_AGENT_PROMPTS[type].temperature,
                source: 'user',
            }
        }
    }

    // 2. Tentar buscar agente global (admin)
    const globalAgent = await db.globalAgent.findFirst({
        where: { type, isActive: true },
    })

    if (globalAgent) {
        return {
            name: globalAgent.name,
            systemPrompt: globalAgent.systemPrompt,
            model: globalAgent.model,
            temperature: globalAgent.temperature,
            source: 'global',
        }
    }

    // 3. Usar configuração admin de modelos + fallback hardcoded
    const model = await getDefaultModelForAgent(type)
    const defaultAgent = DEFAULT_AGENT_PROMPTS[type]

    return {
        name: defaultAgent.name,
        systemPrompt: defaultAgent.systemPrompt,
        model,
        temperature: defaultAgent.temperature,
        source: 'default',
    }
}

// Helper para mapear AgentType para LLMFeatureKey
async function getDefaultModelForAgent(type: AgentType): Promise<string> {
    const featureKeyMap: Record<AgentType, string> = {
        SCRIPTWRITER: 'agent_scriptwriter',
        PROMPT_ENGINEER: 'agent_prompt_engineer',
        NARRATOR: 'agent_narrator',
    }

    return getDefaultModel(featureKeyMap[type] as any)
}

// ============================================
// RESOLVER DE ESTILOS
// ============================================

export async function resolveStyle(
    styleKey: string,
    userId?: string
): Promise<ResolvedStyle> {
    // 1. Tentar buscar estilo do usuário
    if (userId) {
        const userStyle = await db.userStyle.findFirst({
            where: { userId, key: styleKey, isActive: true },
        })

        if (userStyle) {
            return {
                key: userStyle.key,
                name: userStyle.name,
                description: userStyle.description ?? '',
                icon: userStyle.icon ?? '🎨',
                scriptwriterPrompt: userStyle.scriptwriterPrompt ?? '',
                promptEngineerPrompt: userStyle.promptEngineerPrompt ?? '',
                visualStyle: userStyle.visualStyle ?? '',
                negativePrompt: userStyle.negativePrompt ?? '',
                source: 'user',
            }
        }
    }

    // 2. Tentar buscar estilo global (admin)
    const globalStyle = await db.globalStyle.findFirst({
        where: { key: styleKey, isActive: true },
    })

    if (globalStyle) {
        return {
            key: globalStyle.key,
            name: globalStyle.name,
            description: globalStyle.description ?? '',
            icon: globalStyle.icon ?? '🎨',
            scriptwriterPrompt: globalStyle.scriptwriterPrompt ?? '',
            promptEngineerPrompt: globalStyle.promptEngineerPrompt ?? '',
            visualStyle: globalStyle.visualStyle ?? '',
            negativePrompt: globalStyle.negativePrompt ?? '',
            source: 'global',
        }
    }

    // 3. Usar fallback hardcoded
    const defaultStyle = getDefaultStyle(styleKey)
    if (defaultStyle) {
        return {
            ...defaultStyle,
            source: 'default',
        }
    }

    // 4. Se não encontrou nada, retornar estilo vazio
    return {
        key: styleKey,
        name: styleKey,
        description: '',
        icon: '🎨',
        scriptwriterPrompt: '',
        promptEngineerPrompt: '',
        visualStyle: '',
        negativePrompt: '',
        source: 'default',
    }
}

// ============================================
// LISTAR ESTILOS DISPONÍVEIS
// ============================================

export async function getAvailableStyles(userId?: string): Promise<ResolvedStyle[]> {
    const styles: ResolvedStyle[] = []
    const addedKeys = new Set<string>()

    // 1. Estilos do usuário (maior prioridade)
    if (userId) {
        const userStyles = await db.userStyle.findMany({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'asc' },
        })

        for (const style of userStyles) {
            styles.push({
                key: style.key,
                name: style.name,
                description: style.description ?? '',
                icon: style.icon ?? '🎨',
                scriptwriterPrompt: style.scriptwriterPrompt ?? '',
                promptEngineerPrompt: style.promptEngineerPrompt ?? '',
                visualStyle: style.visualStyle ?? '',
                negativePrompt: style.negativePrompt ?? '',
                source: 'user',
            })
            addedKeys.add(style.key)
        }
    }

    // 2. Estilos globais (admin)
    const globalStyles = await db.globalStyle.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
    })

    for (const style of globalStyles) {
        if (!addedKeys.has(style.key)) {
            styles.push({
                key: style.key,
                name: style.name,
                description: style.description ?? '',
                icon: style.icon ?? '🎨',
                scriptwriterPrompt: style.scriptwriterPrompt ?? '',
                promptEngineerPrompt: style.promptEngineerPrompt ?? '',
                visualStyle: style.visualStyle ?? '',
                negativePrompt: style.negativePrompt ?? '',
                source: 'global',
            })
            addedKeys.add(style.key)
        }
    }

    // 3. Estilos padrão (hardcoded) - apenas os que não foram sobrescritos
    for (const style of DEFAULT_STYLES) {
        if (!addedKeys.has(style.key)) {
            styles.push({
                ...style,
                source: 'default',
            })
            addedKeys.add(style.key)
        }
    }

    return styles
}
