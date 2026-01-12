"use client"

import React from 'react'
import { Plus, Search, Filter, History, FileText, MoreVertical, Play, Trash2, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useShorts, useDeleteShort } from '@/hooks/use-shorts'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useSetPageMetadata } from '@/contexts/page-metadata'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Rascunho', color: 'bg-slate-500/10 text-slate-600' },
    GENERATING_SCRIPT: { label: 'Gerando Roteiro', color: 'bg-blue-500/10 text-blue-600 animate-pulse' },
    SCRIPT_READY: { label: 'Roteiro Pronto', color: 'bg-amber-500/10 text-amber-600' },
    SCRIPT_APPROVED: { label: 'Aprovado', color: 'bg-emerald-500/10 text-emerald-600' },
    GENERATING_IMAGES: { label: 'Gerando Imagens', color: 'bg-purple-500/10 text-purple-600 animate-pulse' },
    IMAGES_READY: { label: 'Imagens Prontas', color: 'bg-indigo-500/10 text-indigo-600' },
    GENERATING_VIDEO: { label: 'Gerando Vídeo', color: 'bg-pink-500/10 text-pink-600 animate-pulse' },
    VIDEO_READY: { label: 'Vídeo Pronto', color: 'bg-green-500/10 text-green-600 font-bold' },
}

export default function RoteiristaListingPage() {
    const { data, isLoading } = useShorts()
    const deleteMutation = useDeleteShort()
    const [search, setSearch] = React.useState('')

    const shorts = data?.shorts || []
    const filteredShorts = shorts.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.theme.toLowerCase().includes(search.toLowerCase())
    )

    useSetPageMetadata({
        title: "Roteirista",
        description: "Gerencie seus roteiros e transforme ideias em vídeos virais.",
        breadcrumbs: [
            { label: "Início", href: "/dashboard" },
            { label: "Roteirista" }
        ]
    });

    return (
        <div className="space-y-8">
            {/* Header - Simplified as metadata handles title/desc */}
            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
                <Button asChild className="gap-2">
                    <Link href="/roteirista/novo">
                        <Plus className="h-4 w-4" />
                        Novo Roteiro
                    </Link>
                </Button>
            </div>

            {/* Stats / Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-primary/5 border-primary/10">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total de Roteiros</p>
                            <p className="text-2xl font-bold">{shorts.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-amber-500/10 text-amber-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Aguardando Mídia</p>
                            <p className="text-2xl font-bold">
                                {shorts.filter(s => s.status === 'SCRIPT_READY').length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                            <p className="text-2xl font-bold">
                                {shorts.filter(s => s.status === 'VIDEO_READY' || s.status === 'COMPLETED').length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por título ou tema..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            {/* Listing */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : filteredShorts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredShorts.map((short) => {
                        const status = STATUS_LABELS[short.status] || { label: short.status, color: 'bg-muted text-muted-foreground' }
                        return (
                            <Card key={short.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                                <CardContent className="p-0">
                                    {/* Quick Preview Thumbnail (Placeholder) */}
                                    <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                                        {short.scenes?.[0]?.mediaUrl ? (
                                            <img
                                                src={short.scenes[0].mediaUrl}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                alt=""
                                            />
                                        ) : (
                                            <FileText className="h-12 w-12 text-muted-foreground/30" />
                                        )}
                                        <Badge className={cn("absolute top-3 right-3", status.color)} variant="secondary">
                                            {status.label}
                                        </Badge>
                                    </div>

                                    <div className="p-5 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold truncate group-hover:text-primary transition-colors">
                                                    {short.title || "Sem Título"}
                                                </h3>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <History className="h-3 w-3" />
                                                    {formatDistanceToNow(new Date(short.updatedAt), { addSuffix: true, locale: ptBR })}
                                                </p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/shorts/${short.id}`}>Ver Detalhes</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/roteirista/${short.id}`}>Editar Roteiro</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            if (confirm('Tem certeza que deseja excluir este roteiro?')) {
                                                                deleteMutation.mutate(short.id)
                                                            }
                                                        }}
                                                    >
                                                        Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                                            {short.theme}
                                        </p>

                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[10px] h-5">
                                                    {short.style || 'Default'}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {short.scenes?.length || 0} cenas
                                                </span>
                                            </div>
                                            <Button asChild size="sm" variant="secondary" className="h-8 gap-2">
                                                <Link href={`/shorts/${short.id}`}>
                                                    {short.status === 'SCRIPT_READY' ? (
                                                        <>
                                                            <Play className="h-3.5 w-3.5" />
                                                            Criar Media
                                                        </>
                                                    ) : (
                                                        'Abrir'
                                                    )}
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Nenhum roteiro encontrado</h3>
                    <p className="text-muted-foreground mb-6">Comece criando seu primeiro roteiro assistido por IA.</p>
                    <Button asChild>
                        <Link href="/roteirista/novo">Criar Primeiro Roteiro</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
