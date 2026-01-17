"use client"

import React from 'react'
import { Save, Cpu, Sparkles, Loader2, Undo2 } from 'lucide-react'
import { StandardPageHeader } from '@/components/ui/standard-page-header'
import { useAdminModels, useSaveAdminModels } from '@/hooks/use-admin-models'
import { ModelSelector } from '@/components/admin/model-selector'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { LLM_FEATURES, type LLMFeatureKey } from '@/lib/ai/models-config'
import type { ProviderCapability } from '@/lib/ai/providers/types'

// Mapear modelType para ProviderCapability
const MODEL_TYPE_TO_CAPABILITY: Record<string, ProviderCapability> = {
    text: 'text',
    image: 'image',
    vision: 'vision',
    video: 'video',
}

// Estrutura de dados salva (agora inclui provider)
interface FeatureModelConfig {
    provider: string
    modelId: string
}

export default function AdminModelsPage() {
    const { data, isLoading } = useAdminModels()
    const saveModels = useSaveAdminModels()

    // Estado do formulário: { featureKey: { provider, modelId } }
    const [formData, setFormData] = React.useState<Record<string, FeatureModelConfig>>({})
    const [hasChanges, setHasChanges] = React.useState(false)

    // Inicializar form quando dados carregarem
    React.useEffect(() => {
        if (data?.models) {
            // Converter formato antigo (só modelId) para novo (provider + modelId)
            const converted: Record<string, FeatureModelConfig> = {}
            for (const [key, value] of Object.entries(data.models)) {
                if (typeof value === 'string') {
                    // Formato antigo: deduzir provider do modelId
                    const provider = value.startsWith('fal-ai/') ? 'fal' : 'openrouter'
                    converted[key] = { provider, modelId: value }
                } else if (typeof value === 'object' && value !== null) {
                    converted[key] = value as FeatureModelConfig
                }
            }
            setFormData(converted)
            setHasChanges(false)
        }
    }, [data?.models])

    const handleProviderChange = (featureKey: string, provider: string) => {
        setFormData(prev => ({
            ...prev,
            [featureKey]: { provider, modelId: '' }
        }))
        setHasChanges(true)
    }

    const handleModelChange = (featureKey: string, modelId: string) => {
        setFormData(prev => ({
            ...prev,
            [featureKey]: { ...prev[featureKey], modelId }
        }))
        setHasChanges(true)
    }

    const handleSave = () => {
        // Converter para formato de salvamento
        const toSave: Record<string, FeatureModelConfig> = {}
        for (const [key, config] of Object.entries(formData)) {
            if (config.provider && config.modelId) {
                toSave[key] = config
            }
        }

        saveModels.mutate(toSave as any, {
            onSuccess: () => setHasChanges(false),
        })
    }

    const handleReset = () => {
        if (data?.models) {
            // Reconverter do data original
            const converted: Record<string, FeatureModelConfig> = {}
            for (const [key, value] of Object.entries(data.models)) {
                if (typeof value === 'string') {
                    const provider = value.startsWith('fal-ai/') ? 'fal' : 'openrouter'
                    converted[key] = { provider, modelId: value }
                } else if (typeof value === 'object' && value !== null) {
                    converted[key] = value as FeatureModelConfig
                }
            }
            setFormData(converted)
            setHasChanges(false)
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-10 space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <StandardPageHeader
                title="Modelos de"
                subtitle="IA"
                description="Configure o provider e modelo padrão para cada funcionalidade."
                icon={Cpu}
                badge="INTELIGÊNCIA ARTIFICIAL"
                action={
                    <div className="flex gap-2">
                        {hasChanges && (
                            <Button variant="outline" onClick={handleReset}>
                                <Undo2 className="h-4 w-4 mr-2" />
                                Descartar
                            </Button>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={!hasChanges || saveModels.isPending}
                        >
                            {saveModels.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar Configurações
                        </Button>
                    </div>
                }
            />

            {/* Info Card */}
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Providers Dinâmicos</h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Os modelos são carregados diretamente das APIs dos providers em tempo real.
                                Custos exibidos são estimativas baseadas no pricing oficial.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="bg-background">
                                    🌐 OpenRouter: ~300 modelos
                                </Badge>
                                <Badge variant="outline" className="bg-background">
                                    🎨 fal.ai: Imagem & Vídeo
                                </Badge>
                                <Badge variant="secondary">
                                    + Futuros providers
                                </Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(Object.entries(LLM_FEATURES) as [LLMFeatureKey, typeof LLM_FEATURES[LLMFeatureKey]][]).map(
                    ([key, feature]) => {
                        const config = formData[key] || { provider: '', modelId: '' }
                        const capability = MODEL_TYPE_TO_CAPABILITY[feature.modelType]

                        return (
                            <Card key={key} className="hover:border-primary/50 transition-colors">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{feature.icon}</span>
                                        <div>
                                            <CardTitle className="text-lg">{feature.label}</CardTitle>
                                            <CardDescription>{feature.description}</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ModelSelector
                                        selectedProvider={config.provider}
                                        selectedModel={config.modelId}
                                        onProviderChange={(p) => handleProviderChange(key, p)}
                                        onModelChange={(m) => handleModelChange(key, m)}
                                        capability={capability}
                                        showPricing={true}
                                    />
                                </CardContent>
                            </Card>
                        )
                    }
                )}
            </div>
        </div>
    )
}
