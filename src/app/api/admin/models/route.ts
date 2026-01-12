import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/admin'
import { getAllDefaultModels, saveDefaultModels } from '@/lib/ai/model-resolver'
import { LLM_FEATURES } from '@/lib/ai/models-config'

// GET - Buscar modelos padrão configurados
export async function GET() {
    try {
        await requireAdmin()

        const models = await getAllDefaultModels()

        return NextResponse.json({
            models,
            features: LLM_FEATURES,
        })
    } catch (error: any) {
        console.error('[admin-models-get] Erro:', error)
        return NextResponse.json({ error: error.message }, { status: error.status || 500 })
    }
}

// Schema para novo formato
const FeatureModelConfigSchema = z.object({
    provider: z.string().min(1),
    modelId: z.string().min(1),
})

const SaveModelsSchema = z.object({
    models: z.record(
        z.string(),
        z.union([
            z.string(), // Formato antigo (só modelId)
            FeatureModelConfigSchema, // Novo formato
        ])
    ),
})

// PUT - Salvar modelos padrão
export async function PUT(req: Request) {
    try {
        await requireAdmin()

        const json = await req.json()
        const result = SaveModelsSchema.safeParse(json)

        if (!result.success) {
            return NextResponse.json({ error: 'Dados inválidos', issues: result.error.flatten() }, { status: 400 })
        }

        const { models } = result.data

        // Validar que todas as keys são válidas
        const validKeys = Object.keys(LLM_FEATURES)
        for (const key of Object.keys(models)) {
            if (!validKeys.includes(key)) {
                return NextResponse.json(
                    { error: `Feature inválida: ${key}` },
                    { status: 400 }
                )
            }
        }

        await saveDefaultModels(models as Record<string, any>)

        return NextResponse.json({ success: true, models })
    } catch (error: any) {
        console.error('[admin-models-put] Erro:', error)
        return NextResponse.json({ error: error.message }, { status: error.status || 500 })
    }
}
