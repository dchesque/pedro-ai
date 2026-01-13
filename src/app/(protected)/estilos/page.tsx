'use client'

import React, { useState } from 'react'
import { Plus, LayoutGrid, Search, Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useClimates, useDeleteClimate, Climate } from '@/hooks/use-climates'
import { ClimateCard } from '@/components/climates/ClimateCard'
import { ClimateModal } from '@/components/climates/ClimateModal'
import { Badge } from '@/components/ui/badge'
import { useStyles, useDeleteStyle, Style } from '@/hooks/use-styles'
import { StyleCard } from '@/components/estilos/StyleCard'
import { useRouter } from 'next/navigation'

export default function EstilosPage() {
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedClimate, setSelectedClimate] = useState<Climate | null>(null)

    const { data: climatesData, isLoading: isLoadingClimates } = useClimates()
    const { data: stylesData, isLoading: isLoadingStyles } = useStyles()
    const deleteClimateMutation = useDeleteClimate()
    const deleteStyleMutation = useDeleteStyle()
    const router = useRouter()

    const climates = climatesData?.climates || []
    const styles = stylesData?.styles || []
    const filteredClimates = climates.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase())
    )

    const systemClimates = filteredClimates.filter(c => c.isSystem)
    const personalClimates = filteredClimates.filter(c => !c.isSystem)

    const handleEdit = (climate: Climate) => {
        setSelectedClimate(climate)
        setIsModalOpen(true)
    }

    const handleCreateClimate = () => {
        setSelectedClimate(null)
        setIsModalOpen(true)
    }

    const handleCreateStyle = () => {
        router.push('/estilos/novo')
    }

    const handleDeleteClimate = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este clima?')) {
            await deleteClimateMutation.mutateAsync(id)
        }
    }

    const handleDeleteStyle = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este estilo?')) {
            await deleteStyleMutation.mutateAsync(id)
        }
    }

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-700">
            {/* Header com Design Sistema */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-foreground underline decoration-primary/30 underline-offset-8">Estilos & Climas</h1>
                    </div>
                    <p className="text-muted-foreground font-medium">
                        Personalize o comportamento rítmico e a estética visual dos seus scripts gerados por IA.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 w-full md:w-[300px] bg-muted/30 border-border focus:border-primary/50 transition-all h-11"
                        />
                    </div>
                </div>
            </header>

            <Tabs defaultValue="climates" className="w-full">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <TabsList className="bg-muted/50 border border-border p-1 rounded-xl h-auto">
                        <TabsTrigger value="climates" className="gap-2 px-8 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            <LayoutGrid className="h-4 w-4" /> Climas
                            <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 ml-1 border-border/50">{climates.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="estilos" className="gap-2 px-8 py-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                            🎨 Estilos Visuais
                            <Badge variant="outline" className="text-[10px] h-4 py-0 px-1 ml-1 border-border/50">{styles.length}</Badge>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="climates" className="mt-0">
                        <Button
                            onClick={handleCreateClimate}
                            variant="outline"
                            className="h-10 px-6 font-semibold gap-2 shadow-sm"
                        >
                            <Plus className="h-4 w-4" /> Novo Clima
                        </Button>
                    </TabsContent>

                    <TabsContent value="estilos" className="mt-0">
                        <Button
                            onClick={handleCreateStyle}
                            variant="outline"
                            className="h-10 px-6 font-semibold gap-2 shadow-sm"
                        >
                            <Plus className="h-4 w-4" /> Novo Estilo
                        </Button>
                    </TabsContent>
                </div>

                <TabsContent value="climates" className="space-y-12 outline-none">
                    {isLoadingClimates ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground italic">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Carregando galeria de climas...</p>
                        </div>
                    ) : (
                        <>
                            {/* Personal Climates Section */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">Meus Climas Customizados</h2>
                                    <div className="h-px flex-1 mx-4 bg-border/40" />
                                </div>

                                {personalClimates.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {personalClimates.map(climate => (
                                            <ClimateCard
                                                key={climate.id}
                                                climate={climate}
                                                onEdit={handleEdit}
                                                onDelete={handleDeleteClimate}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl bg-muted/10 group hover:border-primary/20 transition-colors">
                                        <div className="p-4 rounded-full bg-muted mb-4 group-hover:scale-110 transition-transform">
                                            <Plus className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground text-sm font-medium">Você ainda não criou climas personalizados.</p>
                                        <Button variant="link" onClick={handleCreateClimate} className="text-primary text-xs mt-1">
                                            VÁ PARA O MENU AGENTS PARA GERAR UM NOVO CLIMA
                                        </Button>
                                    </div>
                                )}
                            </section>

                            {/* System Climates Section */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">Biblioteca do Sistema</h2>
                                    <div className="h-px flex-1 mx-4 bg-border/40" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                                    {systemClimates.map(climate => (
                                        <ClimateCard
                                            key={climate.id}
                                            climate={climate}
                                        />
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="estilos" className="space-y-12 outline-none">
                    {isLoadingStyles ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground italic">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Carregando estilos visuais...</p>
                        </div>
                    ) : (
                        <>
                            {/* Personal Styles */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">Meus Estilos Visuais</h2>
                                    <div className="h-px flex-1 mx-4 bg-border/40" />
                                </div>

                                {styles.filter(s => !s.isDefault).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {styles.filter(s => !s.isDefault).map(style => (
                                            <StyleCard
                                                key={style.id}
                                                style={style}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-border rounded-2xl bg-muted/10 group hover:border-primary/20 transition-colors">
                                        <div className="p-4 rounded-full bg-muted mb-4 group-hover:scale-110 transition-transform">
                                            <Plus className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground text-sm font-medium">Você ainda não criou estilos visuais personalizados.</p>
                                        <Button variant="link" onClick={handleCreateStyle} className="text-primary text-xs mt-1">
                                            CLIQUE AQUI PARA CRIAR MANUALMENTE OU USE O AGENTS
                                        </Button>
                                    </div>
                                )}
                            </section>

                            {/* System Styles */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">Biblioteca Global</h2>
                                    <div className="h-px flex-1 mx-4 bg-border/40" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                                    {styles.filter(s => s.isDefault).map(style => (
                                        <StyleCard
                                            key={style.id}
                                            style={style}
                                        />
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </TabsContent>
            </Tabs>

            <ClimateModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                climate={selectedClimate}
            />
        </div>
    )
}
