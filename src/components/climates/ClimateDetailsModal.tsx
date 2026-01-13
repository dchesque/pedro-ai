'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Climate } from '@/hooks/use-climates'
import { Edit2, Trash2 } from 'lucide-react'
import {
    EMOTIONAL_STATE_PROMPTS,
    REVELATION_DYNAMIC_PROMPTS,
    NARRATIVE_PRESSURE_PROMPTS
} from '@/lib/climate/behavior-mapping'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ClimateDetailsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    climate: Climate | null
    onEdit?: (climate: Climate) => void
    onDelete?: (id: string) => void
}

export function ClimateDetailsModal({ open, onOpenChange, climate, onEdit, onDelete }: ClimateDetailsModalProps) {
    if (!climate) return null

    const emotional = EMOTIONAL_STATE_PROMPTS[climate.emotionalState]
    const revelation = REVELATION_DYNAMIC_PROMPTS[climate.revelationDynamic]
    const pressure = NARRATIVE_PRESSURE_PROMPTS[climate.narrativePressure]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-5xl bg-background border-border text-foreground p-0 gap-0 overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/10">
                    <DialogHeader className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
                                        {climate.name}
                                    </DialogTitle>
                                    {climate.isSystem && (
                                        <Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-wider bg-secondary text-secondary-foreground">
                                            Sistema
                                        </Badge>
                                    )}
                                </div>
                                <DialogDescription className="text-base text-muted-foreground max-w-2xl leading-relaxed">
                                    {climate.description}
                                </DialogDescription>
                            </div>

                            {!climate.isSystem && (
                                <div className="flex items-center gap-2">
                                    {onEdit && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => onEdit(climate)}
                                            title="Editar Clima"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {onDelete && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                            onClick={() => onDelete(climate.id)}
                                            title="Excluir Clima"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </DialogHeader>
                </div>

                <ScrollArea className="max-h-[80vh]">
                    <div className="p-8 space-y-8">
                        {/* Behavioral Settings Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Emotional State */}
                            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-colors shadow-sm">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-6xl">{emotional?.icon}</span>
                                </div>
                                <div className="space-y-3 relative z-10">
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Estado Emocional</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-xl border border-primary/20 text-primary">
                                            {emotional?.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-base leading-none text-foreground">{emotional?.label || 'Não definido'}</span>
                                            <span className="text-xs text-muted-foreground mt-1">Tom predominante</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Revelation Dynamic */}
                            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 hover:border-blue-500/20 transition-colors shadow-sm">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-6xl">{revelation?.icon}</span>
                                </div>
                                <div className="space-y-3 relative z-10">
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Dinâmica de Revelação</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-xl border border-blue-500/20 text-blue-600">
                                            {revelation?.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-base leading-none text-foreground">{revelation?.label || 'Não definido'}</span>
                                            <span className="text-xs text-muted-foreground mt-1">Entrega de informação</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Narrative Pressure */}
                            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 hover:border-amber-500/20 transition-colors shadow-sm">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-6xl">{pressure?.icon}</span>
                                </div>
                                <div className="space-y-3 relative z-10">
                                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Pressão Narrativa</span>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-xl border border-amber-500/20 text-amber-600">
                                            {pressure?.icon}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-base leading-none text-foreground">{pressure?.label || 'Não definido'}</span>
                                            <span className="text-xs text-muted-foreground mt-1">Ritmo e densidade</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Technical Instructions */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    📋 Instruções Customizadas (System Prompt)
                                </h3>
                                <div className="bg-muted p-4 rounded-lg text-xs font-mono whitespace-pre-wrap border border-border">
                                    {climate.promptFragment}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    🎯 Preview do Comportamento
                                </h3>
                                <div className={cn(
                                    "p-4 rounded-lg text-xs font-mono border flex items-center gap-2",
                                    climate.behaviorPreview
                                        ? "bg-muted/50 border-border"
                                        : "bg-muted/20 border-border/50 text-muted-foreground italic"
                                )}>
                                    {climate.behaviorPreview || "Nenhum preview de comportamento definido para este clima."}
                                </div>
                            </div>

                        </div>
                    </div>

                </ScrollArea>
            </DialogContent>
        </Dialog >
    )
}
