"use client"

import React from 'react'
import { ShortFormat, FORMAT_LABELS, FORMAT_DESCRIPTIONS } from '@/types/scriptwriter'
import { cn } from '@/lib/utils'
import { Clock, Smartphone, Play, Video } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface FormatSelectorProps {
    value?: ShortFormat
    onChange: (format: ShortFormat) => void
    disabled?: boolean
}

const FORMAT_ICONS = {
    SHORT: Smartphone,
    REEL: Video,
    LONG: Play,
    YOUTUBE: Video
}

export function FormatSelector({ value, onChange, disabled }: FormatSelectorProps) {
    const formats: ShortFormat[] = ['SHORT', 'REEL', 'LONG', 'YOUTUBE']

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {formats.map((format) => {
                const Icon = FORMAT_ICONS[format]
                const isActive = value === format

                return (
                    <TooltipProvider key={format}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => onChange(format)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 text-left h-32 group",
                                        isActive
                                            ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]"
                                            : "border-muted bg-card/50 hover:border-muted-foreground/30 hover:bg-muted/10",
                                        disabled && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <div className={cn(
                                        "mb-3 p-2 rounded-lg transition-colors",
                                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                                    )}>
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    <span className={cn(
                                        "text-sm font-bold block text-center",
                                        isActive ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {format}
                                    </span>

                                    <div className="flex items-center gap-1 mt-1 text-[10px] opacity-60">
                                        <Clock className="h-3 w-3" />
                                        <span>{FORMAT_LABELS[format].split('(')[1].replace(')', '')}</span>
                                    </div>

                                    {isActive && (
                                        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[200px] text-xs text-center">
                                {FORMAT_DESCRIPTIONS[format]}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            })}
        </div>
    )
}
