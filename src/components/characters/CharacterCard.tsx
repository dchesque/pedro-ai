import { Character } from "../../../prisma/generated/client_final"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Video } from "lucide-react"
import Image from "next/image"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface CharacterCardProps {
    character: Character
    onEdit: (character: Character) => void
    onDelete: (id: string) => void
}

export function CharacterCard({ character, onEdit, onDelete }: CharacterCardProps) {
    // Parse traits safely
    const traits = character.traits as Record<string, any> || {}
    const age = traits.age ? `${traits.age}` : null
    const gender = traits.gender ? (traits.gender === 'female' ? 'Feminino' : traits.gender === 'male' ? 'Masculino' : traits.gender) : null

    return (
        <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
                {character.imageUrl ? (
                    <Image
                        src={character.imageUrl}
                        alt={character.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Sem imagem
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-300" />

                <div className="absolute bottom-0 left-0 p-4 w-full">
                    <h3 className="font-bold text-lg text-white mb-1 truncate">{character.name}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-white/80">
                        {age && <span>{age}</span>}
                        {age && gender && <span>•</span>}
                        {gender && <span>{gender}</span>}
                    </div>
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Badge variant="secondary" className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border-none">
                        <Video className="w-3 h-3 mr-1" />
                        {character.usageCount} shorts
                    </Badge>
                </div>
            </div>

            <CardFooter className="p-3 gap-2 bg-muted/30">
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs font-medium hover:bg-primary/10 hover:text-primary"
                    onClick={() => onEdit(character)}
                >
                    <Edit2 className="w-3 h-3 mr-2" />
                    Editar
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Personagem?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. O personagem "{character.name}" será removido, mas shorts existentes que o utilizam não serão afetados visualmente, apenas perderão a referência.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => onDelete(character.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Excluir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    )
}
