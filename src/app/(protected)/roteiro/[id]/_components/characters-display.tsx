'use client'

import React from "react"
import { Users, User as UserIcon, HelpCircle } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface Character {
    id: string
    name: string
    imageUrl?: string
    description?: string
}

interface CharactersDisplayProps {
    characters: Character[]
    characterDescription?: string
}

export function CharactersDisplay({ characters, characterDescription }: CharactersDisplayProps) {
    if (characters.length === 0 && !characterDescription) return null

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {characters.length > 0 ? 'Personagens no Roteiro' : 'Base do Personagem'}
            </div>

            {characters.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                    <TooltipProvider>
                        {characters.map((char) => (
                            <Tooltip key={char.id}>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 bg-background/50 border border-border/50 pl-1 pr-3 py-1 rounded-full hover:border-primary/50 transition-colors cursor-help group">
                                        <div className="h-8 w-8 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center">
                                            {char.imageUrl ? (
                                                <img
                                                    src={char.imageUrl}
                                                    alt={char.name}
                                                    className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                                                />
                                            ) : (
                                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <span className="text-xs font-semibold">{char.name}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-[200px] bg-popover/95 backdrop-blur-sm border-primary/20">
                                    <p className="text-xs font-medium">{char.description || "Personagem principal"}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </TooltipProvider>
                </div>
            ) : (
                <div className="bg-muted/50 border border-dashed border-border p-3 rounded-lg relative group">
                    <div className="flex gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                            {characterDescription}
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
