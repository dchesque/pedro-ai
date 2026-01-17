"use client"

import React from 'react'
import Link from 'next/link'
import { useAdminAgentsV2 } from '@/hooks/use-admin-agents-v2'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { StandardPageHeader } from '@/components/ui/standard-page-header'
import { BotIcon } from 'lucide-react'

export default function AdminAgentsPage() {
    const { data, isLoading } = useAdminAgentsV2()

    return (
        <div className="container mx-auto space-y-6">
            <StandardPageHeader
                title="Gerenciar"
                subtitle="Agents"
                description="Configure os assistants de Clima, Estilo e Custom."
                icon={BotIcon}
                badge="AGENTS"
            />

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">Ícone</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Modelo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Última Atualização</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10">Carregando...</TableCell>
                            </TableRow>
                        ) : data?.agents.map((agent: any) => (
                            <TableRow key={agent.id}>
                                <TableCell className="text-2xl">{agent.icon || '🤖'}</TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{agent.name}</span>
                                        {agent.isGlobal && (
                                            <span className="text-[10px] text-primary font-bold uppercase tracking-tighter -mt-1">Sistema</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{agent.slug}</TableCell>
                                <TableCell>
                                    <Badge variant={agent.isGlobal ? "secondary" : "outline"} className={agent.isGlobal ? "bg-primary/10 text-primary border-primary/20" : ""}>
                                        {agent.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">{agent.model}</TableCell>
                                <TableCell>
                                    {agent.isActive ? (
                                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Ativo</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inativo</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {format(new Date(agent.updatedAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/agents/${agent.slug}`} target="_blank">
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" asChild className="gap-2">
                                            <Link href={`/admin/agents/${agent.id}`}>
                                                <Edit2 className="h-4 w-4" />
                                                Editar
                                            </Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
