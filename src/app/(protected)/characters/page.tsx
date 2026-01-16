"use client"

import { useState } from "react"
import { useCharacters, useDeleteCharacter } from "@/hooks/use-characters"
import { CharacterCard } from "@/components/characters/CharacterCard"
import { CharacterDialog } from "@/components/characters/CharacterDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Users, Loader2 } from "lucide-react"
import { Character } from "../../../../prisma/generated/client_final"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function CharactersPage() {
    const { data, isLoading, error } = useCharacters()
    const deleteMutation = useDeleteCharacter()
    const { toast } = useToast()
    const router = useRouter()

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
        <div className="relative min-h-screen">
            {/* Background elements for premium feel */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-rgb),0.05),transparent_40%)] pointer-events-none" />

            <div className="container relative py-12 max-w-7xl space-y-12">
                {/* Header Section */}
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-border/40 pb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Users className="h-6 w-6" />
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] font-black border-primary/20 text-primary">Biblioteca V3</Badge>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">Elenco de <span className="text-primary italic">Personagens</span></h1>
                        <p className="text-muted-foreground max-w-xl text-lg font-medium leading-relaxed">
                            Gerencie sua equipe de atores digitais para garantir consistência visual em todos os seus shorts gerados por IA.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push("/characters/novo")}
                        size="lg"
                        className="h-14 px-8 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 font-bold text-base gap-3"
                    >
                        <Plus className="h-5 w-5" />
                        Criar Novo Personagem
                    </Button>
                </div>

                {/* Search & Stats Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="relative w-full max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar por nome ou características..."
                            className="h-12 pl-12 pr-4 rounded-xl border-border/40 bg-card/50 backdrop-blur-sm focus:ring-primary/20 transition-all font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/20 px-4 py-2 rounded-full border border-border/20">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> {characters.length} Atores</span>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-primary/70">{filteredCharacters.length} Encontrados</span>
                    </div>
                </div>

                {/* Content Grid */}
                {filteredCharacters.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-32 text-center rounded-[3rem] bg-gradient-to-b from-muted/5 to-transparent border border-dashed border-border/50"
                    >
                        <div className="bg-primary/5 p-8 rounded-[2rem] mb-6 relative group">
                            <Users className="h-16 w-16 text-primary/20 group-hover:text-primary/40 transition-colors duration-500" />
                            <div className="absolute inset-0 bg-primary/10 rounded-[2rem] animate-ping opacity-10" />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">Cenário Vazio</h3>
                        <p className="text-muted-foreground max-w-sm mt-3 mb-8 font-medium leading-relaxed">
                            {search
                                ? `Nenhuma lenda encontrada com o termo "${search}". Tente buscar por traços genéricos.`
                                : "Seu elenco está vazio. Comece agora para dar vida e consistência visual aos seus vídeos curtos."}
                        </p>
                        {!search && (
                            <Button
                                onClick={() => router.push("/characters/novo")}
                                variant="outline"
                                className="h-12 px-6 rounded-xl font-bold border-primary/20 hover:bg-primary/5 hover:border-primary transition-all"
                            >
                                Iniciar Primeiro Registro
                            </Button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                        {filteredCharacters.map((char, index) => (
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
        </div>
    )
}
