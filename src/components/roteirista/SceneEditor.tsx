"use client"

import React from 'react'
import { GripVertical, Trash2, Wand2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AITextAssistant } from './AITextAssistant'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import type { SceneData, GenerateVisualPromptRequest, GenerateVisualPromptResponse } from '@/lib/roteirista/types'

interface SceneEditorProps {
    scene: SceneData
    index: number
    onChange: (scene: SceneData) => void
    onDelete: () => void
    context?: {
        title?: string
        synopsis?: string
        tone?: string
        stylePrompt?: string
        characterDescriptions?: string
    }
    disabled?: boolean
    isDragging?: boolean
}

export function SceneEditor({
    scene,
    index,
    onChange,
    onDelete,
    context,
    disabled = false,
    isDragging = false,
}: SceneEditorProps) {
    const generateVisualMutation = useMutation({
        mutationFn: async () => {
            const request: GenerateVisualPromptRequest = {
                narration: scene.narration,
                stylePrompt: context?.stylePrompt,
                characterDescriptions: context?.characterDescriptions,
                tone: context?.tone,
            }
            return api.post<GenerateVisualPromptResponse>('/api/roteirista/ai/generate-visual-prompt', request)
        },
        onSuccess: (data) => {
            onChange({ ...scene, visualPrompt: data.visualPrompt })
        },
    })

    const handleNarrationChange = (narration: string) => {
        onChange({ ...scene, narration })
    }

    const handleVisualPromptChange = (visualPrompt: string) => {
        onChange({ ...scene, visualPrompt })
    }

    return (
        <Card className={cn(
            'transition-all',
            isDragging && 'opacity-50 rotate-1 shadow-lg',
            disabled && 'opacity-60'
        )}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <div className="cursor-grab hover:cursor-grabbing text-muted-foreground">
                        <GripVertical className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary" className="font-mono">
                        Cena {index + 1}
                    </Badge>
                    {scene.duration && (
                        <span className="text-xs text-muted-foreground">
                            ~{scene.duration}s
                        </span>
                    )}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    disabled={disabled}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
                {/* Narração */}
                <AITextAssistant
                    value={scene.narration}
                    onChange={handleNarrationChange}
                    label="Narração"
                    placeholder="O texto que será narrado nesta cena..."
                    description="Texto em português para narração em voz. Mantenha curto (1-2 frases)."
                    fieldType="narration"
                    context={context}
                    rows={3}
                    disabled={disabled}
                    actions={['improve', 'rewrite', 'summarize']}
                />

                {/* Prompt Visual */}
                <div className="space-y-2">
                    <AITextAssistant
                        value={scene.visualPrompt}
                        onChange={handleVisualPromptChange}
                        label="Descrição Visual (Prompt)"
                        placeholder="Detailed visual description in English for image generation..."
                        description="Prompt em inglês para geração de imagem. Seja descritivo."
                        fieldType="visualPrompt"
                        context={context}
                        rows={3}
                        disabled={disabled}
                        actions={['improve', 'expand', 'translate']}
                    />

                    {/* Botão Gerar Prompt */}
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => generateVisualMutation.mutate()}
                        disabled={disabled || !scene.narration.trim() || generateVisualMutation.isPending}
                        className="gap-2"
                    >
                        {generateVisualMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wand2 className="h-4 w-4" />
                        )}
                        Gerar Prompt da Narração
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
