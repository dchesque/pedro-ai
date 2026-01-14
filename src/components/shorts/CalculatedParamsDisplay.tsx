"use client"

import React, { useState, useEffect } from 'react'
import { ShortFormat } from '@/types/scriptwriter'
import { calculateSceneParams, getFormatLimits } from '@/lib/shorts/scene-calculator'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Info, Settings, AlertTriangle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { NarrativePressure } from '../../../prisma/generated/client_final'

interface CalculatedParamsDisplayProps {
    format: ShortFormat
    pressure?: NarrativePressure
    advancedMode?: {
        enabled: boolean
        maxScenes?: number
        avgSceneDuration?: number
    }
    onChange: (advancedMode: { enabled: boolean; maxScenes?: number; avgSceneDuration?: number }) => void
}

export function CalculatedParamsDisplay({
    format,
    pressure = 'FLUID',
    advancedMode,
    onChange
}: CalculatedParamsDisplayProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const params = calculateSceneParams(format, pressure)
    const limits = getFormatLimits(format)

    const isOverridden = advancedMode?.enabled && (!!advancedMode.maxScenes || !!advancedMode.avgSceneDuration)

    const currentScenes = advancedMode?.enabled && advancedMode.maxScenes ? advancedMode.maxScenes : params.maxScenes
    const currentDuration = advancedMode?.enabled && advancedMode.avgSceneDuration ? advancedMode.avgSceneDuration : params.avgSceneDuration
    const totalDuration = currentScenes * currentDuration

    const handleToggleAdvanced = () => {
        const newState = {
            ...advancedMode,
            enabled: !advancedMode?.enabled
        }
        onChange(newState as any)
        if (!isExpanded) setIsExpanded(true)
    }

    const handleReset = () => {
        onChange({
            enabled: false,
            maxScenes: undefined,
            avgSceneDuration: undefined
        })
    }

    return (
        <Card className={cn(
            "border-dashed bg-primary/5 transition-all duration-300 overflow-hidden",
            isOverridden ? "border-amber-500/50 bg-amber-500/5" : "border-primary/30"
        )}>
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Info className={cn("h-4 w-4", isOverridden ? "text-amber-500" : "text-primary")} />
                        <h4 className="text-sm font-semibold">Parâmetros do Roteiro</h4>
                        {isOverridden && (
                            <Badge variant="outline" className="text-[10px] h-4 border-amber-500/30 text-amber-600 bg-amber-500/10">
                                Customizado
                            </Badge>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs gap-1.5 opacity-70 hover:opacity-100"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {isExpanded ? "Ocultar" : "Detalhes"}
                    </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase font-medium text-muted-foreground">Cenas</p>
                        <p className="text-xl font-bold">{currentScenes}</p>
                    </div>
                    <div className="space-y-1 border-x border-border/50">
                        <p className="text-[10px] uppercase font-medium text-muted-foreground">Média/Cena</p>
                        <p className="text-xl font-bold">{currentDuration}s</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] uppercase font-medium text-muted-foreground">Total Est.</p>
                        <p className="text-xl font-bold text-primary">{totalDuration}s</p>
                    </div>
                </div>

                {isExpanded && (
                    <div className="pt-4 border-t border-border/50 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Settings className="h-3 w-3" />
                                <span>Configurações Técnicas</span>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-7 text-[10px] uppercase font-bold gap-1.5",
                                    advancedMode?.enabled ? "bg-amber-500 text-white border-none hover:bg-amber-600" : ""
                                )}
                                onClick={handleToggleAdvanced}
                            >
                                Modo Avançado
                            </Button>
                        </div>

                        {advancedMode?.enabled ? (
                            <div className="p-3 rounded-lg bg-background/50 border border-amber-500/20 space-y-4">
                                <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-700">
                                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                                    <p>Alterar estes valores pode afetar a qualidade e o ritmo planejado para o Clima selecionado.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[11px]">Máximo de Cenas</Label>
                                        <Input
                                            type="number"
                                            min={limits.scenes.min}
                                            max={limits.scenes.max}
                                            value={advancedMode.maxScenes ?? params.maxScenes}
                                            onChange={(e) => onChange({ ...advancedMode, maxScenes: parseInt(e.target.value) })}
                                            className="h-8 text-sm"
                                        />
                                        <p className="text-[9px] text-muted-foreground">Sugerido: {params.maxScenes}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px]">Segundos por Cena</Label>
                                        <Input
                                            type="number"
                                            min={limits.duration.min}
                                            max={limits.duration.max}
                                            value={advancedMode.avgSceneDuration ?? params.avgSceneDuration}
                                            onChange={(e) => onChange({ ...advancedMode, avgSceneDuration: parseInt(e.target.value) })}
                                            className="h-8 text-sm"
                                        />
                                        <p className="text-[9px] text-muted-foreground">Faixa: {limits.duration.min}-{limits.duration.max}s</p>
                                    </div>
                                </div>

                                {isOverridden && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-7 text-[10px] gap-1.5 text-muted-foreground"
                                        onClick={handleReset}
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        Restaurar Padrões Calculados
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <p className="text-[11px] text-muted-foreground italic text-center py-2">
                                Parâmetros otimizados automaticamente para o formato <strong>{format}</strong> com ritmo <strong>{pressure}</strong>.
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
