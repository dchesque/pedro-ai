"use client"

import React from 'react'
import Link from 'next/link'
import { useAgents } from '@/hooks/use-agents'
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AgentsPage() {
    const { data, isLoading } = useAgents()

    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    Agents System v1.0
                </h1>
                <p className="text-muted-foreground">
                    Assistentes especializados para criar configurações perfeitas para seus vídeos.
                </p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data?.agents.map((agent) => (
                        <Card key={agent.id} className="hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <div className="text-4xl mb-4">{agent.icon}</div>
                                <CardTitle>{agent.name}</CardTitle>
                                <CardDescription>{agent.description}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button asChild className="w-full gap-2">
                                    <Link href={`/agents/${agent.slug}`}>
                                        Acessar Agent
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    {data?.agents.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
                            <p className="text-muted-foreground">Nenhum agent disponível no momento.</p>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-12 p-6 rounded-xl bg-primary/5 border border-primary/20">
                <h3 className="text-lg font-semibold mb-2">Como funciona?</h3>
                <ul className="space-y-2 text-sm text-balance">
                    <li className="flex gap-2">
                        <span className="font-bold text-primary">1.</span>
                        Escolha um assistant (Clima ou Estilo).
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-primary">2.</span>
                        Responda algumas perguntas rápidas sobre o seu objetivo.
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-primary">3.</span>
                        A IA gera uma configuração otimizada e 100% compatível.
                    </li>
                    <li className="flex gap-2">
                        <span className="font-bold text-primary">4.</span>
                        Revise, dê um nome e salve para usar em seus próximos roteiros.
                    </li>
                </ul>
            </div>
        </div>
    )
}
