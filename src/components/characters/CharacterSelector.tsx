import { useCharacters } from "@/hooks/use-characters"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Check, Plus, UserPlus, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CharacterSelectorProps {
    selectedCharacterIds: string[]
    onSelect: (characterId: string) => void
    onDeselect: (characterId: string) => void
}

export function CharacterSelector({ selectedCharacterIds, onSelect, onDeselect }: CharacterSelectorProps) {
    const { data, isLoading } = useCharacters()
    const router = useRouter()

    const characters = data?.characters || []

    if (isLoading) {
        return <div className="h-20 w-full animate-pulse bg-muted rounded-md" />
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Personagens</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-primary"
                    onClick={() => router.push('/characters/novo')}
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Novo
                </Button>
            </div>

            <div className="flex flex-wrap gap-2">
                {characters.map((char) => {
                    const isSelected = selectedCharacterIds.includes(char.id)
                    return (
                        <div
                            key={char.id}
                            onClick={() => isSelected ? onDeselect(char.id) : onSelect(char.id)}
                            className={cn(
                                "group relative flex items-center space-x-2 rounded-lg border p-2 pr-3 cursor-pointer transition-all duration-200 select-none",
                                isSelected
                                    ? "bg-primary/10 border-primary shadow-sm"
                                    : "bg-background border-border hover:border-primary/50 hover:bg-muted/50"
                            )}
                        >
                            <Avatar className="h-8 w-8 rounded-md border">
                                <AvatarImage src={char.imageUrl} className="object-cover" />
                                <AvatarFallback>{char.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className={cn("text-sm font-medium", isSelected && "text-primary")}>
                                {char.name}
                            </span>
                            {isSelected && (
                                <div className="bg-primary text-primary-foreground rounded-full p-0.5 ml-1">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </div>
                    )
                })}

                {characters.length === 0 && (
                    <Button
                        variant="outline"
                        className="h-12 border-dashed w-full text-muted-foreground"
                        onClick={() => router.push('/characters/novo')}
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Criar seu primeiro personagem
                    </Button>
                )}
            </div>

        </div>
    )
}
