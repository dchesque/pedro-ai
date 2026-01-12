"use client"

import React from 'react'
import { Wand2, Loader2 } from 'lucide-react'
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
import { AITextAssistant } from '../AITextAssistant'
import { useAvailableStyles } from '@/hooks/use-agents'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { ScriptFormData } from '@/lib/roteirista/types'

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
    const { data: stylesData, isLoading: loadingStyles } = useAvailableStyles()
    const styles = stylesData?.styles || []

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

    const handleChange = (field: keyof ScriptFormData, value: any) => {
        onChange({ ...data, [field]: value })
    }

    return (
        <div className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                    id="title"
                    value={data.title || ''}
                    onChange={(e) => handleChange('title', e.target.value)}
                    placeholder="Ex: A Jornada do Herói"
                    maxLength={100}
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

            {/* Grid: Estilo e Tom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Estilo Visual */}
                <div className="space-y-2">
                    <Label>Estilo Visual</Label>
                    <Select
                        value={data.styleId || ''}
                        onValueChange={(value) => handleChange('styleId', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um estilo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {loadingStyles ? (
                                <div className="p-2 text-sm text-muted-foreground">Carregando...</div>
                            ) : (
                                styles.map((style) => (
                                    <SelectItem key={style.key} value={style.key}>
                                        {style.icon} {style.name}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Tom */}
                <div className="space-y-2">
                    <Label>Tom / Clima *</Label>
                    <Select
                        value={data.tone || ''}
                        onValueChange={(value) => handleChange('tone', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o tom..." />
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
            </div>

            {/* Número de Cenas */}
            <div className="space-y-2">
                <Label>Número de Cenas</Label>
                <Select
                    value={String(data.sceneCount || 7)}
                    onValueChange={(value) => handleChange('sceneCount', parseInt(value))}
                >
                    <SelectTrigger className="w-32">
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
