"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Palette, X } from 'lucide-react'
import type { Style } from '../../../prisma/generated/client_final'

interface StyleInfoCardProps {
    style: any;
    onClear?: () => void;
}

export function StyleInfoCard({ style, onClear }: StyleInfoCardProps) {
    if (!style) return null;

    return (
        <Card className="bg-muted/30 border-primary/20 relative group">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Palette className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">{style.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                                {style.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Badges informativos */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {style.hookType && (
                        <Badge variant="outline" className="text-[10px] h-5">
                            Hook: {style.hookType}
                        </Badge>
                    )}
                    {style.ctaType && (
                        <Badge variant="outline" className="text-[10px] h-5">
                            CTA: {style.ctaType}
                        </Badge>
                    )}
                    {style.scriptFunction && (
                        <Badge variant="secondary" className="text-[10px] h-5 bg-primary/5 hover:bg-primary/10">
                            {style.scriptFunction}
                        </Badge>
                    )}
                </div>

                {onClear && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClear}
                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
