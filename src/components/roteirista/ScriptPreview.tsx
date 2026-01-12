"use client"

import React from 'react'
import { Film, Users, Layers, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { ScriptFormData } from '@/lib/roteirista/types'

interface ScriptPreviewProps {
    data: Partial<ScriptFormData>
    className?: string
}

export function ScriptPreview({ data, className }: ScriptPreviewProps) {
    const totalDuration = data.scenes?.reduce((acc, s) => acc + (s.duration || 5), 0) || 0

    return (
        <Card className={cn('h-full', className)}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Film className="h-5 w-5" />
                    Preview do Roteiro
                </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-300px)] px-6">
                    <div className="space-y-4 pb-6">
                        {/* Título */}
                        {data.title ? (
                            <div>
                                <h2 className="text-xl font-bold">{data.title}</h2>
                                {data.tone && (
                                    <Badge variant="outline" className="mt-1">
                                        {data.tone}
                                    </Badge>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">Sem título ainda...</p>
                        )}

                        {/* Metadados */}
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            {data.scenes && data.scenes.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Layers className="h-4 w-4" />
                                    {data.scenes.length} cenas
                                </div>
                            )}
                            {data.characterIds && data.characterIds.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {data.characterIds.length} personagens
                                </div>
                            )}
                            {totalDuration > 0 && (
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    ~{totalDuration}s
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Sinopse */}
                        {data.synopsis ? (
                            <div>
                                <h3 className="text-sm font-semibold mb-1">Sinopse</h3>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {data.synopsis}
                                </p>
                            </div>
                        ) : data.theme ? (
                            <div>
                                <h3 className="text-sm font-semibold mb-1">Tema</h3>
                                <p className="text-sm text-muted-foreground">{data.theme}</p>
                            </div>
                        ) : null}

                        {/* Cenas */}
                        {data.scenes && data.scenes.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="text-sm font-semibold mb-3">Cenas</h3>
                                    <div className="space-y-3">
                                        {data.scenes.map((scene, index) => (
                                            <div
                                                key={scene.id}
                                                className="pl-3 border-l-2 border-muted space-y-1"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {index + 1}
                                                    </Badge>
                                                    {scene.duration && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {scene.duration}s
                                                        </span>
                                                    )}
                                                </div>
                                                {scene.narration && (
                                                    <p className="text-sm">{scene.narration}</p>
                                                )}
                                                {scene.visualPrompt && (
                                                    <p className="text-xs text-muted-foreground italic line-clamp-2">
                                                        🎨 {scene.visualPrompt}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
