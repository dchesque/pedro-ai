"use client"

import React from "react"
import Link from "next/link"
import { Play, Trash2, RefreshCw, Clock, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import type { Short } from "@/hooks/use-shorts"

interface ShortCardProps {
    short: Short
    onGenerate: (step?: 'full' | 'script' | 'prompts' | 'media') => void
    onDelete: () => void
    isGenerating?: boolean
    isDeleting?: boolean
}

const STATUS_CONFIG = {
    DRAFT: { label: 'Rascunho', variant: 'secondary' as const, icon: AlertCircle },
    SCRIPTING: { label: 'Gerando roteiro...', variant: 'default' as const, icon: Loader2 },
    PROMPTING: { label: 'Gerando prompts...', variant: 'default' as const, icon: Loader2 },
    GENERATING: { label: 'Gerando mídias...', variant: 'default' as const, icon: Loader2 },
    COMPLETED: { label: 'Concluído', variant: 'success' as const, icon: CheckCircle },
    FAILED: { label: 'Falhou', variant: 'destructive' as const, icon: XCircle },
}

export function ShortCard({ short, onGenerate, onDelete, isGenerating, isDeleting }: ShortCardProps) {
    const status = STATUS_CONFIG[short.status] || STATUS_CONFIG.DRAFT
    const StatusIcon = status.icon
    const isProcessing = ['SCRIPTING', 'PROMPTING', 'GENERATING'].includes(short.status)
    const canRetry = short.status === 'FAILED' || short.status === 'DRAFT'

    const completedScenes = short.scenes.filter((s) => s.isGenerated).length
    const totalScenes = short.scenes.length

    return (
        <Card className="overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                        <CardTitle className="line-clamp-1 text-base">
                            {short.title || short.theme.slice(0, 50)}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                            {short.theme}
                        </p>
                    </div>
                    <Badge variant={status.variant as any} className="shrink-0 whitespace-nowrap">
                        <StatusIcon className={`mr-1 h-3 w-3 ${isProcessing ? 'animate-spin' : ''}`} />
                        {status.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="pb-3 flex-1">
                {/* Preview das cenas */}
                {short.scenes.length > 0 ? (
                    <div className="grid grid-cols-4 gap-1 rounded-lg overflow-hidden bg-muted/50 p-1">
                        {short.scenes.slice(0, 4).map((scene, idx) => (
                            <div
                                key={scene.id}
                                className="aspect-[9/16] bg-muted relative rounded-sm overflow-hidden"
                            >
                                {scene.mediaUrl ? (
                                    <img
                                        src={scene.mediaUrl}
                                        alt={`Cena ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                                        {scene.order + 1}
                                    </div>
                                )}
                            </div>
                        ))}
                        {short.scenes.length > 4 && (
                            <div className="col-span-4 text-center py-1 bg-muted/30 text-[10px] text-muted-foreground">
                                + {short.scenes.length - 4} mais cenas
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed">
                        Nenhuma cena ainda
                    </div>
                )}

                {/* Progresso */}
                {isProcessing && (
                    <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Processando...</span>
                            <span>{short.progress}%</span>
                        </div>
                        <Progress value={short.progress} className="h-1" />
                    </div>
                )}

                {/* Info */}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {short.targetDuration}s
                    </span>
                    <span>{totalScenes} cenas</span>
                    {short.status === 'COMPLETED' && (
                        <span className="text-emerald-600 font-medium">{completedScenes}/{totalScenes} ok</span>
                    )}
                </div>

                {/* Erro */}
                {short.errorMessage && (
                    <p className="mt-2 text-xs text-destructive line-clamp-2 bg-destructive/10 p-2 rounded">
                        {short.errorMessage}
                    </p>
                )}
            </CardContent>

            <CardFooter className="gap-2 pt-0">
                {short.status === 'COMPLETED' ? (
                    <Button asChild className="flex-1" size="sm">
                        <Link href={`/shorts/${short.id}`}>
                            <Play className="mr-2 h-4 w-4" />
                            Ver Short
                        </Link>
                    </Button>
                ) : canRetry ? (
                    <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => onGenerate('full')}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        {short.status === 'FAILED' ? 'Tentar Novamente' : 'Gerar Short'}
                    </Button>
                ) : (
                    <Button className="flex-1" size="sm" disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {status.label}
                    </Button>
                )}

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={isDeleting || isProcessing}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Deletar Short?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O short e todas as suas cenas serão permanentemente deletados.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Deletar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    )
}
