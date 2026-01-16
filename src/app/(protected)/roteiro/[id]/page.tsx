'use client'

import React from "react"
import { useParams, useRouter } from "next/navigation"
import { usePageConfig } from "@/hooks/use-page-config"
import { useShort, useDeleteShort, useGenerateMedia, type Short } from "@/hooks/use-shorts"
import { toast } from "sonner"

// Components (a serem criados)
import { RoteiroHeader } from "./_components/roteiro-header"
import { RoteiroSummaryCard } from "./_components/roteiro-summary-card"
import { SceneSlider } from "./_components/scene-slider"
import { SceneDetailPanel } from "./_components/scene-detail-panel"
import { NarrationModal } from "./_components/narration-modal"
import { EditSceneModal } from "./_components/edit-scene-modal"

import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function RoteiroDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const { data, isLoading, error, refetch } = useShort(id)
    const deleteShort = useDeleteShort()
    const generateMedia = useGenerateMedia()

    const [selectedSceneIndex, setSelectedSceneIndex] = React.useState(0)
    const [isNarrationModalOpen, setIsNarrationModalOpen] = React.useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false)

    usePageConfig({
        title: undefined,
        description: undefined,
        showBreadcrumbs: false,
    })

    // Polling para status de geração
    React.useEffect(() => {
        if (data?.short && ['GENERATING_SCRIPT', 'GENERATING_PROMPTS', 'GENERATING_IMAGES', 'GENERATING_MEDIA'].includes(data.short.status)) {
            const interval = setInterval(() => {
                refetch()
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [data?.short, refetch])

    if (isLoading) {
        // O loading.tsx deve cuidar disso, mas mantemos um fallback
        return <div className="p-6 md:p-12"><Skeleton className="h-screen w-full" /></div>
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-4">
                <div className="bg-destructive/10 p-4 rounded-full">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold">Roteiro não encontrado</h2>
                <p className="text-muted-foreground max-w-md">
                    Não conseguimos localizar este roteiro. Ele pode ter sido removido ou você não tem permissão para acessá-lo.
                </p>
                <Button onClick={() => router.push("/shorts")}>Voltar para meus roteiros</Button>
            </div>
        )
    }

    const { short } = data
    const selectedScene = short.scenes[selectedSceneIndex] || short.scenes[0]

    const handleGenerateImages = async () => {
        try {
            await generateMedia.mutateAsync(id)
            toast.success("Geração de imagens iniciada!")
        } catch (error: any) {
            toast.error(error.message || "Erro ao iniciar geração")
        }
    }

    const handleDelete = async () => {
        if (confirm("Tem certeza que deseja deletar este roteiro? Esta ação é irreversível.")) {
            try {
                await deleteShort.mutateAsync(id)
                router.push("/shorts")
            } catch (error) {
                toast.error("Erro ao deletar roteiro")
            }
        }
    }

    return (
        <div className="p-4 md:p-6 w-full space-y-6 pb-32">
            <RoteiroHeader
                title={short.title || "Roteiro sem título"}
                status={short.status}
                totalDuration={short.targetDuration}
                sceneCount={short.scenes.length}
                styleName={(short as any).styleRelation?.name || short.style}
                onEdit={() => router.push(`/shorts/${id}/edit`)}
                onGenerateImages={handleGenerateImages}
                onDelete={handleDelete}
                isGenerating={generateMedia.isPending}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-8">
                    <RoteiroSummaryCard
                        id={id}
                        hook={short.hook}
                        summary={short.summary || short.synopsis}
                        cta={short.cta}
                        style={(short as any).styleRelation}
                        climate={(short as any).climate}
                        modelUsed={short.aiModel || "Default"}
                        totalDuration={short.targetDuration}
                        sceneCount={short.scenes.length}
                        characters={short.characters?.map(c => ({
                            id: c.character.id,
                            name: c.character.name,
                            imageUrl: c.character.imageUrl,
                            description: c.role
                        })) || []}
                        characterDescription={(short as any).characterDescription}
                        onViewNarration={() => setIsNarrationModalOpen(true)}
                    />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold tracking-tight">Storyboard</h3>
                            <Button variant="outline" size="sm" onClick={() => router.push(`/shorts/${id}/edit`)}>
                                Gerenciar Cenas
                            </Button>
                        </div>

                        <SceneSlider
                            scenes={short.scenes as any}
                            selectedIndex={selectedSceneIndex}
                            onSelectScene={setSelectedSceneIndex}
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <SceneDetailPanel
                        scene={selectedScene as any}
                        sceneNumber={selectedSceneIndex + 1}
                        totalScenes={short.scenes.length}
                        onEdit={() => setIsEditModalOpen(true)}
                        onRegenerate={() => {
                            // TODO: Implementar regeneração rápida se necessário
                            toast.info("Função de regeneração em breve")
                        }}
                        onCopyPrompt={() => {
                            const prompt = selectedScene.visualPrompt || selectedScene.imagePrompt || selectedScene.visualDesc
                            if (prompt) {
                                navigator.clipboard.writeText(prompt)
                                toast.success("Prompt copiado!")
                            }
                        }}
                    />
                </div>
            </div>

            <NarrationModal
                isOpen={isNarrationModalOpen}
                onClose={() => setIsNarrationModalOpen(false)}
                hook={short.hook}
                scenes={short.scenes as any}
                cta={short.cta}
            />

            {selectedScene && (
                <EditSceneModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    scene={selectedScene as any}
                    shortId={id}
                />
            )}
        </div>
    )
}
