'use client'

import { Climate } from '@/hooks/use-climates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit2, MessageSquare, MoreHorizontal, Settings, Trash2, Eye } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ClimateCardProps {
    climate: Climate
    onEdit?: (climate: Climate) => void
    onDelete?: (id: string) => void
    onView?: (climate: Climate) => void
}

export function ClimateCard({ climate, onEdit, onDelete, onView }: ClimateCardProps) {
    return (
        <Card className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all duration-300 shadow-sm">
            <CardHeader className="p-4 space-y-0 pb-2">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                                {climate.name}
                                {climate.isSystem && (
                                    <Badge variant="secondary" className="text-[9px] h-4 py-0 px-1 font-medium bg-secondary text-secondary-foreground uppercase">
                                        Sistema
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription className="text-xs line-clamp-1">
                                {climate.description}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onView?.(climate)}
                            title="Ver Detalhes"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>

                        {!climate.isSystem && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="border-border">
                                    <DropdownMenuItem
                                        className="text-xs cursor-pointer gap-2"
                                        onClick={() => onEdit?.(climate)}
                                    >
                                        <Edit2 className="h-3 w-3" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="text-xs cursor-pointer gap-2 text-destructive"
                                        onClick={() => onDelete?.(climate.id)}
                                    >
                                        <Trash2 className="h-3 w-3" /> Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2 mt-2">
                    {climate.emotionalDetails && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-border text-[10px] text-muted-foreground">
                            <span>{climate.emotionalDetails.icon}</span>
                            <span>{climate.emotionalDetails.label}</span>
                        </div>
                    )}
                    {climate.pressureDetails && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-border text-[10px] text-muted-foreground">
                            <span>{climate.pressureDetails.icon}</span>
                            <span>{climate.pressureDetails.label}</span>
                        </div>
                    )}
                    {climate.revelationDetails && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-border text-[10px] text-muted-foreground">
                            <span>{climate.revelationDetails.icon}</span>
                            <span>{climate.revelationDetails.label}</span>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" />
                        <span>Prompt behavioral ativo</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground italic">
                        Max: {climate.sentenceMaxWords} words/sentence
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
