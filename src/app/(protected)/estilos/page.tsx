'use client'

import React, { useState } from 'react'
import { Plus, LayoutGrid, Search, Filter, Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useClimates, useDeleteClimate, Climate } from '@/hooks/use-climates'
import { ClimateCard } from '@/components/climates/ClimateCard'
import { ClimateModal } from '@/components/climates/ClimateModal'
import { Badge } from '@/components/ui/badge'

export default function EstilosPage() {
    const [search, setSearch] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedClimate, setSelectedClimate] = useState<Climate | null>(null)

    const { data, isLoading } = useClimates()
    const deleteMutation = useDeleteClimate()

    const climates = data?.climates || []
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

    const handleCreate = () => {
        setSelectedClimate(null)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este clima?')) {
            await deleteMutation.mutateAsync(id)
        }
    }

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-700">
            {/* Header com Glassmorphism */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-primary" />
                        <h1 className="text-3xl font-bold tracking-tight text-white">Estilos & Climas</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Gerencie a identidade visual e o comportamento emocional dos seus scripts.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar climas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 w-full md:w-[300px] bg-white/5 border-white/10 focus:border-primary/50 transition-all h-11"
                        />
                    </div>
                    <Button
                        onClick={handleCreate}
                        className="h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 shadow-lg shadow-primary/20"
                    >
                        <Plus className="h-5 w-5" /> Novo Clima
                    </Button>
                </div>
            </header>

            <Tabs defaultValue="climates" className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-zinc-900 border border-white/5 p-1">
                        <TabsTrigger value="climates" className="gap-2 px-6">
                            <LayoutGrid className="h-4 w-4" /> Climas <Badge variant="secondary" className="bg-white/10 text-[10px] h-4 py-0 px-1 ml-1">{climates.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger value="estilos" className="gap-2 px-6">
                            🎨 Estilos Visuais
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="climates" className="space-y-12 outline-none">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground italic">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p>Carregando galeria de climas...</p>
                        </div>
                    ) : (
                        <>
                            {/* Personal Climates Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">Meus Climas Customizados</h2>
                                    <div className="h-px flex-1 mx-4 bg-white/5" />
                                </div>

                                {personalClimates.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {personalClimates.map(climate => (
                                            <ClimateCard
                                                key={climate.id}
                                                climate={climate}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                                        <p className="text-muted-foreground text-sm">Você ainda não criou climas personalizados.</p>
                                        <Button variant="link" onClick={handleCreate} className="text-primary text-xs mt-1">
                                            Clique aqui para começar
                                        </Button>
                                    </div>
                                )}
                            </section>

                            {/* System Climates Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40">Biblioteca do Sistema</h2>
                                    <div className="h-px flex-1 mx-4 bg-white/5" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
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

                <TabsContent value="estilos">
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-2xl">
                        <p className="text-muted-foreground">Sistema de Estilos Visuais em manutenção para integração v2.0.</p>
                    </div>
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
