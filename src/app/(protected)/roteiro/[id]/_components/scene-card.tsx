'use client'

import React from "react"
import { Clock, ImageIcon, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface SceneCardProps {
    scene: any
    index: number
    isSelected: boolean
    onClick: () => void
}

export function SceneCard({ scene, index, isSelected, onClick }: SceneCardProps) {
    const isGenerating = scene.status === 'GENERATING' // Exemplo
    const hasError = !!scene.errorMessage

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative w-[160px] md:w-[180px] aspect-[9/16] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group",
                isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-2xl scale-[1.02] z-10"
                    : "opacity-70 hover:opacity-100 hover:scale-[1.01] border border-border/50"
            )}
        >
            {/* Background Media / Placeholder */}
            <div className="absolute inset-0 bg-muted">
                {scene.mediaUrl ? (
                    <img
                        src={scene.mediaUrl}
                        alt={`Cena ${index + 1}`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        {isGenerating ? (
                            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                        ) : hasError ? (
                            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                        ) : (
                            <ImageIcon className="h-8 w-8 text-muted-foreground/30 mb-2" />
                        )}
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            {isGenerating ? 'Gerando...' : hasError ? 'Erro' : 'Aguardando'}
                        </span>
                    </div>
                )}
            </div>

            {/* Overlays */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 h-1/3 flex flex-col justify-end">
                <p className="text-[10px] text-white/90 font-medium line-clamp-2 leading-tight">
                    {scene.narration}
                </p>
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2">
                <Badge className="bg-black/50 backdrop-blur-md text-white border-none h-5 px-1.5 font-bold text-[10px]">
                    {index + 1}
                </Badge>
            </div>

            <div className="absolute top-2 right-2">
                {scene.isGenerated ? (
                    <div className="bg-emerald-500 text-white rounded-full p-0.5 shadow-lg">
                        <CheckCircle className="h-3 w-3" />
                    </div>
                ) : (
                    <Badge className="bg-black/50 backdrop-blur-md text-white border-none h-5 px-1.5 font-bold text-[10px] gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {scene.duration}s
                    </Badge>
                )}
            </div>

            {/* Selection Glow */}
            {isSelected && (
                <div className="absolute inset-0 bg-primary/10 pointer-events-none" />
            )}
        </div>
    )
}
