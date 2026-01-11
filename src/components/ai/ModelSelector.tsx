'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAIModels } from '@/hooks/use-ai-models'

interface ModelSelectorProps {
    value: string
    onChange: (modelId: string) => void
    disabled?: boolean
    className?: string
}

export function ModelSelector({
    value,
    onChange,
    disabled,
    className,
}: ModelSelectorProps) {
    const { data: models, isLoading } = useAIModels()

    const selectedModel = models?.find((m) => m.id === value)

    if (isLoading) {
        return <div className="h-10 w-full animate-pulse bg-muted rounded-md" />
    }

    const freeModels = models?.filter((m) => m.tier === 'free') || []
    const standardModels = models?.filter((m) => m.tier === 'standard') || []
    const premiumModels = models?.filter((m) => m.tier === 'premium') || []

    return (
        <div className={cn("space-y-2", className)}>
            <label className="text-sm font-medium flex items-center gap-2">
                <span>🤖</span> Modelo de IA
            </label>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between h-auto py-3 px-4 text-left font-normal border-2 hover:border-primary/50 transition-all"
                        disabled={disabled}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{selectedModel?.icon || '🤖'}</span>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm leading-tight">
                                    {selectedModel?.name || 'Selecionar Modelo'}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                    {selectedModel?.isFree ? (
                                        <span className="text-green-600">GRÁTIS • Recomendado</span>
                                    ) : (
                                        <span>{selectedModel?.creditsPerUse} créditos • {selectedModel?.tier}</span>
                                    )}
                                </span>
                            </div>
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-[350px]" align="start">
                    {/* FREE */}
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                        Gratuito
                    </DropdownMenuLabel>
                    {freeModels.map((model) => (
                        <ModelItem
                            key={model.id}
                            model={model}
                            isSelected={value === model.id}
                            onSelect={() => onChange(model.id)}
                        />
                    ))}

                    {/* STANDARD */}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                        Standard
                    </DropdownMenuLabel>
                    {standardModels.map((model) => (
                        <ModelItem
                            key={model.id}
                            model={model}
                            isSelected={value === model.id}
                            onSelect={() => onChange(model.id)}
                        />
                    ))}

                    {/* PREMIUM */}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                        Premium
                    </DropdownMenuLabel>
                    {premiumModels.map((model) => (
                        <ModelItem
                            key={model.id}
                            model={model}
                            isSelected={value === model.id}
                            onSelect={() => onChange(model.id)}
                        />
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

function ModelItem({
    model,
    isSelected,
    onSelect
}: {
    model: any,
    isSelected: boolean,
    onSelect: () => void
}) {
    return (
        <DropdownMenuItem
            className={cn(
                "flex items-start gap-3 p-3 cursor-pointer focus:bg-accent/50",
                isSelected && "bg-accent/50"
            )}
            onClick={onSelect}
        >
            <div className="flex-shrink-0 text-xl mt-0.5">{model.icon}</div>
            <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm truncate">{model.name}</span>
                    <div className="flex items-center gap-2">
                        {model.badge && (
                            <Badge variant={model.tier === 'premium' ? 'default' : 'secondary'} className="text-[9px] h-4 px-1 pr-1.5">
                                {model.badge}
                            </Badge>
                        )}
                        {isSelected && <Check className="h-3 w-3 text-primary" />}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                    {model.description}
                </p>
                <div className="text-[10px] font-bold uppercase tracking-tighter">
                    {model.isFree ? (
                        <span className="text-green-600">GRÁTIS</span>
                    ) : (
                        <span className="text-muted-foreground">{model.creditsPerUse} créditos</span>
                    )}
                </div>
            </div>
        </DropdownMenuItem>
    )
}
