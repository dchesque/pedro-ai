'use client'

import React from "react"
import { ChevronLeft, Play, Trash2, Edit, Loader2, Clock, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface RoteiroHeaderProps {
    title: string
    status: string
    totalDuration: number
    sceneCount: number
    styleName?: string
    onEdit: () => void
    onGenerateImages: () => void
    onDelete: () => void
    isGenerating: boolean
}

const STATUS_CONFIG: Record<string, { label: string, color: string, pulse?: boolean }> = {
    DRAFT: { label: 'Rascunho', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
    SCRIPT_READY: { label: 'Roteiro Pronto', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    SCRIPT_APPROVED: { label: 'Aprovado', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' },
    GENERATING_SCRIPT: { label: 'Escrevendo...', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', pulse: true },
    GENERATING_IMAGES: { label: 'Gerando Imagens...', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', pulse: true },
    GENERATING_MEDIA: { label: 'Processando...', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', pulse: true },
    COMPLETED: { label: 'Concluído', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    FAILED: { label: 'Erro', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

export function RoteiroHeader({
    title,
    status,
    totalDuration,
    sceneCount,
    styleName,
    onEdit,
    onGenerateImages,
    onDelete,
    isGenerating
}: RoteiroHeaderProps) {
    const router = useRouter()
    const config = STATUS_CONFIG[status] || { label: status, color: 'bg-muted text-muted-foreground' }

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.push("/shorts")}
                    className="rounded-xl hover:bg-primary/5 transition-colors"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        {title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge
                            variant="outline"
                            className={cn(
                                "font-bold uppercase tracking-wider text-[10px] px-2 py-0",
                                config.color,
                                config.pulse && "animate-pulse"
                            )}
                        >
                            {config.label}
                        </Badge>
                        <span className="text-muted-foreground/30">•</span>
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{totalDuration}s</span>
                        </div>
                        <span className="text-muted-foreground/30">•</span>
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                            <Film className="h-3.5 w-3.5" />
                            <span>{sceneCount} cenas</span>
                        </div>
                        {styleName && (
                            <>
                                <span className="text-muted-foreground/30">•</span>
                                <span className="text-primary/70 font-semibold italic">{styleName}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" className="hover:bg-primary/5 text-muted-foreground" onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                </Button>

                {status === 'SCRIPT_APPROVED' && (
                    <Button
                        onClick={onGenerateImages}
                        disabled={isGenerating}
                        className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all rounded-xl"
                    >
                        {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="mr-2 h-4 w-4 fill-current" />
                        )}
                        Gerar Imagens
                    </Button>
                )}

                <Button
                    variant="outline"
                    size="icon"
                    onClick={onDelete}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent hover:border-destructive/20 transition-all rounded-xl"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
