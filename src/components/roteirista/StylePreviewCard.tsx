"use client"

import React from 'react'
import { Style } from '@/hooks/use-styles'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Layout, Tag, AlignLeft } from 'lucide-react'

interface StylePreviewCardProps {
    style: Style
}

export function StylePreviewCard({ style }: StylePreviewCardProps) {
    return (
        <Card className="border-primary/20 bg-primary/5 glass-panel mt-4 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{style.icon || '🎬'}</span>
                        <span className="font-semibold text-primary">{style.name}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Preview do Estilo</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                    {style.description || 'Este estilo define as regras personalizadas para sua narrativa e visual.'}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-muted-foreground border-t border-primary/10 pt-3">
                    {style.suggestedTone && (
                        <div className="flex items-center gap-1.5">
                            <Tag className="h-3 w-3" />
                            <span>Tom: {style.suggestedTone.name}</span>
                        </div>
                    )}
                    {style.targetAudience && (
                        <div className="flex items-center gap-1.5">
                            <Layout className="h-3 w-3" />
                            <span>Público: {style.targetAudience}</span>
                        </div>
                    )}
                </div>

                {style.scriptwriterPrompt && (
                    <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground bg-card/50 p-2 rounded border border-primary/5">
                        <AlignLeft className="h-3 w-3 mt-0.5 shrink-0" />
                        <p className="line-clamp-2">"{style.scriptwriterPrompt}"</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
