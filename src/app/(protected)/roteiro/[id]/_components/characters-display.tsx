'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Info } from 'lucide-react'

interface Character {
    id: string
    name: string
    description?: string
    imageUrl?: string
    thumbnailUrl?: string
}

interface CharactersDisplayProps {
    characters: Character[]
    characterDescription?: string // fallback se array vazio
}

export function CharactersDisplay({ characters, characterDescription }: CharactersDisplayProps) {
    // Não mostrar nada se não houver nem personagens nem descrição
    if (characters.length === 0 && !characterDescription) {
        return null
    }

    return (
        <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
                    <Users className="h-4 w-4 text-primary" />
                    PERSONAGENS
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                {characters.length > 0 ? (
                    <>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {characters.map((character) => (
                                <TooltipProvider key={character.id}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-col items-center gap-2 min-w-[70px]">
                                                <Avatar className="h-14 w-14 border-2 border-border hover:border-primary/50 transition-all cursor-pointer shadow-sm">
                                                    <AvatarImage
                                                        src={character.thumbnailUrl || character.imageUrl}
                                                        alt={character.name}
                                                        className="object-cover"
                                                    />
                                                    <AvatarFallback className="bg-primary/5 text-primary text-sm font-bold">
                                                        {character.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-[10px] font-semibold text-center line-clamp-1 text-muted-foreground w-full">
                                                    {character.name}
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        {character.description && (
                                            <TooltipContent side="bottom" className="max-w-xs p-3 bg-popover border-border shadow-md">
                                                <p className="text-xs leading-relaxed">{character.description}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5 opacity-70">
                            <Info className="h-3 w-3" />
                            Passe o mouse sobre os avatares para detalhes
                        </p>
                    </>
                ) : (
                    <div className="space-y-2 py-1">
                        <p className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-primary" />
                            Descrição Geral
                        </p>
                        <div className="bg-muted/30 border border-border/40 p-3 rounded-lg">
                            <p className="text-xs text-foreground/80 leading-relaxed italic">
                                "{characterDescription}"
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
