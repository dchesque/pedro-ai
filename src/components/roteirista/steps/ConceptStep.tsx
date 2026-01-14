import React, { useState } from 'react'
import { Wand2, Loader2, Sparkles, Settings, ExternalLink, MessageSquare, Layout } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { AITextAssistant } from '../AITextAssistant'
import { useStyles } from '@/hooks/use-styles'
import { useClimates } from '@/hooks/use-climates'
import { useAvailableModels } from '@/hooks/use-available-models'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import type { ScriptFormData } from '@/lib/roteirista/types'
import { StylePreviewCard } from '../StylePreviewCard'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ClimateSelector } from '@/components/climates/ClimateSelector'
import { FormatSelector } from '@/components/shorts/FormatSelector'
import { CalculatedParamsDisplay } from '@/components/shorts/CalculatedParamsDisplay'

interface ConceptStepProps {
    data: Partial<ScriptFormData>
    onChange: (data: Partial<ScriptFormData>) => void
}

export function ConceptStep({ data, onChange }: ConceptStepProps) {
    const router = useRouter()

    // Data Hooks
    const { data: stylesData, isLoading: loadingStyles } = useStyles()
    const { data: climatesData, isLoading: loadingClimates } = useClimates()
    const { data: modelsData, isLoading: loadingModels } = useAvailableModels()

    const styles = stylesData?.styles || []
    const climates = climatesData?.climates || []
    const models = modelsData?.models || []

    const [suggestingTitles, setSuggestingTitles] = useState(false)
    const [titles, setTitles] = useState<string[]>([])

    const selectedStyle = styles.find(s => s.id === data.styleId)
    const selectedClimate = climates.find(c => c.id === data.climateId)

    // Sync legacy/new fields
    const handleChange = (field: keyof ScriptFormData, value: any) => {
        const updates: Partial<ScriptFormData> = { [field]: value }

        // Sync climate name if climateId changes
        if (field === 'climateId') {
            const climateObj = climates.find(c => c.id === value)
            if (climateObj) updates.climate = climateObj.name
        }

        // Sync theme with premise
        if (field === 'premise') {
            updates.theme = value
        }

        onChange({ ...data, ...updates })
    }

    // Mutation para gerar sinopse a partir da premissa
    const generateSynopsisMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post<{ suggestion: string }>('/api/roteirista/ai/assist', {
                text: data.premise || data.theme || '',
                action: 'expand',
                context: {
                    fieldType: 'synopsis',
                    tone: selectedClimate?.name || data.climate,
                },
            })
            return response.suggestion
        },
        onSuccess: (synopsis) => {
            onChange({ ...data, synopsis })
        },
    })

    // Mutation para sugerir títulos
    const suggestTitlesMutation = useMutation({
        mutationFn: async () => {
            setSuggestingTitles(true)
            const response = await api.post<{ titles: string[] }>('/api/roteirista/ai/suggest-titles', {
                theme: data.premise || data.theme || '',
                styleId: data.styleId,
                tone: selectedClimate?.name || data.climate,
            })
            return response.titles
        },
        onSuccess: (suggestedTitles) => {
            setTitles(suggestedTitles)
            setSuggestingTitles(false)
        },
        onError: () => {
            setSuggestingTitles(false)
        }
    })

    return (
        <div className="space-y-8">
            {/* 1. Premissa e Título */}
            <div className="space-y-6">
                <AITextAssistant
                    value={data.premise || data.theme || ''}
                    onChange={(value) => handleChange('premise', value)}
                    label="Premissa / Tema *"
                    placeholder="Descreva brevemente a ideia central da história..."
                    description="O que acontece na história? A IA vai executar o roteiro baseado nisso."
                    fieldType="synopsis"
                    context={{ title: data.title, tone: selectedClimate?.name || data.climate }}
                    rows={2}
                    actions={['improve', 'rewrite']}
                />

                <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center justify-between">
                        <span>Título</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-3 text-[11px] text-primary hover:text-primary-foreground gap-1.5 bg-primary/5 hover:bg-primary"
                                    onClick={() => !titles.length && suggestTitlesMutation.mutate()}
                                    disabled={(!data.premise && !data.theme) || suggestingTitles}
                                >
                                    {suggestingTitles ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-3.5 w-3.5" />
                                    )}
                                    Sugerir Títulos
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72 glass-panel p-2">
                                <div className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1 mb-1">Ideias Criativas</div>
                                {titles.length > 0 ? (
                                    titles.map((title, i) => (
                                        <DropdownMenuItem
                                            key={i}
                                            onClick={() => handleChange('title', title)}
                                            className="text-sm py-2.5 cursor-pointer"
                                        >
                                            {title}
                                        </DropdownMenuItem>
                                    ))
                                ) : (
                                    <div className="text-xs text-center p-4 text-muted-foreground">
                                        Descreva seu tema para ver sugestões.
                                    </div>
                                )}
                                <div className="border-t border-border/50 mt-1 pt-1">
                                    <DropdownMenuItem
                                        onClick={() => suggestTitlesMutation.mutate()}
                                        className="text-xs justify-center text-primary font-medium hover:bg-primary/5"
                                    >
                                        <Wand2 className="h-3 w-3 mr-2" />
                                        Gerar Novas Ideias
                                    </DropdownMenuItem>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </Label>
                    <Input
                        id="title"
                        value={data.title || ''}
                        onChange={(e) => handleChange('title', e.target.value)}
                        placeholder="Ex: Por que acordar às 5h muda sua vida"
                        maxLength={100}
                        className="bg-card/50"
                    />
                </div>
            </div>

            {/* 2. Formato e Parâmetros */}
            <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center gap-2 mb-2">
                    <Layout className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Configuração Técnica</h3>
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Formato do Conteúdo *</Label>
                    <FormatSelector
                        value={data.format}
                        onChange={(format) => handleChange('format', format)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Estilo / Regras *</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => router.push('/estilos')}>
                                                <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Gerenciar Estilos</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <Select value={data.styleId || ''} onValueChange={(value) => handleChange('styleId', value)}>
                                <SelectTrigger className="bg-background/50 h-10 font-medium">
                                    <SelectValue placeholder="Selecione o Estilo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingStyles ? (
                                        <div className="p-2 text-sm text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
                                    ) : (
                                        styles.map((style) => (
                                            <SelectItem key={style.id} value={style.id}>
                                                <div className="flex items-center justify-between w-full gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span>{style.icon}</span>
                                                        <span>{style.name}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Clima Narrativo *</Label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => router.push('/estilos')}>
                                                <MessageSquare className="h-3 w-3" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Gerenciar Climas</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <ClimateSelector
                                value={data.climateId}
                                onValueChange={(id) => {
                                    handleChange('climateId', id)
                                }}
                                compatibleClimates={selectedStyle?.compatibleClimates}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <CalculatedParamsDisplay
                            format={data.format || 'SHORT'}
                            pressure={selectedClimate?.narrativePressure || 'FLUID'}
                            advancedMode={data.advancedMode as any}
                            onChange={(advancedMode) => handleChange('advancedMode', advancedMode)}
                        />
                    </div>
                </div>
            </div>

            {/* 3. Modelo e Detalhes */}
            <div className="space-y-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Modelo de Execução *</Label>
                            <Select value={data.modelId || ''} onValueChange={(value) => handleChange('modelId', value)}>
                                <SelectTrigger className="bg-background/50 h-10">
                                    <SelectValue placeholder="Escolha o modelo de IA..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingModels ? (
                                        <div className="p-2 text-sm text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
                                    ) : (
                                        models.map((model) => (
                                            <SelectItem key={model.id} value={model.id}>
                                                <div className="flex items-center justify-between w-full gap-2">
                                                    <span>{model.name}</span>
                                                    {!model.isFree && <span className="text-[9px] opacity-70">{model.credits}cr/m</span>}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Público Alvo (Opcional)</Label>
                            <Input
                                value={data.targetAudience || ''}
                                onChange={(e) => handleChange('targetAudience', e.target.value)}
                                placeholder="Ex: Jovens empreendedores..."
                                className="h-10 bg-card/30"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <AITextAssistant
                            value={data.synopsis || ''}
                            onChange={(value) => handleChange('synopsis', value)}
                            label="Sinopse Expandida"
                            placeholder="Descreva a história completa..."
                            description="A IA usará isso como base para executar as cenas."
                            fieldType="synopsis"
                            context={{ title: data.title, tone: selectedClimate?.name || data.climate }}
                            rows={5}
                            actions={['improve', 'expand', 'rewrite', 'summarize']}
                        />
                        {(data.premise || data.theme) && !data.synopsis && (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => generateSynopsisMutation.mutate()}
                                disabled={generateSynopsisMutation.isPending}
                                className="w-full gap-2 text-xs h-8"
                            >
                                {generateSynopsisMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                                Processar Sinopse Automática
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

