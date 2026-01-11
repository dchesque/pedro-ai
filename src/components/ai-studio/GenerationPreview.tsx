"use client"

import React from "react"
import { Download, Copy, ImageIcon, Video as VideoIcon, Loader2, Check } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface GenerationPreviewProps {
    type: 'image' | 'video' | null
    images?: Array<{ url: string; width: number; height: number }>
    video?: { url: string }
    isLoading?: boolean
}

export function GenerationPreview({ type, images, video, isLoading }: GenerationPreviewProps) {
    const { toast } = useToast()
    const [copiedUrl, setCopiedUrl] = React.useState<string | null>(null)

    const copyToClipboard = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url)
            setCopiedUrl(url)
            toast({ title: "URL copiada!", duration: 2000 })
            setTimeout(() => setCopiedUrl(null), 2000)
        } catch (err) {
            toast({ title: "Falha ao copiar URL", variant: "destructive" })
        }
    }

    const downloadFile = async (url: string, filename: string) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (err) {
            toast({ title: "Falha ao baixar arquivo", variant: "destructive" })
        }
    }

    if (isLoading) {
        return (
            <Card className="flex h-full flex-col overflow-hidden border-none shadow-none">
                <CardContent className="flex flex-1 flex-col items-center justify-center space-y-4 p-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary/50" />
                    <div className="space-y-2 text-center">
                        <h3 className="text-lg font-medium">Gerando conteúdo...</h3>
                        <p className="text-sm text-muted-foreground">
                            {type === 'video'
                                ? "Isso pode levar de 1 a 5 minutos. Por favor, aguarde."
                                : "Sua imagem estará pronta em alguns segundos."}
                        </p>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                        <Skeleton className="aspect-square w-full rounded-xl" />
                        <Skeleton className="aspect-square w-full rounded-xl" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!type) {
        return (
            <Card className="flex h-full flex-col items-center justify-center border-dashed border-2 bg-muted/50 p-12 text-center shadow-none">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-background mb-4">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">Tudo pronto!</h3>
                <p className="max-w-[300px] text-sm text-muted-foreground mt-2">
                    Use o formulário ao lado para começar a criar imagens e vídeos incríveis com IA.
                </p>
            </Card>
        )
    }

    return (
        <Card className="flex h-full flex-col overflow-hidden border-none shadow-none">
            <CardContent className="flex-1 p-0 sm:p-4">
                {type === 'image' && images && images.length > 0 && (
                    <div className={`grid gap-4 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                        {images.map((img, idx) => (
                            <div key={idx} className="group relative overflow-hidden rounded-xl bg-muted">
                                <img
                                    src={img.url}
                                    alt={`Gerada ${idx + 1}`}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            onClick={() => downloadFile(img.url, `ai-studio-image-${Date.now()}.png`)}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            onClick={() => copyToClipboard(img.url)}
                                        >
                                            {copiedUrl === img.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {type === 'video' && video && (
                    <div className="space-y-4">
                        <div className="group relative aspect-video overflow-hidden rounded-xl bg-muted">
                            <video
                                src={video.url}
                                controls
                                className="h-full w-full"
                                poster="/video-poster.png" // Placeholder
                            />
                        </div>
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <VideoIcon className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Vídeo Gerado</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyToClipboard(video.url)}
                                >
                                    {copiedUrl === video.url ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                                    {copiedUrl === video.url ? 'Copiado' : 'Copiar URL'}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => downloadFile(video.url, `ai-studio-video-${Date.now()}.mp4`)}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
