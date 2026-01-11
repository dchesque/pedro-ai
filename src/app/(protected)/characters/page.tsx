"use client"

import { useState } from "react"
import { useCharacters, useDeleteCharacter } from "@/hooks/use-characters"
import { CharacterCard } from "@/components/characters/CharacterCard"
import { CharacterDialog } from "@/components/characters/CharacterDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Users, Loader2 } from "lucide-react"
import { Character } from "../../../../prisma/generated/client_final"
import { useToast } from "@/hooks/use-toast"

export default function CharactersPage() {
    const { data, isLoading, error } = useCharacters()
    const deleteMutation = useDeleteCharacter()
    const { toast } = useToast()

    const [search, setSearch] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCharacter, setSelectedCharacter] = useState<Character | undefined>(undefined)

    const characters = data?.characters || []

    const filteredCharacters = characters.filter(char =>
        char.name.toLowerCase().includes(search.toLowerCase()) ||
        (char.description && char.description.toLowerCase().includes(search.toLowerCase()))
    )

    const handleEdit = (character: Character) => {
        setSelectedCharacter(character)
        setIsDialogOpen(true)
    }

    const handleCreate = () => {
        setSelectedCharacter(undefined)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id)
            toast({ title: "Personagem removido com sucesso" })
        } catch (e) {
            toast({ title: "Erro ao remover personagem", variant: "destructive" })
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-destructive/10 p-4">
                    <Users className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold">Erro ao carregar personagens</h3>
                <p className="text-muted-foreground max-w-sm">
                    Não foi possível buscar sua biblioteca de personagens. Tente novamente mais tarde.
                </p>
                <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </div>
        )
    }

    return (
        <div className="container py-8 max-w-7xl space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Personagens</h1>
                    <p className="text-muted-foreground mt-1">
                        Crie personagens consistentes para usar em seus shorts.
                    </p>
                </div>
                <Button onClick={handleCreate} className="shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Personagem
                </Button>
            </div>

            {/* Filters */}
            <div className="flex w-full items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome ou descrição..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            {filteredCharacters.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/10 dashed border-muted-foreground/25">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Nenhum personagem encontrado</h3>
                    <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                        {search
                            ? `Nenhum resultado para "${search}"`
                            : "Comece criando seu primeiro personagem para manter consistência nos seus vídeos."}
                    </p>
                    {!search && (
                        <Button onClick={handleCreate} variant="outline">
                            Criar Primeiro Personagem
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredCharacters.map((char) => (
                        <CharacterCard
                            key={char.id}
                            character={char}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Dialog */}
            <CharacterDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                character={selectedCharacter}
            />
        </div>
    )
}
