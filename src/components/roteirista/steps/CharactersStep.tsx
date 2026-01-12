"use client"

import React from 'react'
import { Plus, X, User, Wand2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCharacters } from '@/hooks/use-characters'
import type { ScriptFormData } from '@/lib/roteirista/types'

interface CharactersStepProps {
    data: Partial<ScriptFormData>
    onChange: (data: Partial<ScriptFormData>) => void
}

export function CharactersStep({ data, onChange }: CharactersStepProps) {
    const { data: charactersData, isLoading } = useCharacters()
    const characters = charactersData?.characters || []
    const [dialogOpen, setDialogOpen] = React.useState(false)

    const selectedIds = data.characterIds || []

    const toggleCharacter = (id: string) => {
        const newIds = selectedIds.includes(id)
            ? selectedIds.filter((i) => i !== id)
            : [...selectedIds, id]
        onChange({ ...data, characterIds: newIds })
    }

    const selectedCharacters = characters.filter((c) => selectedIds.includes(c.id))

    return (
        <div className="space-y-6">
            {/* Selected Characters */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>Personagens Selecionados</Label>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Da Biblioteca
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Selecionar Personagens</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="h-[400px] pr-4">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                ) : characters && characters.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {characters.map((character) => {
                                            const isSelected = selectedIds.includes(character.id)
                                            return (
                                                <Card
                                                    key={character.id}
                                                    className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                                                        }`}
                                                    onClick={() => toggleCharacter(character.id)}
                                                >
                                                    <CardContent className="p-3 flex items-center gap-3">
                                                        {character.imageUrl ? (
                                                            <img
                                                                src={character.imageUrl}
                                                                alt={character.name}
                                                                className="w-12 h-12 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                                                <User className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium truncate">{character.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">
                                                                {character.description || 'Sem descrição'}
                                                            </p>
                                                        </div>
                                                        {isSelected && (
                                                            <Badge variant="default" className="shrink-0">
                                                                ✓
                                                            </Badge>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                                        <User className="h-8 w-8 mb-2" />
                                        <p>Nenhum personagem na biblioteca</p>
                                        <Button variant="link" size="sm" asChild>
                                            <a href="/characters">Criar personagem</a>
                                        </Button>
                                    </div>
                                )}
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Selected List */}
                {selectedCharacters.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {selectedCharacters.map((character) => (
                            <Badge
                                key={character.id}
                                variant="secondary"
                                className="gap-2 py-1.5 px-3"
                            >
                                {character.imageUrl && (
                                    <img
                                        src={character.imageUrl}
                                        alt=""
                                        className="w-5 h-5 rounded-full"
                                    />
                                )}
                                {character.name}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleCharacter(character.id)
                                    }}
                                    className="hover:text-destructive ml-1"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic">
                        Nenhum personagem selecionado. Você pode selecionar da biblioteca ou descrever abaixo.
                    </p>
                )}
            </div>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Ou descreva os personagens
                    </span>
                </div>
            </div>

            {/* Manual Description */}
            <div className="space-y-2">
                <Label htmlFor="charactersDescription">
                    Descrição dos Personagens (opcional)
                </Label>
                <Textarea
                    id="charactersDescription"
                    value={data.charactersDescription || ''}
                    onChange={(e) => onChange({ ...data, charactersDescription: e.target.value })}
                    placeholder="Descreva os personagens que aparecerão na história. A IA usará essa descrição para manter consistência nas cenas.

Ex: O protagonista é um guerreiro de 30 anos, cabelo longo escuro, armadura de prata. O vilão é um mago sombrio com capuz negro..."
                    rows={5}
                />
                <p className="text-xs text-muted-foreground">
                    Essa descrição será usada para manter os personagens consistentes em todas as cenas.
                </p>
            </div>

            {/* Info */}
            <Card className="bg-muted/30">
                <CardContent className="p-4 text-sm text-muted-foreground">
                    <p>
                        💡 <strong>Dica:</strong> Personagens da biblioteca têm descrições visuais
                        otimizadas que ajudam a manter consistência nas imagens geradas.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
