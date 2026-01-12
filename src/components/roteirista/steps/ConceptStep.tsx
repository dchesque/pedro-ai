import React, { useState } from 'react'
import { Wand2, Loader2, Sparkles, Settings, ExternalLink } from 'lucide-react'
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
import { useAvailableModels } from '@/hooks/use-available-models'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import type { ScriptFormData } from '@/lib/roteirista/types'
import { StylePreviewCard } from '../StylePreviewCard'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ConceptStepProps {
    data: Partial<ScriptFormData>
    onChange: (data: Partial<ScriptFormData>) => void
}

const TONE_OPTIONS = [
    { value: 'épico', label: '⚔️ Épico' },
    { value: 'dramático', label: '🎭 Dramático' },
    { value: 'aventura', label: '🗺️ Aventura' },
    { value: 'comédia', label: '😄 Comédia' },
    { value: 'suspense', label: '😰 Suspense' },
    { value: 'romance', label: '💕 Romance' },
    { value: 'terror', label: '👻 Terror' },
    { value: 'infantil', label: '🧸 Infantil' },
    { value: 'educativo', label: '📚 Educativo' },
    { value: 'motivacional', label: '💪 Motivacional' },
]

export function ConceptStep({ data, onChange }: ConceptStepProps) {
    const router = useRouter()
    const { data: stylesData, isLoading: loadingStyles } = useStyles()
    const { data: modelsData, isLoading: loadingModels } = useAvailableModels()
    const styles = stylesData?.styles || []
    const models = modelsData?.models || []
    const [suggestingTitles, setSuggestingTitles] = useState(false)
    const [titles, setTitles] = useState<string[]>([])

    const selectedStyle = styles.find(s => s.id === data.styleId)

    // Mutation para gerar sinopse a partir do tema
    const generateSynopsisMutation = useMutation({
        mutationFn: async () => {
            const response = await api.post<{ suggestion: string }>('/api/roteirista/ai/assist', {
                text: data.theme || '',
                action: 'expand',
                context: {
                    fieldType: 'synopsis',
                    tone: data.tone,
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
                theme: data.theme || '',
                styleId: data.styleId,
                tone: data.tone,
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

    const handleChange = (field: keyof ScriptFormData, value: any) => {
        onChange({ ...data, [field]: value })
    }

    return (
        <div className="space-y-6">
            {/* Bloco de Configurações */}
            <div className="p-4 rounded-xl border bg-card/30 backdrop-blur-sm space-y-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Estilo Visual */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Estilo / Regras *</Label>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={() => router.push('/estilos')}
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Gerenciar Estilos</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <Select
                            value={data.styleId || ''}
                            onValueChange={(value) => handleChange('styleId', value)}
                        >
                            <SelectTrigger className="bg-background/50 h-9">
                                <SelectValue placeholder="Selecione..." />
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
                                                {!style.userId || style.isDefault ? (
                                                    <Badge variant="secondary" className="text-[8px] h-3.5 px-1 bg-secondary/30 border-none uppercase opacity-60">Sistema</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 text-blue-500 border-blue-500/20 uppercase">Pessoal</Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tom */}
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Tom / Clima *</Label>
                        <Select
                            value={data.tone || ''}
                            onValueChange={(value) => handleChange('tone', value)}
                        >
                            <SelectTrigger className="bg-background/50 h-9">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {TONE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Modelo de IA */}
                    <div className="space-y-2">
                        <Label htmlFor="model" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">Modelo de IA *</Label>
                        <Select
                            value={data.modelId || ''}
                            onValueChange={(value) => handleChange('modelId', value)}
                        >
                            <SelectTrigger className="bg-background/50 h-9">
                                <SelectValue placeholder="Escolha..." />
                            </SelectTrigger>
                            <SelectContent>
                                {loadingModels ? (
                                    <div className="p-2 text-sm text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
                                ) : (
                                    models.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <span>{model.name}</span>
                                                {model.isFree ? (
                                                    <Badge variant="secondary" className="text-[9px] h-4 bg-green-500/10 text-green-500 border-none px-1">Free</Badge>
                                                ) : (
                                                    <span className="text-[9px] opacity-70 whitespace-nowrap">{model.credits}cr/m</span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {selectedStyle && (
                    <div className="pt-2 border-t border-border/50">
                        <StylePreviewCard style={selectedStyle} />
                    </div>
                )}
            </div>

            {/* Título (Linha Inteira) */}
            <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center justify-between">
                    <span>Título *</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-3 text-[11px] text-primary hover:text-primary-foreground gap-1.5 bg-primary/5 hover:bg-primary"
                                onClick={() => !titles.length && suggestTitlesMutation.mutate()}
                                disabled={!data.theme || suggestingTitles}
                            >
                                {suggestingTitles ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Sparkles className="h-3.5 w-3.5" />
                                )}
                                Sugestões IA
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
                    placeholder="Ex: Segredos da Inteligência Artificial"
                    maxLength={100}
                    className="bg-card/50 text-lg py-6"
                />
            </div>

            {/* Tema/Premissa */}
            <AITextAssistant
                value={data.theme || ''}
                onChange={(value) => handleChange('theme', value)}
                label="Tema / Premissa *"
                placeholder="Descreva brevemente a ideia central da história..."
                description="Uma frase ou parágrafo curto. A IA vai expandir isso em uma sinopse completa."
                fieldType="synopsis"
                context={{ title: data.title, tone: data.tone }}
                rows={2}
                actions={['improve', 'rewrite']}
            />

            {/* Sinopse */}
            <div className="space-y-2">
                <AITextAssistant
                    value={data.synopsis || ''}
                    onChange={(value) => handleChange('synopsis', value)}
                    label="Sinopse / Descrição"
                    placeholder="A história completa em detalhes..."
                    description="Descrição completa da história. Pode gerar automaticamente a partir do tema."
                    fieldType="synopsis"
                    context={{ title: data.title, tone: data.tone }}
                    rows={5}
                    actions={['improve', 'expand', 'rewrite', 'summarize']}
                />

                {data.theme && !data.synopsis && (
                    <div className="pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => generateSynopsisMutation.mutate()}
                            disabled={generateSynopsisMutation.isPending}
                            className="gap-2"
                        >
                            {generateSynopsisMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Wand2 className="h-4 w-4" />
                            )}
                            Gerar Sinopse do Tema
                        </Button>
                    </div>
                )}
            </div>

            {/* Número de Cenas */}
            <div className="space-y-2">
                <Label>Número de Cenas</Label>
                <Select
                    value={String(data.sceneCount || 7)}
                    onValueChange={(value) => handleChange('sceneCount', parseInt(value))}
                >
                    <SelectTrigger className="w-32 bg-card/50">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {[3, 5, 7, 9, 10, 12, 15].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                                {n} cenas
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Recomendado: 5-7 cenas para vídeos de 30-60 segundos
                </p>
            </div>
        </div>
    )
}
