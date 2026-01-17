"use client"

import React from "react"
import { CreditCard, ImageIcon, Video } from "lucide-react"

import { StandardPageHeader } from "@/components/ui/standard-page-header"
import { useCredits } from "@/hooks/use-credits"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    ImageGenerationForm,
    VideoGenerationForm,
    GenerationPreview
} from "@/components/ai-studio"
import { type GenerateImageOutput, type GenerateVideoOutput } from "@/hooks/use-fal-generation"

export default function AIStudioPage() {
    // usePageConfig helper removed in favor of StandardPageHeader

    const { credits } = useCredits()
    const [activeTab, setActiveTab] = React.useState<"image" | "video">("image")
    const [result, setResult] = React.useState<{
        type: 'image' | 'video' | null
        images?: GenerateImageOutput['images']
        video?: GenerateVideoOutput['video']
        isLoading: boolean
    }>({
        type: null,
        isLoading: false,
    })

    const handleImageGenerated = (data: GenerateImageOutput) => {
        setResult({
            type: 'image',
            images: data.images,
            isLoading: false,
        })
    }

    const handleVideoGenerated = (data: GenerateVideoOutput) => {
        setResult({
            type: 'video',
            video: data.video,
            isLoading: false,
        })
    }

    return (
        <div className="container mx-auto flex flex-col gap-6 lg:gap-8">
            {/* Header com Créditos */}
            {/* Header com Créditos */}
            <StandardPageHeader
                title="Estúdio"
                subtitle="AI"
                description="Sua central criativa de mídia com fal.ai"
                icon={ImageIcon}
                badge="CREATIVE SUITE"
                action={
                    <Card className="flex items-center gap-3 bg-primary/5 px-4 py-2 border-primary/20 shadow-none">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saldo</span>
                            <span className="text-lg font-bold leading-none">
                                {credits?.creditsRemaining ?? 0} <span className="text-xs font-normal">créditos</span>
                            </span>
                        </div>
                    </Card>
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                {/* Formulários (Esquerda) */}
                <Card className="lg:col-span-4 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle>Configurações</CardTitle>
                        <CardDescription>Defina os parâmetros da sua geração</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs
                            defaultValue="image"
                            className="w-full"
                            onValueChange={(v) => setActiveTab(v as "image" | "video")}
                        >
                            <TabsList className="grid w-full grid-cols-2 mb-6">
                                <TabsTrigger value="image" className="flex gap-2">
                                    <ImageIcon className="h-4 w-4" />
                                    Imagens
                                </TabsTrigger>
                                <TabsTrigger value="video" className="flex gap-2">
                                    <Video className="h-4 w-4" />
                                    Vídeos
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="image">
                                <ImageGenerationForm
                                    onGenerated={handleImageGenerated}
                                    disabled={result.isLoading}
                                />
                            </TabsContent>

                            <TabsContent value="video">
                                <VideoGenerationForm
                                    onGenerated={handleVideoGenerated}
                                    disabled={result.isLoading}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Preview (Direita) */}
                <Card className="lg:col-span-8 shadow-sm h-full min-h-[500px]">
                    <CardHeader className="pb-4 border-b">
                        <CardTitle>Preview</CardTitle>
                        <CardDescription>O resultado da sua criação aparecerá aqui</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 h-full">
                        <GenerationPreview
                            type={result.type}
                            images={result.images}
                            video={result.video}
                            isLoading={result.isLoading}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
