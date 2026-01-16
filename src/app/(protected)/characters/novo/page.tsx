"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Plus,
    Image as ImageIcon,
    Sparkles,
    Upload,
    Loader2,
    AlertCircle,
    Check,
    ChevronLeft,
    RefreshCw,
    Languages,
    Copy,
    AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useCreateCharacter } from "@/hooks/use-characters"
import { useCredits } from "@/hooks/use-credits"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useSetPageMetadata } from "@/contexts/page-metadata"

const characterSchema = z.object({
    name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").max(100, "O nome deve ter no máximo 100 caracteres"),
    description: z.string().min(10, "A descrição breve deve ter pelo menos 10 caracteres").max(1000, "A descrição breve deve ter no máximo 1000 caracteres").optional().or(z.literal('')),
    imageUrl: z.string().url("URL da imagem inválida").min(1, "A imagem é obrigatória"),
    promptDescription: z.string().min(50, "A descrição detalhada deve ser gerada ou preenchida corretamente"),
})

type CharacterFormValues = z.infer<typeof characterSchema>

export default function NewCharacterPage() {
    useSetPageMetadata({
        title: "Novo Personagem",
        description: "Crie um personagem consistente usando IA Vision ou gere um do zero.",
        breadcrumbs: [
            { label: "Personagens", href: "/characters" },
            { label: "Novo" }
        ]
    })

    const router = useRouter()
    const { toast } = useToast()
    const { credits, refresh: refreshCredits } = useCredits()
    const createMutation = useCreateCharacter()

    const [activeTab, setActiveTab] = useState("upload")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const form = useForm<CharacterFormValues>({
        resolver: zodResolver(characterSchema),
        defaultValues: {
            name: "",
            description: "",
            imageUrl: "",
            promptDescription: "",
        },
    })

    // Sincronizar imageUrl com preview
    const watchedImageUrl = form.watch("imageUrl")
    useEffect(() => {
        if (watchedImageUrl && watchedImageUrl.startsWith("http")) {
            setPreviewUrl(watchedImageUrl)
        }
    }, [watchedImageUrl])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })
            const data = await res.json()
            if (data.url) {
                form.setValue("imageUrl", data.url)
                setPreviewUrl(data.url)
                toast({ title: "Upload concluído!" })
            }
        } catch (error) {
            toast({ title: "Erro no upload", variant: "destructive" })
        } finally {
            setIsUploading(false)
        }
    }

    const [analysisError, setAnalysisError] = useState<string | null>(null)

    const hasEssentialInfo = (desc: string) => {
        const keywords = ['cabelo', 'olhos', 'roupa', 'expressão', 'idade', 'hair', 'eyes', 'clothes', 'smile', 'face']
        return keywords.some(k => desc.toLowerCase().includes(k))
    }

    const handleAnalyze = async () => {
        const imageUrl = form.getValues("imageUrl")
        if (!imageUrl) {
            toast({ title: "Selecione uma imagem primeiro", variant: "destructive" })
            return
        }

        setIsAnalyzing(true)
        setAnalysisError(null)
        try {
            const res = await fetch("/api/characters/analyze", {
                method: "POST",
                body: JSON.stringify({ imageUrl }),
            })

            if (res.status === 402) {
                toast({ title: "Créditos insuficientes", description: "Você precisa de 2 créditos para análise.", variant: "destructive" })
                return
            }

            const data = await res.json()
            if (data.portrait) {
                // Verificar se a IA recusou ("sorry", etc)
                if (data.portrait.toLowerCase().includes("sorry") || data.portrait.toLowerCase().includes("can't help")) {
                    setAnalysisError("A IA de visão recusou a análise desta imagem por políticas de conteúdo.")
                    return
                }
                form.setValue("promptDescription", data.portrait)
                toast({ title: "Análise concluída!", description: "Descrição detalhada gerada com sucesso." })
                refreshCredits()
            } else {
                throw new Error(data.error || "Falha na análise")
            }
        } catch (error) {
            setAnalysisError((error as Error).message)
            toast({ title: "Erro na análise", description: (error as Error).message, variant: "destructive" })
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleGenerateComplete = async () => {
        const name = form.getValues("name")
        const description = form.getValues("description")

        if (!name || (description?.length || 0) < 10) {
            toast({ title: "Preencha o nome e uma breve descrição", description: "A descrição ajuda a IA a criar o visual correto.", variant: "destructive" })
            return
        }

        if (!hasEssentialInfo(description || "")) {
            toast({
                title: "Descrição pouco detalhada",
                description: "Tente incluir detalhes como cor do cabelo, olhos, tipo de roupa ou expressão para melhores resultados.",
                variant: "destructive"
            })
            // Não bloqueamos, apenas avisamos
        }

        setIsGenerating(true)
        try {
            const res = await fetch("/api/characters/generate", {
                method: "POST",
                body: JSON.stringify({ name, description }),
            })

            if (res.status === 402) {
                toast({ title: "Créditos insuficientes", description: "Você precisa de 4 créditos para geração completa.", variant: "destructive" })
                return
            }

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.details || data.error || `Erro ${res.status}: Falha na geração`)
            }

            if (data.imageUrl && data.portrait) {
                form.setValue("imageUrl", data.imageUrl)
                form.setValue("promptDescription", data.portrait)
                setPreviewUrl(data.imageUrl)
                toast({ title: "Personagem gerado!", description: "Imagem e portrait criados com sucesso." })
                refreshCredits()
            } else {
                throw new Error("Resposta incompleta da IA")
            }
        } catch (error) {
            console.error('Erro detalhado na geração:', error)
            toast({
                title: "Erro na geração",
                description: (error as Error).message,
                variant: "destructive"
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const onSubmit = async (values: CharacterFormValues) => {
        try {
            await createMutation.mutateAsync(values)
            toast({ title: "Personagem salvo!", description: "Seu personagem foi adicionado à biblioteca." })
            router.push("/characters")
        } catch (error) {
            toast({ title: "Erro ao salvar", variant: "destructive" })
        }
    }

    return (
        <div className="w-full max-w-7xl mx-auto py-6 space-y-8">

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 h-full">
                {/* Form Side */}
                <div className="lg:col-span-3 space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-8">
                            <TabsTrigger value="upload" className="flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Usar Minha Imagem
                            </TabsTrigger>
                            <TabsTrigger value="ai" className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Criar com IA
                            </TabsTrigger>
                        </TabsList>

                        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Informações Básicas</CardTitle>
                                <CardDescription>Identifique seu personagem.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome do Personagem</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ex: Pedro, o Fazendeiro"
                                        {...form.register("name")}
                                        className="bg-background/50 border-border/50 focus:border-primary/50"
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                                    )}
                                </div>

                                <TabsContent value="upload" className="m-0 space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label>Imagem de Referência</Label>
                                        <div className="flex flex-col gap-4">
                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className={cn(
                                                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-muted/50",
                                                    previewUrl ? "border-primary/50 bg-primary/5" : "border-muted-foreground/20"
                                                )}
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                ) : previewUrl ? (
                                                    <div className="text-center">
                                                        <Check className="h-8 w-8 text-primary mx-auto mb-2" />
                                                        <p className="text-sm font-medium">Imagem selecionada</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="h-8 w-8 text-muted-foreground" />
                                                        <div className="text-center">
                                                            <p className="text-sm font-medium">Clique para fazer upload</p>
                                                            <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 10MB</p>
                                                        </div>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                />
                                            </div>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <Input
                                                    placeholder="Ou cole a URL da imagem..."
                                                    className="pl-10"
                                                    {...form.register("imageUrl")}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="w-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                                        disabled={!watchedImageUrl || isAnalyzing}
                                        onClick={handleAnalyze}
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Analisando...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Gerar Descrição com IA (2 créditos)
                                            </>
                                        )}
                                    </Button>
                                </TabsContent>

                                <TabsContent value="ai" className="m-0 space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Descrição Breve</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Descreva visualmente o personagem... Ex: Um senhor fazendeiro de 60 anos com chapéu de palha e macacão jeans."
                                            className={cn(
                                                "min-h-[100px] resize-none",
                                                form.watch("description")?.length || 0 > 1000 && "border-destructive focus-visible:ring-destructive"
                                            )}
                                            {...form.register("description")}
                                        />
                                        <div className="flex justify-between items-center px-1">
                                            <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                A IA usará esta descrição para criar a imagem e o portrait.
                                            </p>
                                            <span className={cn(
                                                "text-[10px] font-medium",
                                                (form.watch("description")?.length || 0) > 1000 ? "text-destructive" : "text-muted-foreground"
                                            )}>
                                                {form.watch("description")?.length || 0}/1000
                                            </span>
                                        </div>
                                        {form.formState.errors.description && (
                                            <p className="text-xs text-destructive mt-1">{form.formState.errors.description.message}</p>
                                        )}
                                    </div>

                                    <Button
                                        type="button"
                                        className="w-full shadow-lg shadow-primary/20"
                                        disabled={isGenerating || !form.watch("name") || (form.watch("description")?.length || 0) < 10}
                                        onClick={handleGenerateComplete}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Gerando Personagem...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Gerar Personagem Completo (4 créditos)
                                            </>
                                        )}
                                    </Button>
                                </TabsContent>
                            </CardContent>
                        </Card>

                        <Card className="mt-6 border-border/40 bg-card/50 backdrop-blur-sm">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <CardTitle className="text-lg">Portrait Detalhado</CardTitle>
                                        {(() => {
                                            const portrait = form.watch("promptDescription")
                                            const wordCount = portrait?.trim() ? portrait.trim().split(/\s+/).length : 0
                                            if (wordCount === 0) return null
                                            const quality = wordCount > 80 ? 'Excelente' : wordCount > 50 ? 'Bom' : 'Básico'
                                            const color = wordCount > 80 ? 'text-green-600 bg-green-50' : wordCount > 50 ? 'text-blue-600 bg-blue-50' : 'text-yellow-600 bg-yellow-50'

                                            return (
                                                <Badge variant="outline" className={cn("text-[10px] font-bold h-5 px-1.5", color)}>
                                                    {quality} ({wordCount} palavras)
                                                </Badge>
                                            )
                                        })()}
                                    </div>
                                    <CardDescription>A "digital" visual do seu personagem em inglês.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs gap-2"
                                        disabled={!form.watch("promptDescription")}
                                        onClick={() => {
                                            navigator.clipboard.writeText(form.getValues("promptDescription"))
                                            toast({ title: "Portrait copiado!", description: "O texto foi copiado para sua área de transferência." })
                                        }}
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                        Copiar
                                    </Button>
                                    <Languages className="h-5 w-5 text-muted-foreground opacity-50" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {watchedImageUrl && !form.watch("promptDescription") && !isAnalyzing && analysisError && (
                                    <Alert variant="destructive" className="bg-destructive/5 py-3">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="text-sm font-bold">Erro na Análise</AlertTitle>
                                        <AlertDescription className="text-xs">
                                            {analysisError}. Você pode escrever manualmente ou tentar novamente com outra imagem.
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleAnalyze}
                                                className="mt-2 w-full h-8 text-[10px] gap-2"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                Tentar Análise Novamente
                                            </Button>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Textarea
                                    className="min-h-[180px] font-mono text-sm leading-relaxed bg-muted/30 border-muted-foreground/10 focus:bg-background transition-all whitespace-pre-wrap"
                                    placeholder="Aguardando geração pelo Vision AI..."
                                    {...form.register("promptDescription")}
                                />
                                {form.formState.errors.promptDescription && (
                                    <p className="text-xs text-destructive mt-1">{form.formState.errors.promptDescription.message}</p>
                                )}
                                <div className="text-[10px] text-muted-foreground text-right italic">
                                    {form.watch("promptDescription")?.trim() ? form.watch("promptDescription").trim().split(/\s+/).length : 0} palavras
                                </div>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <p className="text-[10px] text-muted-foreground leading-tight">
                                    Este campo é fundamental para a IA manter a consistência do personagem em todas as cenas do seu vídeo.
                                </p>
                            </CardFooter>
                        </Card>
                    </Tabs>

                    <div className="flex justify-end gap-3 mt-8">
                        <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={createMutation.isPending || !form.watch("imageUrl") || !form.watch("promptDescription")}
                            className="bg-primary hover:bg-primary/90 px-8"
                        >
                            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Personagem
                        </Button>
                    </div>
                </div>

                {/* Preview Side */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="sticky top-6 border-border/40 bg-card/50 backdrop-blur-md overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="aspect-[9/16] relative bg-muted flex items-center justify-center">
                                {previewUrl ? (
                                    <>
                                        <Image
                                            src={previewUrl}
                                            alt="Preview"
                                            fill
                                            className="object-cover"
                                            unoptimized // For newly generated URLs or S3
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-4 left-4 right-4 text-white">
                                            <p className="font-bold text-xl">{form.watch("name") || "Nome do Personagem"}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-6 space-y-2 opacity-50">
                                        <ImageIcon className="h-12 w-12 mx-auto" />
                                        <p className="text-xs">A imagem aparecerá aqui</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="p-4 bg-muted/30">
                            <div className="w-full flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Créditos sugeridos</span>
                                <span className="font-bold text-primary">
                                    {credits?.creditsRemaining || 0} disponíveis
                                </span>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    )
}
