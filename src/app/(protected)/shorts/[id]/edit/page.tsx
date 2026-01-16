"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ChevronLeft,
    RefreshCcw,
    CheckCircle,
    Plus,
    LayoutDashboard,
    Edit,
    BookOpen,
    Eye,
    Sparkles,
    Loader2,
    Save
} from "lucide-react"

import { usePageConfig } from "@/hooks/use-page-config"
import {
    useShort,
    useApproveScript,
    useRegenerateScript,
    useUpdateScene,
    useAddScene,
    useRemoveScene,
    useReorderScenes,
    useRegenerateScene,
    useGenerateMedia,
    useUpdateShort,
    ShortScene
} from "@/hooks/use-shorts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

import { SortableSceneList } from "@/components/shorts/SortableSceneList"
import { EditSceneDialog } from "@/components/shorts/EditSceneDialog"
import { RegenerateSceneDialog } from "@/components/shorts/RegenerateSceneDialog"
import { AddSceneDialog } from "@/components/shorts/AddSceneDialog"
import { AIModelSelector } from "@/components/shorts/AIModelSelector"
import { CreditEstimate } from "@/components/shorts/CreditEstimate"

export default function ScriptEditPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const { data, isLoading, refetch } = useShort(id)
    const approveScript = useApproveScript()
    const regenerateScript = useRegenerateScript()
    const updateScene = useUpdateScene()
    const addScene = useAddScene()
    const removeScene = useRemoveScene()
    const reorderScenes = useReorderScenes()
    const regenerateScene = useRegenerateScene()
    const updateShort = useUpdateShort()
    const generateMedia = useGenerateMedia()

    const [editingTitle, setEditingTitle] = useState(false)
    const [editingSummary, setEditingSummary] = useState(false)
    const [editingHook, setEditingHook] = useState(false)
    const [editingCta, setEditingCta] = useState(false)

    const [selectedScene, setSelectedScene] = useState<ShortScene | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isRegenDialogOpen, setIsRegenDialogOpen] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    usePageConfig(
        data?.short.title ? `Editar: ${data.short.title}` : "Editar Roteiro",
        "Refine seu roteiro antes de gerar as imagens.",
        [
            { label: "Início", href: "/dashboard" },
            { label: "Shorts", href: "/shorts" },
            { label: "Detalhes", href: `/roteiro/${id}` },
            { label: "Editar Roteiro" },
        ]
    )

    if (isLoading) {
        return <div className="p-6 space-y-6"><Skeleton className="h-64" /></div>
    }

    if (!data?.short) return null

    const { short } = data


    const handleApprove = async () => {
        try {
            await approveScript.mutateAsync(id)
            toast.success("Roteiro aprovado! Iniciando geração das imagens...")
            generateMedia.mutate(id)
            router.push(`/roteiro/${id}`)
        } catch (error) {
            toast.error("Falha ao aprovar roteiro.")
        }
    }

    const handleRegenerateAll = async () => {
        if (!confirm("Isso irá substituir todo o roteiro atual. Continuar?")) return
        try {
            await regenerateScript.mutateAsync({ shortId: id })
            toast.success("Roteiro regenerado com sucesso!")
        } catch (error) {
            toast.error("Falha ao regenerar roteiro.")
        }
    }

    const handleUpdateShortData = async (field: string, value: string) => {
        try {
            await updateShort.mutateAsync({ id, data: { [field]: value } })
            toast.success("Atualizado com sucesso!")
            setEditingTitle(false)
            setEditingSummary(false)
            setEditingHook(false)
            setEditingCta(false)
        } catch (error) {
            toast.error("Erro ao atualizar.")
        }
    }

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push(`/roteiro/${id}`)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            {editingTitle ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        defaultValue={short.title || ""}
                                        className="h-8 font-bold text-xl"
                                        onBlur={(e) => handleUpdateShortData('title', e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                    {short.title || "Sem título"}
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingTitle(true)}>
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                </h2>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                <Sparkles className="w-3 h-3 mr-1" />
                                {short.status.replace(/_/g, ' ')}
                            </Badge>
                            <span>•</span>
                            <span>Versão {short.scriptVersion}</span>
                            <span>•</span>
                            <span>{short.style}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleRegenerateAll} disabled={regenerateScript.isPending}>
                        <RefreshCcw className={`w-4 h-4 mr-2 ${regenerateScript.isPending ? 'animate-spin' : ''}`} />
                        Regenerar Tudo
                    </Button>
                    <Button onClick={handleApprove} disabled={approveScript.isPending}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprovar e Gerar Imagens
                    </Button>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Resumo */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                Resumo da História
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setEditingSummary(!editingSummary)}>
                                {editingSummary ? "Cancelar" : "Editar"}
                            </Button>
                        </div>
                        <Card>
                            <CardContent className="pt-6">
                                {editingSummary ? (
                                    <div className="space-y-4">
                                        <Textarea
                                            defaultValue={short.summary || ""}
                                            rows={3}
                                            id="summary-input"
                                        />
                                        <Button size="sm" onClick={() => {
                                            const val = (document.getElementById('summary-input') as HTMLTextAreaElement).value
                                            handleUpdateShortData('summary', val)
                                        }}>
                                            <Save className="w-4 h-4 mr-2" />
                                            Salvar Resumo
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {short.summary || "Sem resumo gerado."}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    {/* Hook & CTA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">🎣 Hook (Gancho)</h3>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setEditingHook(!editingHook)}>
                                    EDITAR
                                </Button>
                            </div>
                            <Card className="bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/50">
                                <CardContent className="pt-4">
                                    {editingHook ? (
                                        <div className="space-y-2">
                                            <Input id="hook-input" defaultValue={short.hook || ""} />
                                            <Button size="sm" onClick={() => {
                                                const val = (document.getElementById('hook-input') as HTMLInputElement).value
                                                handleUpdateShortData('hook', val)
                                            }}>Salvar</Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-medium italic">"{short.hook}"</p>
                                    )}
                                </CardContent>
                            </Card>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">📢 CTA</h3>
                                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => setEditingCta(!editingCta)}>
                                    EDITAR
                                </Button>
                            </div>
                            <Card className="bg-blue-50/30 dark:bg-blue-950/10 border-blue-200/50">
                                <CardContent className="pt-4">
                                    {editingCta ? (
                                        <div className="space-y-2">
                                            <Input id="cta-input" defaultValue={short.cta || ""} />
                                            <Button size="sm" onClick={() => {
                                                const val = (document.getElementById('cta-input') as HTMLInputElement).value
                                                handleUpdateShortData('cta', val)
                                            }}>Salvar</Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-medium italic">"{short.cta}"</p>
                                    )}
                                </CardContent>
                            </Card>
                        </section>
                    </div>

                    {/* Storyboard / Scenes */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <LayoutDashboard className="w-5 h-5 text-primary" />
                                Storyboard
                            </h3>
                            <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Cena
                            </Button>
                        </div>

                        <SortableSceneList
                            scenes={short.scenes}
                            onReorder={(ids) => reorderScenes.mutate({ shortId: id, sceneIds: ids })}
                            onEdit={(scene) => {
                                setSelectedScene(scene)
                                setIsEditDialogOpen(true)
                            }}
                            onRegenerate={(scene) => {
                                setSelectedScene(scene)
                                setIsRegenDialogOpen(true)
                            }}
                            onRemove={(sceneId) => {
                                if (confirm("Remover esta cena?")) {
                                    removeScene.mutate({ shortId: id, sceneId })
                                }
                            }}
                            onDuplicate={(scene) => {
                                addScene.mutate({
                                    shortId: id,
                                    data: {
                                        order: scene.order + 1,
                                        narration: scene.narration,
                                        visualDesc: scene.visualDesc,
                                        duration: scene.duration
                                    }
                                })
                            }}
                        />
                    </section>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Configurações Ativas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <AIModelSelector
                                value={short.aiModel || "deepseek/deepseek-v3.2"}
                                onChange={(model) => handleUpdateShortData('aiModel', model)}
                            />

                            <div className="space-y-1">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Tema Original</Label>
                                <p className="text-sm">{short.theme}</p>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Estilo</Label>
                                <p className="text-sm capitalize">{short.style}</p>
                            </div>

                            <Separator />

                            <CreditEstimate
                                modelId={short.aiModel || "deepseek/deepseek-v3.2"}
                                estimatedScenes={short.scenes.length}
                            />
                        </CardContent>
                    </Card>

                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg space-y-3">
                        <h4 className="text-xs font-bold text-primary uppercase">Dicas de Edição</h4>
                        <ul className="text-xs space-y-2 text-muted-foreground list-disc pl-4">
                            <li>Seja visualmente descritivo para melhores imagens.</li>
                            <li>Mantenha as narrações curtas para o tempo de cena.</li>
                            <li>Reordene as cenas arrastando-as pelo ícone ≡.</li>
                            <li>Você pode regenerar cenas específicas se o texto não ficou bom.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <EditSceneDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                scene={selectedScene}
                onSave={async (data) => {
                    if (selectedScene) {
                        await updateScene.mutateAsync({ shortId: id, sceneId: selectedScene.id, data })
                        toast.success("Cena atualizada!")
                    }
                }}
            />

            <RegenerateSceneDialog
                open={isRegenDialogOpen}
                onOpenChange={setIsRegenDialogOpen}
                isGenerating={regenerateScene.isPending}
                onRegenerate={async (instructions) => {
                    if (selectedScene) {
                        await regenerateScene.mutateAsync({ shortId: id, sceneId: selectedScene.id, instructions })
                        toast.success("Cena regenerada pela IA!")
                    }
                }}
            />

            <AddSceneDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                nextOrder={short.scenes.length}
                onAdd={async (data) => {
                    await addScene.mutateAsync({ shortId: id, data })
                    toast.success("Cena adicionada!")
                }}
            />

            {/* Bottom Floating Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t p-4 md:left-[var(--sidebar-width,0px)]">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="hidden md:block">
                        <p className="text-sm font-medium">{short.title}</p>
                        <p className="text-xs text-muted-foreground">{short.scenes.length} cenas • ~{short.scenes.length * 2 + 2} créditos totais</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button variant="outline" className="flex-1 md:flex-none" onClick={() => router.push(`/roteiro/${id}`)}>
                            Sair sem salvar imagem
                        </Button>
                        <Button className="flex-1 md:flex-none h-12 px-8 text-md font-bold" onClick={handleApprove} disabled={approveScript.isPending}>
                            {approveScript.isPending ? <Loader2 className="animate-spin" /> : "Aprovar e Gerar Imagens"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
