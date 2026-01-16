'use client'

import React from "react"
import { AlertCircle, RotateCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function RoteiroError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const router = useRouter()

    React.useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center space-y-6">
            <div className="bg-destructive/10 p-6 rounded-full animate-bounce">
                <AlertCircle className="h-16 w-16 text-destructive" />
            </div>

            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Ops! Algo deu errado</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Ocorreu um erro inesperado ao carregar os detalhes do roteiro.
                    Nossa equipe já foi notificada.
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                    variant="default"
                    size="lg"
                    onClick={() => reset()}
                    className="font-bold px-8 shadow-lg shadow-primary/20"
                >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Tentar Novamente
                </Button>

                <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push("/dashboard")}
                    className="font-bold px-8"
                >
                    <Home className="mr-2 h-4 w-4" />
                    Ir para o Início
                </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
                <pre className="mt-8 p-4 bg-muted rounded-lg text-left text-xs overflow-auto max-w-full border border-border/50 text-destructive">
                    {error.message}
                    {error.stack}
                </pre>
            )}
        </div>
    )
}
