"use client"

import React from 'react'
import { Plus, Palette, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { useStyles } from '@/hooks/use-styles'
import { StyleCard } from '@/components/estilos/StyleCard'

export default function EstilosPage() {
    const router = useRouter()
    const { data, isLoading } = useStyles()
    const styles = data?.styles || []

    const systemStyles = styles.filter(s => !s.userId || s.isDefault)
    const personalStyles = styles.filter(s => s.userId && !s.isDefault)

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">🎨 Estilos e Identidade</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie os padrões visuais e narrativos dos seus vídeos.
                    </p>
                </div>
                <Button
                    onClick={() => router.push('/estilos/novo')}
                    className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                >
                    <Plus className="h-4 w-4" />
                    Novo Estilo
                </Button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Carregando estilos...</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Seção de Estilos do Usuário */}
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-bold">Seus Estilos</h2>
                            <Badge variant="outline" className="text-[10px] h-5">{personalStyles.length}</Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {personalStyles.map((style) => (
                                <StyleCard key={style.id} style={style} />
                            ))}

                            <button
                                onClick={() => router.push('/estilos/novo')}
                                className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/50 bg-card/10 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group min-h-[250px] glass-panel"
                            >
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                    <Plus className="h-6 w-6" />
                                </div>
                                <div className="text-center">
                                    <span className="block font-semibold">Criar Estilo</span>
                                    <span className="text-xs text-muted-foreground mt-1">Defina sua própria identidade</span>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Seção de Estilos do Sistema */}
                    <section className="pt-8 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-bold text-muted-foreground">Biblioteca do Sistema</h2>
                            <Badge variant="secondary" className="text-[10px] h-5 opacity-70">Padrão</Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-85 hover:opacity-100 transition-opacity">
                            {systemStyles.map((style) => (
                                <StyleCard key={style.id} style={style} />
                            ))}
                        </div>
                    </section>
                </div>
            )}
        </div>
    )
}
