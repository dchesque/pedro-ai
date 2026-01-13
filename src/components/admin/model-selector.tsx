"use client"

import React from 'react'
import { Loader2, DollarSign, Zap, AlertTriangle } from 'lucide-react'
import { useProviders, useProviderModels } from '@/hooks/use-providers'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ProviderCapability, ProviderModel } from '@/lib/ai/providers/types'

interface ModelSelectorProps {
    // Valores atuais
    selectedProvider: string
    selectedModel: string

    // Callbacks
    onProviderChange: (providerId: string) => void
    onModelChange: (modelId: string) => void

    // Filtros
    capability?: ProviderCapability

    // UI
    label?: string
    description?: string
    showPricing?: boolean
    disabled?: boolean
}

export function ModelSelector({
    selectedProvider,
    selectedModel,
    onProviderChange,
    onModelChange,
    capability,
    label,
    description,
    showPricing = true,
    disabled = false,
}: ModelSelectorProps) {
    const { data: providersData, isLoading: loadingProviders, error: providersError } = useProviders()
    const { data: modelsData, isLoading: loadingModels } = useProviderModels(
        selectedProvider || null,
        { capability, enabled: !!selectedProvider }
    )

    // Encontrar modelo selecionado para exibir pricing
    const selectedModelData = modelsData?.models.find(m => m.id === selectedModel)

    // Encontrar provider selecionado para verificar se está configurado
    const selectedProviderData = providersData?.providers.find(p => p.id === selectedProvider)

    // Quando provider muda, limpar modelo selecionado
    const handleProviderChange = (providerId: string) => {
        onProviderChange(providerId)
        onModelChange('') // Limpar modelo
    }

    if (loadingProviders) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        )
    }

    if (providersError) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    Erro ao carregar providers: {providersError.message}
                </AlertDescription>
            </Alert>
        )
    }

    // IMPORTANTE: Mostrar TODOS os providers, não apenas os habilitados
    const providers = providersData?.providers || []

    return (
        <div className="space-y-4">
            {/* Label e Descrição */}
            {label && (
                <div className="space-y-1">
                    <Label className="text-sm font-medium">{label}</Label>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
            )}

            {/* Grid de Seleção */}
            <div className="flex flex-col gap-3">
                {/* Provider Select */}
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Integração</Label>
                    <Select
                        value={selectedProvider}
                        onValueChange={handleProviderChange}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            {providers.map(provider => (
                                <SelectItem
                                    key={provider.id}
                                    value={provider.id}
                                    disabled={!provider.isEnabled}
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <span>{provider.icon}</span>
                                        <span className={!provider.isEnabled ? 'text-muted-foreground' : ''}>
                                            {provider.name}
                                        </span>
                                        {!provider.isEnabled && (
                                            <Badge variant="outline" className="ml-auto text-xs text-destructive border-destructive/50">
                                                Não configurado
                                            </Badge>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Model Select */}
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Modelo</Label>
                    <Select
                        value={selectedModel}
                        onValueChange={onModelChange}
                        disabled={disabled || !selectedProvider || loadingModels || !selectedProviderData?.isEnabled}
                    >
                        <SelectTrigger>
                            {loadingModels ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Carregando...</span>
                                </div>
                            ) : (
                                <SelectValue placeholder="Selecione o modelo..." />
                            )}
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {modelsData?.models.map(model => (
                                <SelectItem key={model.id} value={model.id}>
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <span className="truncate">{model.name}</span>
                                        {model.pricing.estimatedCreditsPerUse !== undefined && (
                                            <Badge variant="outline" className="text-xs shrink-0">
                                                {model.pricing.estimatedCreditsPerUse} cr
                                            </Badge>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                            {modelsData?.models.length === 0 && (
                                <div className="p-2 text-sm text-muted-foreground text-center">
                                    Nenhum modelo disponível
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Aviso se provider não está configurado */}
            {selectedProvider && selectedProviderData && !selectedProviderData.isEnabled && (
                <Alert variant="destructive" className="py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                        O provider <strong>{selectedProviderData.name}</strong> não está configurado.
                        Adicione a variável de ambiente correspondente para usar este provider.
                    </AlertDescription>
                </Alert>
            )}

            {/* Pricing Card */}
            {showPricing && selectedModelData && selectedProviderData?.isEnabled && (
                <ModelPricingCard model={selectedModelData} />
            )}
        </div>
    )
}

/**
 * Card que exibe informações de pricing do modelo
 */
function ModelPricingCard({ model }: { model: ProviderModel }) {
    const { pricing } = model

    return (
        <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{model.name}</span>
                            {pricing.estimatedCreditsPerUse !== undefined && (
                                <Badge className="bg-primary/10 text-primary border-0">
                                    <Zap className="h-3 w-3 mr-1" />
                                    ~{pricing.estimatedCreditsPerUse} créditos/uso
                                </Badge>
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                            {pricing.billingType === 'token' && (
                                <>
                                    <div className="flex justify-between">
                                        <span>Input:</span>
                                        <span className="font-mono">
                                            ${pricing.inputPer1M?.toFixed(2) ?? '—'}/1M tokens
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Output:</span>
                                        <span className="font-mono">
                                            ${pricing.outputPer1M?.toFixed(2) ?? '—'}/1M tokens
                                        </span>
                                    </div>
                                </>
                            )}

                            {pricing.billingType === 'per-image' && pricing.perImage !== undefined && (
                                <div className="flex justify-between">
                                    <span>Por imagem:</span>
                                    <span className="font-mono">${pricing.perImage.toFixed(3)}</span>
                                </div>
                            )}

                            {pricing.billingType === 'per-second' && pricing.perSecond !== undefined && (
                                <div className="flex justify-between">
                                    <span>Por segundo:</span>
                                    <span className="font-mono">${pricing.perSecond.toFixed(3)}</span>
                                </div>
                            )}
                        </div>

                        {model.description && (
                            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                                {model.description}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
