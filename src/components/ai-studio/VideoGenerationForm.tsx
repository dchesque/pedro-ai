"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Video, Loader2, ChevronDown, ChevronUp, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useGenerateVideo, type GenerateVideoOutput } from "@/hooks/use-fal-generation"
import { useCredits } from "@/hooks/use-credits"
import { useToast } from "@/hooks/use-toast"

const videoSchema = z.object({
    prompt: z.string().min(1, 'Prompt é obrigatório').max(2000),
    image_url: z.string().url('URL inválida').optional().or(z.literal('')),
    duration: z.enum(['5', '10']),
    aspect_ratio: z.enum(['16:9', '9:16', '1:1']),
    negative_prompt: z.string().max(500).optional(),
})

type VideoFormValues = z.infer<typeof videoSchema>

interface VideoGenerationFormProps {
    onGenerated: (result: GenerateVideoOutput) => void
    disabled?: boolean
}

export function VideoGenerationForm({ onGenerated, disabled }: VideoGenerationFormProps) {
    const { toast } = useToast()
    const { credits } = useCredits()
    const generateVideo = useGenerateVideo()
    const [showNegative, setShowNegative] = React.useState(false)
    const [isUploading, setIsUploading] = React.useState(false)
    const [uploadedImage, setUploadedImage] = React.useState<{ url: string; name: string } | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const form = useForm<VideoFormValues>({
        resolver: zodResolver(videoSchema),
        defaultValues: {
            prompt: "",
            image_url: "",
            duration: "5",
            aspect_ratio: "9:16",
            negative_prompt: "",
        },
    })

    const durationStr = form.watch("duration")
    const durationCost = parseInt(durationStr)
    const canGenerate = (credits?.creditsRemaining ?? 0) >= durationCost && !disabled && !isUploading

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Arquivo inválido',
                description: 'Por favor, selecione uma imagem.',
                variant: 'destructive',
            })
            return
        }

        // Validar tamanho (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast({
                title: 'Arquivo muito grande',
                description: 'O tamanho máximo é 10MB.',
                variant: 'destructive',
            })
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Falha no upload')

            const data = await res.json()

            form.setValue('image_url', data.url)
            setUploadedImage({ url: data.url, name: file.name })

            toast({ title: 'Imagem enviada com sucesso!' })
        } catch {
            toast({
                title: 'Erro no upload',
                description: 'Não foi possível enviar a imagem.',
                variant: 'destructive',
            })
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleRemoveImage = () => {
        form.setValue('image_url', '')
        setUploadedImage(null)
    }

    async function onSubmit(values: VideoFormValues) {
        try {
            const result = await generateVideo.mutateAsync({
                prompt: values.prompt,
                image_url: values.image_url || undefined,
                duration: values.duration,
                aspect_ratio: values.aspect_ratio,
                negative_prompt: values.negative_prompt || undefined,
            })
            onGenerated(result)
        } catch {
            // Erro já tratado no hook via toast
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prompt</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descreva o vídeo que deseja gerar..."
                                    className="min-h-[120px] resize-none"
                                    disabled={generateVideo.isPending || disabled}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Descreva movimentos, estilos e detalhes da cena.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormItem>
                    <FormLabel>Imagem Base (Image-to-Video)</FormLabel>

                    {uploadedImage ? (
                        <div className="relative rounded-lg border bg-muted p-2">
                            <div className="flex items-center gap-3">
                                <img
                                    src={uploadedImage.url}
                                    alt="Preview"
                                    className="h-16 w-16 rounded object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{uploadedImage.name}</p>
                                    <p className="text-xs text-muted-foreground">Imagem carregada</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemoveImage}
                                    disabled={generateVideo.isPending}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div
                                className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                ) : (
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                )}
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {isUploading ? 'Enviando...' : 'Clique para fazer upload'}
                                </p>
                                <p className="text-xs text-muted-foreground">PNG, JPG até 10MB</p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isUploading || generateVideo.isPending}
                            />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">ou cole uma URL</span>
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="image_url"
                                render={({ field }) => (
                                    <FormControl>
                                        <Input
                                            placeholder="https://... (opcional)"
                                            disabled={isUploading || generateVideo.isPending || disabled}
                                            {...field}
                                        />
                                    </FormControl>
                                )}
                            />
                        </div>
                    )}

                    <FormDescription>
                        Forneça uma imagem para animar (opcional).
                    </FormDescription>
                    <FormMessage />
                </FormItem>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duração</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={generateVideo.isPending || disabled}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a duração" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="5">5 segundos (5 créditos)</SelectItem>
                                        <SelectItem value="10">10 segundos (10 créditos)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="aspect_ratio"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Proporção</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={generateVideo.isPending || disabled}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione a proporção" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="9:16">Vertical (9:16)</SelectItem>
                                        <SelectItem value="16:9">Horizontal (16:9)</SelectItem>
                                        <SelectItem value="1:1">Quadrado (1:1)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Collapsible
                    open={showNegative}
                    onOpenChange={setShowNegative}
                    className="space-y-2"
                >
                    <div className="flex items-center justify-between">
                        <FormLabel>Configurações Avançadas</FormLabel>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                {showNegative ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                <span className="sr-only">Toggle</span>
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="negative_prompt"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prompt Negativo</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="O que evitar no vídeo..."
                                            className="resize-none"
                                            disabled={generateVideo.isPending || disabled}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CollapsibleContent>
                </Collapsible>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={!canGenerate || generateVideo.isPending}
                >
                    {generateVideo.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando Vídeo... isso pode levar alguns minutos
                        </>
                    ) : (
                        <>
                            <Video className="mr-2 h-4 w-4" />
                            Gerar Vídeo ({durationCost} créditos)
                        </>
                    )}
                </Button>

                {!canGenerate && !generateVideo.isPending && (credits?.creditsRemaining ?? 0) < durationCost && (
                    <p className="text-center text-xs text-destructive">
                        Créditos insuficientes para gerar um vídeo de {durationStr} segundos.
                    </p>
                )}
            </form>
        </Form>
    )
}
