"use client"

import React from 'react'
import { Plus, Palette, Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from 'next/navigation'
import { useStyles } from '@/hooks/use-styles'
import { useTones } from '@/hooks/use-tones'
import { StyleCard } from '@/components/estilos/StyleCard'
import { ToneCard } from '@/components/tones/ToneCard'
import { ToneDialog } from '@/components/tones/ToneDialog'

export default function EstilosPage() {
    const router = useRouter()

    // Styles Data
    const { data: stylesData, isLoading: isLoadingStyles } = useStyles()
    const styles = stylesData?.styles || []
    const systemStyles = styles.filter(s => !s.userId || s.isDefault)
    const personalStyles = styles.filter(s => s.userId && !s.isDefault)

    // Tones Data
    const { data: tonesData, isLoading: isLoadingTones } = useTones()
    const tones = tonesData?.tones || []
    const systemTones = tones.filter(t => t.type === 'system')
    const personalTones = tones.filter(t => t.type === 'personal')

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">🎨 Estilos e Identidade</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie os padrões visuais, estilos narrativos e tons de voz.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="styles" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="styles" className="gap-2">
                        <Palette className="h-4 w-4" /> Estilos
                    </TabsTrigger>
                    <TabsTrigger value="tones" className="gap-2">
                        <MessageSquare className="h-4 w-4" /> Tons de Voz
                    </TabsTrigger>
                </TabsList>

                {/* ABA ESTILOS */}
                <TabsContent value="styles">
                    <div className="flex justify-end mb-4">
                        <Button
                            onClick={() => router.push('/estilos/novo')}
                            className="gap-2 bg-primary hover:bg-primary/90 text-white"
                        >
                            <Plus className="h-4 w-4" />
                            Novo Estilo
                        </Button>
                    </div>

                    {isLoadingStyles ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Carregando estilos...</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
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
                                        </div>
                                    </button>
                                </div>
                            </section>

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
                </TabsContent>

                {/* ABA TONS */}
                <TabsContent value="tones">
                    <div className="flex justify-end mb-4">
                        <ToneDialog>
                            <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
                                <Plus className="h-4 w-4" />
                                Novo Tom
                            </Button>
                        </ToneDialog>
                    </div>

                    {isLoadingTones ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Carregando tons...</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            <section>
                                <div className="flex items-center gap-2 mb-6">
                                    <h2 className="text-xl font-bold">Seus Tons</h2>
                                    <Badge variant="outline" className="text-[10px] h-5">{personalTones.length}</Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {personalTones.map((tone) => (
                                        <ToneCard key={tone.id} tone={tone} />
                                    ))}
                                    <ToneDialog>
                                        <button className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border/50 bg-card/10 p-6 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group min-h-[180px] w-full glass-panel">
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                                <Plus className="h-6 w-6" />
                                            </div>
                                            <div className="text-center">
                                                <span className="block font-semibold">Criar Tom Personalizado</span>
                                            </div>
                                        </button>
                                    </ToneDialog>
                                </div>
                            </section>

                            <section className="pt-8 border-t border-border/50">
                                <div className="flex items-center gap-2 mb-6">
                                    <h2 className="text-xl font-bold text-muted-foreground">Tons do Sistema</h2>
                                    <Badge variant="secondary" className="text-[10px] h-5 opacity-70">Padrão</Badge>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-85 hover:opacity-100 transition-opacity">
                                    {systemTones.map((tone) => (
                                        <ToneCard key={tone.id} tone={tone} />
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
