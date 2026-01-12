"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { StyleForm } from '@/components/estilos/StyleForm'
import { useCreateStyle } from '@/hooks/use-styles'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NovoEstiloPage() {
    const router = useRouter()
    const createStyle = useCreateStyle()

    const handleSubmit = (data: any) => {
        createStyle.mutate(data, {
            onSuccess: () => {
                router.push('/estilos')
            }
        })
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
                <h1 className="text-3xl font-bold tracking-tight">✨ Criar Novo Estilo</h1>
                <p className="text-muted-foreground mt-1">
                    Defina as regras e a estética que tornam seus vídeos únicos.
                </p>
            </div>

            <StyleForm
                onSubmit={handleSubmit}
                isLoading={createStyle.isPending}
            />
        </div>
    )
}
