"use client"

import { ShortScene } from "@/hooks/use-shorts"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    MoreVertical,
    GripVertical,
    Clock,
    Mic2,
    Eye,
    Edit3,
    RefreshCcw,
    Trash2,
    Copy,
    ChevronUp,
    ChevronDown
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface SceneCardProps {
    scene: ShortScene
    index: number
    onEdit: () => void
    onRegenerate: () => void
    onDuplicate?: () => void
    onMoveUp?: () => void
    onMoveDown?: () => void
    onRemove: () => void
    canMoveUp?: boolean
    canMoveDown?: boolean
    isGenerating?: boolean
}

export function SceneCard({
    scene,
    index,
    onEdit,
    onRegenerate,
    onDuplicate,
    onMoveUp,
    onMoveDown,
    onRemove,
    canMoveUp,
    canMoveDown,
    isGenerating
}: SceneCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: scene.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style}>
            <Card className="p-4 relative group hover:border-primary/50 transition-colors">
                <div className="flex gap-4">
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex items-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary"
                    >
                        <GripVertical className="w-5 h-5" />
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                                    Cena {index + 1}
                                </span>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>{scene.duration}s</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={onEdit}>
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={onRegenerate}>
                                            <RefreshCcw className="w-4 h-4 mr-2" />
                                            Regenerar com IA
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={onDuplicate}>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Duplicar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={onMoveUp}
                                            disabled={!canMoveUp}
                                        >
                                            <ChevronUp className="w-4 h-4 mr-2" />
                                            Mover para cima
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={onMoveDown}
                                            disabled={!canMoveDown}
                                        >
                                            <ChevronDown className="w-4 h-4 mr-2" />
                                            Mover para baixo
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={onRemove}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remover
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <Mic2 className="w-3 h-3" />
                                    Narração
                                </div>
                                <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3 italic">
                                    "{scene.narration || 'Sem narração'}"
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <Eye className="w-3 h-3" />
                                    Descrição Visual
                                </div>
                                <p className="text-sm leading-relaxed text-foreground/80 line-clamp-3">
                                    {scene.visualDesc || 'Sem descrição visual'}
                                </p>
                            </div>
                        </div>

                        {scene.errorMessage && (
                            <div className="mt-2 text-xs text-destructive bg-destructive/5 p-2 rounded border border-destructive/20 font-medium">
                                Erro: {scene.errorMessage}
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
