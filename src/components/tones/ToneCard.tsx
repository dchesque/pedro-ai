"use client"

import React, { useState } from 'react'
import {
    MoreVertical,
    Edit2,
    Trash2,
    MessageSquare,
    Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Tone, useDeleteTone } from '@/hooks/use-tones'
import { ToneDialog } from './ToneDialog'

interface ToneCardProps {
    tone: Tone
}

export function ToneCard({ tone }: ToneCardProps) {
    const { toast } = useToast()
    const deleteMutation = useDeleteTone()
    const [isEditOpen, setIsEditOpen] = useState(false)

    const isSystem = tone.type === 'system'

    const handleDelete = () => {
        if (confirm('Tem certeza que deseja excluir este tom?')) {
            deleteMutation.mutate(tone.id)
        }
    }

    return (
        <>
            <Card className="group overflow-hidden hover:border-primary/50 transition-all duration-300 glass-panel">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-xl shadow-inner text-purple-500">
                            {tone.icon || '🎭'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                    {tone.name}
                                </h3>
                                {isSystem ? (
                                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 opacity-70 bg-secondary/50 border-none uppercase tracking-tighter">Sistema</Badge>
                                ) : (
                                    <Badge variant="default" className="text-[9px] h-4 px-1.5 bg-blue-500/10 text-blue-500 border-none uppercase tracking-tighter">Pessoal</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    {!isSystem && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={handleDelete}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </CardHeader>

                <CardContent className="p-4 pt-2">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                        {tone.description || 'Sem descrição.'}
                    </p>

                    <div className="mt-4 flex flex-col gap-2">
                        <div className="bg-muted/30 p-2 rounded text-xs text-muted-foreground italic border border-border/50">
                            "{tone.promptFragment}"
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ToneDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                tone={tone}
            />
        </>
    )
}
