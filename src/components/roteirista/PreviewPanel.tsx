"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Eye, Palette, Thermometer, Layout, Users, FileText, ChevronDown } from 'lucide-react'
import type { ScriptFormData } from '@/lib/roteirista/types'
import type { Style, Climate } from '../../../prisma/generated/client_final'

interface PreviewPanelProps {
    data: Partial<ScriptFormData>;
    style?: any;
    climate?: any;
}

export function PreviewPanel({ data, style, climate }: PreviewPanelProps) {
    return (
        <Card className="sticky top-4 border-l-4 border-l-primary/50 shadow-sm">
            <CardHeader className="pb-3 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-wide text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    Preview do Roteiro
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 pt-4">
                {/* Título */}
                <div>
                    <p className="text-lg font-bold leading-tight">
                        {data.title || <span className="text-muted-foreground/50 italic">Sem título definido...</span>}
                    </p>
                    {data.title && (
                        <p className="text-xs text-muted-foreground mt-1">Título do Vídeo</p>
                    )}
                </div>

                <Separator />

                <div className="space-y-4">
                    {/* Bloco de Estilo */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="bg-primary/10 p-1 rounded">
                                <Palette className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span>Estilo Visual</span>
                        </div>
                        {style ? (
                            <div className="pl-8 space-y-1 text-xs text-muted-foreground">
                                <p className="font-medium text-foreground">{style.name}</p>
                                {style.scriptFunction && <p>• Função: {style.scriptFunction}</p>}
                                {style.hookType && <p>• Hook: {style.hookType}</p>}
                                {style.ctaType && <p>• CTA: {style.ctaType}</p>}
                            </div>
                        ) : (
                            <p className="pl-8 text-xs text-muted-foreground/50 italic">Não selecionado</p>
                        )}
                    </div>

                    {/* Bloco de Clima */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="bg-orange-500/10 p-1 rounded">
                                <Thermometer className="h-3.5 w-3.5 text-orange-500" />
                            </div>
                            <span>Clima Narrativo</span>
                        </div>
                        {climate ? (
                            <div className="pl-8 space-y-1 text-xs text-muted-foreground">
                                <p className="font-medium text-foreground">{climate.name}</p>
                                <p>• Estado: {climate.emotionalState || '-'}</p>
                                <p>• Revelação: {climate.revelationDynamic || '-'}</p>
                                <p>• Pressão: {climate.narrativePressure || '-'}</p>
                            </div>
                        ) : (
                            <p className="pl-8 text-xs text-muted-foreground/50 italic">Não selecionado</p>
                        )}
                    </div>

                    {/* Bloco de Formato */}
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <div className="bg-blue-500/10 p-1 rounded">
                                <Layout className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                            <span>Formato</span>
                        </div>
                        <div className="pl-8">
                            {data.format ? (
                                <p className="text-xs font-medium">{data.format}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground/50 italic">Padrão (SHORT)</p>
                            )}
                        </div>
                    </div>

                    {/* Personagens */}
                    {data.characterIds && data.characterIds.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <div className="bg-green-500/10 p-1 rounded">
                                    <Users className="h-3.5 w-3.5 text-green-500" />
                                </div>
                                <span>Personagens</span>
                            </div>
                            <div className="pl-8">
                                <p className="text-xs font-medium">{data.characterIds.length} selecionado(s)</p>
                            </div>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Sinopse (colapsável) */}
                {data.synopsis && (
                    <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors w-full group">
                            <FileText className="h-4 w-4" />
                            <span>Sinopse</span>
                            <ChevronDown className="h-3 w-3 ml-auto group-data-[state=open]:rotate-180 transition-transform" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                            <div className="pl-6 border-l-2 border-muted ml-2">
                                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">
                                    {data.synopsis}
                                </p>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </CardContent>
        </Card>
    );
}
