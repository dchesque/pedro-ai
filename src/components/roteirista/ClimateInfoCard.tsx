"use client"

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Thermometer, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Climate } from '../../../prisma/generated/client_final'

interface ClimateInfoCardProps {
    climate: any;
    onClear?: () => void;
}

export function ClimateInfoCard({ climate, onClear }: ClimateInfoCardProps) {
    if (!climate) return null;

    const pressureColors: Record<string, string> = {
        SLOW: 'text-blue-500',
        FLUID: 'text-green-500',
        FAST: 'text-orange-500'
    };

    return (
        <Card className="bg-muted/30 border-primary/20 relative group">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                            <Thermometer className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="font-semibold">{climate.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                                {climate.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Indicadores comportamentais */}
                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="p-1 px-2 rounded bg-background/50 border border-border/50">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Estado</p>
                        <p className="text-[11px] font-medium truncate">{climate.emotionalState}</p>
                    </div>
                    <div className="p-1 px-2 rounded bg-background/50 border border-border/50">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Revelação</p>
                        <p className="text-[11px] font-medium truncate">{climate.revelationDynamic}</p>
                    </div>
                    <div className="p-1 px-2 rounded bg-background/50 border border-border/50">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Pressão</p>
                        <p className={cn("text-[11px] font-medium truncate", climate.narrativePressure && pressureColors[climate.narrativePressure])}>
                            {climate.narrativePressure}
                        </p>
                    </div>
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
