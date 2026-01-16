'use client'

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
    Zap,
    FileText,
    Target,
    Settings2,
    Coins,
    User as UserIcon,
    ChevronRight,
    Eye
} from "lucide-react"
import { CharactersDisplay } from "./characters-display"
import { cn } from "@/lib/utils"

interface RoteiroSummaryCardProps {
    hook: string | null
    summary: string | null
    cta: string | null
    style?: { name: string; icon?: string }
    climate?: { name: string; icon?: string }
    modelUsed: string
    totalDuration: number
    sceneCount: number
    characters: any[]
    characterDescription?: string
    onViewNarration: () => void
}

export function RoteiroSummaryCard({
    hook,
    summary,
    cta,
    style,
    climate,
    modelUsed,
    totalDuration,
    sceneCount,
    characters,
    characterDescription,
    onViewNarration
}: RoteiroSummaryCardProps) {
    return (
        <Card className="overflow-hidden border-border/50 bg-card/30 backdrop-blur-sm shadow-xl shadow-black/5">
            <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-12">
                    {/* Lado Esquerdo: Conteúdo Narrativo */}
                    <div className="md:col-span-7 p-6 space-y-6">
                        <div className="space-y-4">
                            <section className="group">
                                <div className="flex items-center gap-2 mb-2 text-amber-500 font-bold text-xs uppercase tracking-tighter">
                                    <Zap className="h-3.5 w-3.5 fill-current" />
                                    Hook (Abertura)
                                </div>
                                <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl group-hover:bg-amber-500/10 transition-colors">
                                    <p className="text-sm font-medium italic leading-relaxed text-foreground/90">
                                        {hook || "Nenhum hook definido."}
                                    </p>
                                </div>
                            </section>

                            <section className="group">
                                <div className="flex items-center gap-2 mb-2 text-indigo-500 font-bold text-xs uppercase tracking-tighter">
                                    <FileText className="h-3.5 w-3.5 fill-current" />
                                    Sinopse / Resumo
                                </div>
                                <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl group-hover:bg-indigo-500/10 transition-colors">
                                    <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4 group-hover:line-clamp-none transition-all">
                                        {summary || "Nenhum resumo disponível."}
                                    </p>
                                </div>
                            </section>

                            <section className="group">
                                <div className="flex items-center gap-2 mb-2 text-emerald-500 font-bold text-xs uppercase tracking-tighter">
                                    <Target className="h-3.5 w-3.5 fill-current" />
                                    CTA (Encerrando)
                                </div>
                                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl group-hover:bg-emerald-500/10 transition-colors text-right">
                                    <p className="text-sm font-medium italic leading-relaxed text-foreground/90">
                                        {cta || "Nenhum CTA definido."}
                                    </p>
                                </div>
                            </section>
                        </div>

                        {(characters.length > 0 || characterDescription) && (
                            <div className="pt-4 border-t border-border/50">
                                <CharactersDisplay
                                    characters={characters}
                                    characterDescription={characterDescription}
                                />
                            </div>
                        )}
                    </div>

                    {/* Lado Direito: Configurações e Créditos */}
                    <div className="md:col-span-5 bg-muted/30 p-6 border-l border-border/50 space-y-6">
                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <Settings2 className="h-3.5 w-3.5" />
                                Configurações
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Estilo</div>
                                    <div className="text-sm flex items-center gap-1.5 font-semibold">
                                        <span>{style?.icon || "🎨"}</span>
                                        {style?.name || "Padrão"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Clima</div>
                                    <div className="text-sm flex items-center gap-1.5 font-semibold">
                                        <span>{climate?.icon || "🎭"}</span>
                                        {climate?.name || "Neutro"}
                                    </div>
                                </div>
                                <div className="space-y-1 col-span-2">
                                    <div className="text-[10px] text-muted-foreground uppercase font-bold">Modelo IA</div>
                                    <div className="text-xs bg-background/50 border border-border/50 px-2 py-1 rounded-md inline-block font-mono">
                                        {modelUsed}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-border/50" />

                        <div className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <Coins className="h-3.5 w-3.5" />
                                Estimativa de Créditos
                            </h4>
                            <div className="bg-background/40 p-3 rounded-lg border border-border/30 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Roteiro (Base):</span>
                                    <span className="font-bold text-emerald-500">GRÁTIS ✓</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Imagens ({sceneCount} cenas):</span>
                                    <span className="font-bold">{sceneCount * 5} tokens</span>
                                </div>
                                <Separator className="my-1 opacity-50" />
                                <div className="flex justify-between text-sm font-bold">
                                    <span>TOTAL ESTIMADO:</span>
                                    <span className="text-primary">{sceneCount * 5} créditos</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                variant="outline"
                                className="w-full bg-background/50 hover:bg-primary hover:text-primary-foreground transition-all group"
                                onClick={onViewNarration}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Narração Completa
                                <ChevronRight className="ml-auto h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
