"use client"

import React from 'react'
import { Save, Cpu, Sparkles, Loader2, Undo2 } from 'lucide-react'
import { useAdminModels, useSaveAdminModels } from '@/hooks/use-admin-models'
import { AVAILABLE_MODELS, type LLMFeatureKey } from '@/lib/ai/models-config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export default function AdminModelsPage() {
    const { data, isLoading } = useAdminModels()
    const saveModels = useSaveAdminModels()

    const [formData, setFormData] = React.useState<Record<string, string>>({})
    const [hasChanges, setHasChanges] = React.useState(false)

    // Inicializar form quando dados carregarem
    React.useEffect(() => {
        if (data?.models) {
            setFormData(data.models)
            setHasChanges(false)
        }
    }, [data?.models])

    const handleModelChange = (featureKey: string, modelId: string) => {
        setFormData(prev => ({ ...prev, [featureKey]: modelId }))
        setHasChanges(true)
    }

    const handleSave = () => {
        saveModels.mutate(formData, {
            onSuccess: () => setHasChanges(false),
        })
    }

    const handleReset = () => {
        if (data?.models) {
            setFormData(data.models)
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    const features = data?.features || {}

    return (
        <div className="container mx-auto py-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Cpu className="h-8 w-8 text-primary" />
                        Modelos de IA
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure o modelo LLM padrão para cada funcionalidade do sistema.
                    </p>
                </div>

                <div className="flex gap-3">
                    {hasChanges && (
                        <Button variant="outline" onClick={handleReset} size="sm">
                            <Undo2 className="h-4 w-4 mr-2" />
                            Descartar
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || saveModels.isPending}
                        size="sm"
                        className="shadow-lg shadow-primary/20"
                    >
                        {saveModels.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Configurações
                    </Button>
                </div>
            </div>

            {/* Info Card - Estilizado como solicitado (Rich Aesthetics) */}
            <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Sparkles className="h-24 w-24 text-primary" />
                </div>
                <CardContent className="pt-6 relative z-10">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-sm">
                            <p className="font-semibold text-foreground">Hierarquia de Resolução:</p>
                            <div className="flex flex-wrap gap-4 mt-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full text-xs font-medium">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    1. Usuário (Prioridade Máxima)
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full text-xs font-medium border-primary/50 text-primary">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                    2. Admin Global (Esta página)
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-background border rounded-full text-xs font-medium">
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                    3. Padrão Hardcoded (Fallback)
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(Object.entries(features) as [LLMFeatureKey, typeof features[LLMFeatureKey]][]).map(
                    ([key, feature]) => (
                        <FeatureModelCard
                            key={key}
                            featureKey={key}
                            feature={feature}
                            currentModel={formData[key] || ''}
                            onModelChange={(modelId) => handleModelChange(key, modelId)}
                        />
                    )
                )}
            </div>
        </div>
    )
}

interface FeatureModelCardProps {
    featureKey: LLMFeatureKey
    feature: {
        label: string
        description: string
        icon: string
        modelType: 'text' | 'image' | 'vision'
        defaultModel: string
    }
    currentModel: string
    onModelChange: (modelId: string) => void
}

function FeatureModelCard({
    featureKey,
    feature,
    currentModel,
    onModelChange
}: FeatureModelCardProps) {
    const availableModels = AVAILABLE_MODELS[feature.modelType]
    const isDefault = currentModel === feature.defaultModel

    return (
        <Card className="hover:border-primary/50 transition-colors group">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-1">
                    <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                        {feature.icon}
                    </div>
                    {isDefault ? (
                        <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[10px] uppercase tracking-wider font-bold">
                            Padrão
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold opacity-50 group-hover:opacity-100 transition-opacity">
                            Customizado
                        </Badge>
                    )}
                </div>
                <CardTitle className="text-xl">{feature.label}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[40px] italic">
                    {feature.description}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={featureKey} className="text-xs font-bold uppercase text-muted-foreground tracking-widest">
                            Modelo Selecionado
                        </Label>
                        <Select value={currentModel} onValueChange={onModelChange}>
                            <SelectTrigger id={featureKey} className="w-full bg-muted/30 border-muted group-hover:border-primary/30 transition-all">
                                <SelectValue placeholder="Selecione um modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableModels.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{model.label}</span>
                                            {model.id === feature.defaultModel && (
                                                <Badge variant="outline" className="text-[9px] uppercase font-black bg-primary/5 py-0 px-1 border-primary/20">
                                                    Recomendado
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg border border-transparent group-hover:border-muted-foreground/10 transition-colors">
                        <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[180px]">
                            {currentModel}
                        </span>
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
