"use client"

import React from 'react'
import { Loader2, DollarSign, Zap, AlertTriangle, ExternalLink } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown } from 'lucide-react'
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

    const [open, setOpen] = React.useState(false)

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

                {/* Model Combobox (Searchable) */}
                <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Modelo</Label>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className="w-full justify-between font-normal hover:bg-background"
                                disabled={disabled || !selectedProvider || loadingModels || !selectedProviderData?.isEnabled}
                            >
                                {loadingModels ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Carregando...</span>
                                    </div>
                                ) : selectedModel ? (
                                    <div className="flex items-center justify-between w-full gap-2">
                                        <span className="truncate">{selectedModelData?.name || selectedModel}</span>
                                        {selectedModelData?.pricing.estimatedCreditsPerUse !== undefined && (
                                            <Badge variant="outline" className="text-[10px] py-0 h-4 shrink-0">
                                                {selectedModelData.pricing.estimatedCreditsPerUse} cr
                                            </Badge>
                                        )}
                                    </div>
                                ) : (
                                    "Selecione o modelo..."
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                                <CommandInput placeholder="Pesquisar modelo..." />
                                <CommandList className="max-h-[300px]">
                                    <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                                    <CommandGroup>
                                        {modelsData?.models.map((model) => (
                                            <CommandItem
                                                key={model.id}
                                                value={model.id}
                                                onSelect={(currentValue) => {
                                                    onModelChange(currentValue)
                                                    setOpen(false)
                                                }}
                                                className="flex items-center justify-between gap-2"
                                            >
                                                <div className="flex items-center gap-2 flex-1 truncate">
                                                    <Check
                                                        className={cn(
                                                            "h-4 w-4 shrink-0",
                                                            selectedModel === model.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <span className="truncate">{model.name}</span>
                                                </div>
                                                {model.pricing.estimatedCreditsPerUse !== undefined && (
                                                    <Badge variant="outline" className="text-[10px] py-0 h-4 shrink-0">
                                                        {model.pricing.estimatedCreditsPerUse} cr
                                                    </Badge>
                                                )}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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


function getModelUrl(provider: string, modelId: string): string | null {
    if (provider === 'openrouter') {
        return `https://openrouter.ai/models/${modelId}`
    }
    if (provider === 'fal') {
        // fal model IDs are typically like "fal-ai/flux-pro"
        return `https://fal.ai/models/${modelId}`
    }
    return null
}

/**
 * Card que exibe informações de pricing do modelo
 */
function ModelPricingCard({ model }: { model: ProviderModel }) {
    const { pricing } = model
    const modelUrl = getModelUrl(model.provider, model.id) // Assuming ProviderModel has provider field or we pass it

    return (
        <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{model.name}</span>
                                {modelUrl && (
                                    <a
                                        href={modelUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                        title="Ver na página do provider"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>
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
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
