"use client"

import React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { StyleForm } from '@/components/estilos/StyleForm'
import { useStyle, useUpdateStyle } from '@/hooks/use-styles'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function EditarEstiloPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const { data, isLoading: loadingStyle } = useStyle(id)
    const updateStyle = useUpdateStyle()

    const handleSubmit = (formData: any) => {
        updateStyle.mutate({ id, ...formData }, {
            onSuccess: () => {
                router.push('/estilos')
            }
        })
    }

    if (loadingStyle) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Carregando estilo...</p>
            </div>
        )
    }

    if (!data?.style) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold">Estilo não encontrado</h2>
                <Button onClick={() => router.push('/estilos')}>Voltar para Estilos</Button>
            </div>
        )
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-4 hover:bg-transparent hover:text-primary p-0 h-auto"
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Voltar para Estilos
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">🎨 Editar Estilo</h1>
                <p className="text-muted-foreground mt-1">
                    Ajuste as configurações do estilo <span className="text-foreground font-semibold">"{data.style.name}"</span>.
                </p>
            </div>

            <StyleForm
                initialData={data.style}
                onSubmit={handleSubmit}
                isLoading={updateStyle.isPending}
            />
        </div>
    )
}
