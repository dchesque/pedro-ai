"use client"

import React from 'react'
import {
    MoreVertical,
    Edit2,
    Copy,
    Trash2,
    Clock,
    Layout,
    Tag,
    Video
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { Style, useDeleteStyle, useDuplicateStyle } from '@/hooks/use-styles'

interface StyleCardProps {
    style: Style
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
    news: 'Notícias',
    story: 'Histórias',
    meme: 'Memes',
    educational: 'Educativo',
    motivational: 'Motivacional',
    tutorial: 'Tutorial',
    custom: 'Personalizado',
}

export function StyleCard({ style }: { style: Style }) {
    const { userId } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const deleteMutation = useDeleteStyle()
    const duplicateMutation = useDuplicateStyle()

    const isSystem = !style.userId || style.isDefault

    const handleEdit = () => {
        router.push(`/estilos/${style.id}`)
    }

    const handleDelete = () => {
        if (confirm('Tem certeza que deseja excluir este estilo?')) {
            deleteMutation.mutate(style.id)
        }
    }

    const handleDuplicate = () => {
        duplicateMutation.mutate(style)
    }

    return (
        <Card className="group overflow-hidden hover:border-primary/50 transition-all duration-300 glass-panel">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl shadow-inner">
                        {style.icon || '🎬'}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                {style.name}
                            </h3>
                            {isSystem ? (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 opacity-70 bg-secondary/50 border-none uppercase tracking-tighter">Sistema</Badge>
                            ) : (
                                <Badge variant="default" className="text-[9px] h-4 px-1.5 bg-blue-500/10 text-blue-500 border-none uppercase tracking-tighter">Pessoal</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wider opacity-60">
                            {CONTENT_TYPE_LABELS[style.contentType] || style.contentType}
                        </p>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleEdit}>
                            <Edit2 className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDuplicate}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={handleDelete}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>

            <CardContent className="p-4 pt-2">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {style.description || 'Nenhuma descrição fornecida.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                    {/* Removed targetDuration */}
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Layout className="h-3 w-3" />
                        <span className="truncate" title={style.targetAudience || 'Geral'}>
                            {style.targetAudience || 'Público Geral'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Tag className="h-3 w-3" />
                        <span className="truncate" title={style.suggestedClimate?.name || 'Vários'}>
                            {style.suggestedClimate?.name || 'Vários'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Video className="h-3 w-3" />
                        <span>{style._count?.shorts || 0} shorts</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs bg-muted/50 hover:bg-primary hover:text-primary-foreground border-transparent"
                    onClick={handleEdit}
                >
                    Editar Estilo
                </Button>
            </CardFooter>
        </Card>
    )
}
