"use client"

import { Character } from "../../../prisma/generated/client_final"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Video, Calendar, User, Eye } from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
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
        <div className="group h-full">
            <Card className="relative h-full overflow-hidden border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/50 transition-colors duration-500 shadow-sm hover:shadow-md">
                {/* Image Section */}
                <div className="relative aspect-[3/4] w-full overflow-hidden">
                    {character.imageUrl ? (
                        <Image
                            src={character.imageUrl}
                            alt={character.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-2">
                            <User className="w-8 h-8 opacity-20" />
                            <span className="text-xs font-medium uppercase tracking-widest opacity-50">Sem Imagem</span>
                        </div>
                    )}

                    {/* Gradient Overlay - Multi-layered for depth */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90" />

                    {/* Usage Badge - Floating Top Right */}
                    <div className="absolute top-3 right-3 z-10">
                        <Badge variant="secondary" className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-xl border-white/10 shadow-xl px-2.5 py-1">
                            <Video className="w-3.5 h-3.5 mr-1.5 text-primary" />
                            <span className="font-bold">{character.usageCount}</span>
                        </Badge>
                    </div>

                    {/* Name and Basic Info - Floating Glass Card Style */}
                    <div className="absolute bottom-0 left-0 p-5 w-full z-10">
                        <h3 className="font-black text-xl text-white mb-2 leading-tight drop-shadow-lg">
                            {character.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-wider font-bold text-white/90">
                                <Calendar className="w-3 h-3 text-primary/80" />
                                {age || "N/A"}
                            </div>
                            <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-wider font-bold text-white/90">
                                <User className="w-3 h-3 text-primary/80" />
                                {gender || "N/A"}
                            </div>
                        </div>

                        {/* Description - Short reveal on hover */}
                        <div className="mt-4">
                            <p className="text-xs text-white/70 line-clamp-2 leading-relaxed font-medium italic">
                                "{character.description || 'Sem descrição definida.'}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions Footer - Minimal Icons */}
                <div className="p-3 bg-muted/10 border-t border-border/50 flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        onClick={() => onEdit(character)}
                        title="Ver Detalhes"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                        onClick={() => onEdit(character)}
                        title="Editar Personagem"
                    >
                        <Edit2 className="w-4 h-4" />
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                title="Remover Personagem"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-border/40 max-w-sm rounded-[2rem]">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-black">Remover Lenda?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-medium leading-relaxed">
                                    O personagem <span className="text-foreground font-bold underline decoration-primary/30">"{character.name}"</span> será removido da biblioteca.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="font-bold gap-3 mt-4">
                                <AlertDialogCancel className="rounded-full h-11 border-none bg-muted/50 hover:bg-muted">Manter</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => onDelete(character.id)}
                                    className="rounded-full h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                                >
                                    Remover
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </Card>
        </div>
    )
}
