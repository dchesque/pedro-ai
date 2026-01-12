"use client"

import React from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ChevronLeft,
    Play,
    RefreshCw,
    Trash2,
    Loader2,
    CheckCircle,
    AlertCircle,
    Clock,
    Type,
    Image as ImageIcon,
    Sparkles,
    Edit
} from "lucide-react"

import { usePageConfig } from "@/hooks/use-page-config"
import { useShort, useDeleteShort, useGenerateScript, useGenerateMedia, type Short } from "@/hooks/use-shorts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useUpdateShort } from "@/hooks/use-shorts"
import { useAIModels } from "@/hooks/use-ai-models"
import { CreateShortForm } from "@/components/shorts/CreateShortForm"
import { CreditEstimate } from "@/components/shorts/CreditEstimate"
import { toast } from "sonner"

export default function ShortDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const { data, isLoading, error, refetch } = useShort(id)
    const { data: aiModelsData } = useAIModels()
    const generateScript = useGenerateScript()
    const generateMedia = useGenerateMedia()
    const deleteShort = useDeleteShort()
    const updateShort = useUpdateShort()

    const [editingHook, setEditingHook] = React.useState(false)
    const [editingCta, setEditingCta] = React.useState(false)

    const handleUpdateShortData = async (field: string, value: string) => {
        try {
            await updateShort.mutateAsync({ id, data: { [field]: value } })
            toast.success("Atualizado!")
            setEditingHook(false)
            setEditingCta(false)
        } catch (error) {
            toast.error("Erro ao atualizar")
        }
    }

    usePageConfig(
        data?.short.title || "Detalhes do Short",
        "Visualize e gerencie a geração das cenas do seu short.",
        [
            { label: "Início", href: "/dashboard" },
            { label: "Shorts", href: "/shorts" },
            { label: "Detalhes" },
        ]
    )

    // Polling se estiver processando
    React.useEffect(() => {
        if (data?.short && ['GENERATING_SCRIPT', 'GENERATING_PROMPTS', 'GENERATING_MEDIA'].includes(data.short.status)) {
            const interval = setInterval(() => {
                refetch()
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [data?.short, refetch])

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 md:col-span-2" />
                    <Skeleton className="h-64" />
                </div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="p-6 text-center space-y-4">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <h2 className="text-xl font-bold">Short não encontrado</h2>
                <Button onClick={() => router.push("/shorts")}>Voltar para a lista</Button>
            </div>
        )
    }

    const { short } = data
    const isProcessing = ['GENERATING_SCRIPT', 'GENERATING_PROMPTS', 'GENERATING_MEDIA'].includes(short.status)
    const canEdit = ['SCRIPT_READY', 'SCRIPT_APPROVED', 'FAILED', 'DRAFT'].includes(short.status)

    const handleDelete = async () => {
        if (confirm("Tem certeza que deseja deletar este short?")) {
            await deleteShort.mutateAsync(id)
            router.push("/shorts")
        }
    }

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 pb-24">
            {/* Header / Actions */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/shorts")}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">{short.title || "Sem título"}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant={short.status === 'COMPLETED' ? 'success' as any : 'secondary' as any}>
                                {short.status.replace(/_/g, ' ')}
                            </Badge>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {short.targetDuration}s</span>
                            <span>•</span>
                            <span>{short.scenes.length} cenas</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canEdit && (
                        <Button variant="outline" onClick={() => router.push(`/shorts/${id}/edit`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Roteiro
                        </Button>
                    )}

                    {short.status === 'SCRIPT_APPROVED' && (
                        <Button
                            onClick={() => generateMedia.mutate(id)}
                            disabled={generateMedia.isPending}
                        >
                            {generateMedia.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Play className="mr-2 h-4 w-4" />
                            )}
                            Gerar Imagens
                        </Button>
                    )}

                    {short.status === 'DRAFT' && (
                        <Button
                            onClick={() => router.push(`/shorts/${id}/edit`)}
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Gerar Roteiro
                        </Button>
                    )}

                    <Button variant="outline" size="icon" onClick={handleDelete} disabled={isProcessing}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {isProcessing && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6 space-y-2">
                        <div className="flex items-center justify-between text-sm font-medium text-primary">
                            <span className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 animate-pulse" />
                                {short.status === 'GENERATING_SCRIPT' ? 'Escrevendo roteiro...' :
                                    short.status === 'GENERATING_PROMPTS' ? 'Criando prompts visuais...' :
                                        'Pintando as cenas...'}
                            </span>
                            <span>{short.progress}%</span>
                        </div>
                        <Progress value={short.progress} className="h-2" />
                    </CardContent>
                </Card>
            )}

            {short.status === 'SCRIPT_READY' && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary text-primary-foreground p-2 rounded-full">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold">Roteiro Pronto para Revisão!</h4>
                            <p className="text-sm text-muted-foreground">Revise as cenas e aprove para gerar as imagens.</p>
                        </div>
                    </div>
                    <Button onClick={() => router.push(`/shorts/${id}/edit`)} className="w-full md:w-auto">
                        Revisar Agora
                    </Button>
                </div>
            )}

            {short.errorMessage && (
                <Card className="border-destructive/20 bg-destructive/5">
                    <CardContent className="pt-4 flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-destructive">Erro na Geração</p>
                            <p className="text-xs text-muted-foreground">{short.errorMessage}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lado Esquerdo: Lista de Cenas / Preview */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Storyboard das Cenas
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {short.scenes.map((scene) => (
                            <Card key={scene.id} className="overflow-hidden group">
                                <div className="aspect-[9/16] bg-muted relative">
                                    {scene.mediaUrl ? (
                                        <img
                                            src={scene.mediaUrl}
                                            alt={`Cena ${scene.order + 1}`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                                            <ImageIcon className="h-12 w-12 mb-2 opacity-20" />
                                            <p className="text-xs">Aguardando geração da imagem...</p>
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] font-bold backdrop-blur-sm">
                                        {scene.order + 1} • {scene.duration}s
                                    </div>
                                    {scene.isGenerated && (
                                        <div className="absolute top-2 right-2 p-1 rounded-full bg-emerald-500 text-white">
                                            <CheckCircle className="h-3 w-3" />
                                        </div>
                                    )}
                                </div>
                                <CardContent className="p-3 bg-card/80 backdrop-blur-sm">
                                    <p className="text-xs font-medium line-clamp-2 min-h-[2.5rem]">
                                        {scene.narration}
                                    </p>
                                    {(scene.visualDesc || scene.imagePrompt) && (
                                        <Separator className="my-2" />
                                    )}
                                    {scene.imagePrompt ? (
                                        <p className="text-[10px] text-muted-foreground italic line-clamp-1 border-l-2 pl-2 border-primary/20">
                                            {scene.imagePrompt}
                                        </p>
                                    ) : scene.visualDesc ? (
                                        <p className="text-[10px] text-muted-foreground italic line-clamp-1 border-l-2 pl-2 border-primary/20">
                                            {scene.visualDesc}
                                        </p>
                                    ) : null}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">✨ Hook</h3>
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

                {/* Lado Direito: Info / Roteiro Completo */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Configurações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Tema</p>
                                <p className="text-sm">{short.theme}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Estilo</p>
                                    <Badge variant="outline" className="capitalize">{short.style}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Modelo IA</p>
                                    <Badge variant="secondary" className="gap-1.5 py-0.5">
                                        <span>{aiModelsData?.find(m => m.id === short.aiModel)?.icon || '🚀'}</span>
                                        {aiModelsData?.find(m => m.id === short.aiModel)?.name || short.aiModel || 'Padrão'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {short.status === 'SCRIPT_APPROVED' && (
                        <CreditEstimate
                            modelId={short.aiModel || "deepseek/deepseek-v3.2"}
                            estimatedScenes={short.scenes.length}
                        />
                    )}

                    <Tabs defaultValue="script">
                        <TabsList className="w-full">
                            <TabsTrigger value="script" className="flex-1"><Type className="h-3 w-3 mr-2" /> Roteiro</TabsTrigger>
                            <TabsTrigger value="prompts" className="flex-1"><ImageIcon className="h-3 w-3 mr-2" /> Prompts</TabsTrigger>
                        </TabsList>
                        <TabsContent value="script" className="mt-4">
                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    {short.scenes.map((scene) => (
                                        <div key={scene.id} className="space-y-1">
                                            <p className="text-[10px] font-bold text-primary">Cena {scene.order + 1}</p>
                                            <p className="text-xs leading-relaxed">{scene.narration}</p>
                                            <Separator className="mt-2 opacity-50" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="prompts" className="mt-4">
                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    {short.scenes.map((scene) => (
                                        <div key={scene.id} className="space-y-1">
                                            <p className="text-[10px] font-bold text-primary">Prompt {scene.order + 1}</p>
                                            <p className="text-[10px] text-muted-foreground italic bg-muted p-2 rounded">
                                                {scene.imagePrompt || scene.visualDesc || "Ainda não gerado"}
                                            </p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
