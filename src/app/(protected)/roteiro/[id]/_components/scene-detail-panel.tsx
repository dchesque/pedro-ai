'use client'

import React from "react"
import { Edit, RefreshCcw, Copy, Clock, Target, Image as ImageIcon, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface SceneDetailPanelProps {
    scene: any
    sceneNumber: number
    totalScenes: number
    onEdit: () => void
    onRegenerate: () => void
    onCopyPrompt: () => void
}

export function SceneDetailPanel({
    scene,
    sceneNumber,
    totalScenes,
    onEdit,
    onRegenerate,
    onCopyPrompt
}: SceneDetailPanelProps) {
    if (!scene) return null

    const visualPrompt = scene.visualPrompt || scene.imagePrompt || scene.visualDesc

    return (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="h-7 w-7 rounded-full p-0 flex items-center justify-center font-bold">
                        {sceneNumber}
                    </Badge>
                    <div className="space-y-0.5">
                        <h4 className="text-sm font-bold uppercase tracking-tight">Cena {sceneNumber} de {totalScenes}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase">
                            <Clock className="h-3 w-3" />
                            {scene.duration} segundos de tela
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={onEdit}>
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Preview da Mídia */}
                <div className="relative aspect-[9/16] bg-muted rounded-xl overflow-hidden group shadow-xl max-w-[240px] mx-auto">
                    {scene.mediaUrl ? (
                        <img src={scene.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 text-center p-4">
                            <ImageIcon className="h-10 w-10 mb-2" />
                            <p className="text-[10px] font-bold uppercase">Sem imagem gerada</p>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                        <Button variant="secondary" size="sm" className="rounded-full font-bold" onClick={onRegenerate}>
                            <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                            Regenerar
                        </Button>
                    </div>
                </div>

                <Separator className="bg-border/30" />

                {/* Narração */}
                <section className="space-y-3">
                    <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                        <Sparkles className="h-3.5 w-3.5 fill-current" />
                        Narração
                    </h5>
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-sm leading-relaxed font-medium">
                            "{scene.narration}"
                        </p>
                    </div>
                </section>

                {/* Objetivo / Goal (se houver) */}
                {scene.goal && (
                    <section className="space-y-3">
                        <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-500">
                            <Target className="h-3.5 w-3.5" />
                            Objetivo da Cena
                        </h5>
                        <p className="text-xs text-muted-foreground leading-relaxed px-1">
                            {scene.goal}
                        </p>
                    </section>
                )}

                {/* Prompt Visual */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            <ImageIcon className="h-3.5 w-3.5" />
                            Prompt Visual (AI)
                        </h5>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCopyPrompt}>
                            <Copy className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg border border-border/50">
                        <p className="text-[11px] font-mono text-muted-foreground leading-normal italic">
                            {visualPrompt || "Prompt ainda não gerado."}
                        </p>
                    </div>
                </section>
            </div>

            <div className="p-4 bg-muted/20 border-t border-border/50">
                <Button className="w-full rounded-xl font-bold" variant="outline" onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Estilo e Texto
                </Button>
            </div>
        </div>
    )
}
