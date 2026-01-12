"use client"

import React from 'react'
import { Sparkles, RefreshCw, Expand, FileEdit, AlignLeft, Languages, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import type { AIAction, AIAssistantRequest, AIAssistantResponse } from '@/lib/roteirista/types'

interface AITextAssistantProps {
    value: string
    onChange: (value: string) => void
    label?: string
    placeholder?: string
    description?: string
    fieldType?: 'title' | 'synopsis' | 'narration' | 'visualPrompt'
    context?: {
        title?: string
        synopsis?: string
        tone?: string
    }
    rows?: number
    maxLength?: number
    disabled?: boolean
    className?: string
    // Quais ações mostrar
    actions?: AIAction[]
}

const ACTION_CONFIG: Record<AIAction, { icon: React.ElementType; label: string; tooltip: string }> = {
    improve: { icon: Sparkles, label: 'Melhorar', tooltip: 'Melhora a qualidade do texto' },
    expand: { icon: Expand, label: 'Expandir', tooltip: 'Adiciona mais detalhes' },
    rewrite: { icon: RefreshCw, label: 'Reescrever', tooltip: 'Reescreve de forma criativa' },
    summarize: { icon: AlignLeft, label: 'Resumir', tooltip: 'Cria versão resumida' },
    translate: { icon: Languages, label: 'Inglês', tooltip: 'Traduz para inglês (prompts)' },
}

export function AITextAssistant({
    value,
    onChange,
    label,
    placeholder,
    description,
    fieldType,
    context,
    rows = 4,
    maxLength,
    disabled = false,
    className,
    actions = ['improve', 'expand', 'rewrite'],
}: AITextAssistantProps) {
    const [suggestion, setSuggestion] = React.useState<string | null>(null)
    const [lastAction, setLastAction] = React.useState<AIAction | null>(null)

    const assistMutation = useMutation({
        mutationFn: async ({ text, action }: { text: string; action: AIAction }) => {
            const request: AIAssistantRequest = {
                text,
                action,
                context: {
                    ...context,
                    fieldType,
                },
            }
            return api.post<AIAssistantResponse>('/api/roteirista/ai/assist', request)
        },
        onSuccess: (data) => {
            setSuggestion(data.suggestion)
        },
    })

    const handleAction = (action: AIAction) => {
        if (!value.trim()) return
        setLastAction(action)
        assistMutation.mutate({ text: value, action })
    }

    const acceptSuggestion = () => {
        if (suggestion) {
            onChange(suggestion)
            setSuggestion(null)
            setLastAction(null)
        }
    }

    const rejectSuggestion = () => {
        setSuggestion(null)
        setLastAction(null)
    }

    const isLoading = assistMutation.isPending

    return (
        <div className={cn('space-y-2', className)}>
            {/* Label */}
            {label && (
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">{label}</Label>
                    {maxLength && (
                        <span className="text-xs text-muted-foreground">
                            {value.length}/{maxLength}
                        </span>
                    )}
                </div>
            )}

            {/* Description */}
            {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
            )}

            {/* Textarea */}
            <div className="relative">
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    maxLength={maxLength}
                    disabled={disabled || isLoading}
                    className={cn(
                        'resize-none pr-2',
                        isLoading && 'opacity-50'
                    )}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-1.5">
                {actions.map((action) => {
                    const config = ACTION_CONFIG[action]
                    const Icon = config.icon
                    return (
                        <Button
                            key={action}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(action)}
                            disabled={disabled || isLoading || !value.trim()}
                            className="h-7 text-xs gap-1"
                            title={config.tooltip}
                        >
                            {isLoading && lastAction === action ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Icon className="h-3 w-3" />
                            )}
                            {config.label}
                        </Button>
                    )
                })}
            </div>

            {/* Suggestion Card */}
            {suggestion && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-3 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <Sparkles className="h-4 w-4" />
                            Sugestão da IA
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{suggestion}</p>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                onClick={acceptSuggestion}
                                className="gap-1"
                            >
                                <Check className="h-3 w-3" />
                                Usar Esta Versão
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={rejectSuggestion}
                                className="gap-1"
                            >
                                <X className="h-3 w-3" />
                                Descartar
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => lastAction && handleAction(lastAction)}
                                disabled={isLoading}
                                className="gap-1"
                            >
                                <RefreshCw className="h-3 w-3" />
                                Tentar Novamente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Error */}
            {assistMutation.isError && (
                <p className="text-xs text-destructive">
                    Erro ao processar. Tente novamente.
                </p>
            )}
        </div>
    )
}
