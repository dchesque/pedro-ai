"use client"

import React from "react"
import { Plus, Video, Loader2, Play, Trash2, RefreshCw } from "lucide-react"

import { usePageConfig } from "@/hooks/use-page-config"
import { useCredits } from "@/hooks/use-credits"
import { useShorts, useCreateShort, useGenerateShort, useDeleteShort, type Short } from "@/hooks/use-shorts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { CreateShortForm } from "@/components/shorts/CreateShortForm"
import { ShortCard } from "@/components/shorts/ShortCard"

export default function ShortsPage() {
    usePageConfig('Shorts', 'Crie shorts virais com IA de forma automática.', [
        { label: 'Início', href: '/dashboard' },
        { label: 'Shorts' },
    ])

    const { credits } = useCredits()
    const { data, isLoading, error, refetch } = useShorts()
    const createShort = useCreateShort()
    const generateShort = useGenerateShort()
    const deleteShort = useDeleteShort()

    const [createDialogOpen, setCreateDialogOpen] = React.useState(false)

    // Polling para shorts em processamento
    React.useEffect(() => {
        const hasProcessing = data?.shorts.some(s =>
            ['SCRIPTING', 'PROMPTING', 'GENERATING'].includes(s.status)
        )

        if (hasProcessing) {
            const interval = setInterval(() => {
                refetch()
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [data, refetch])

    const handleCreate = async (values: { theme: string; targetDuration: number; style: string }) => {
        try {
            const result = await createShort.mutateAsync({
                theme: values.theme,
                targetDuration: values.targetDuration,
                style: values.style as any,
            })
            setCreateDialogOpen(false)
            // Iniciar pipeline automaticamente
            generateShort.mutate({ id: result.short.id, step: 'full' })
        } catch (e) {
            // Erro já tratado no hook
        }
    }

    const shorts = data?.shorts ?? []

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">Shorts</h2>
                    <p className="text-sm text-muted-foreground">
                        Crie shorts virais automaticamente com IA
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-secondary/50 px-3 py-1.5 rounded-full border border-border flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Disponível</span>
                        <span className="font-bold text-sm">{credits?.creditsRemaining ?? 0}</span>
                        <span className="text-xs text-muted-foreground">créditos</span>
                    </div>

                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Short
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Criar Novo Short</DialogTitle>
                                <DialogDescription>
                                    Defina o tema e estilo do seu short. A IA cuidará do resto.
                                </DialogDescription>
                            </DialogHeader>
                            <CreateShortForm
                                onSubmit={handleCreate}
                                isLoading={createShort.isPending}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Lista de Shorts */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[300px] rounded-xl" />
                    ))}
                </div>
            ) : error ? (
                <Card className="p-8 text-center border-destructive/20 bg-destructive/5">
                    <p className="text-destructive font-medium">Erro ao carregar shorts</p>
                    <p className="text-sm text-muted-foreground mt-1">Verifique sua conexão e tente novamente.</p>
                    <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                        Tentar novamente
                    </Button>
                </Card>
            ) : shorts.length === 0 ? (
                <Card className="p-12 text-center border-dashed bg-muted/20">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Video className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">Nenhum short ainda</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                        Seu estúdio de criação está vazio. Que tal começar sua primeira produção viral agora mesmo?
                    </p>
                    <Button className="mt-6 px-8" onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Meu Primeiro Short
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {shorts.map((short) => (
                        <ShortCard
                            key={short.id}
                            short={short}
                            onGenerate={(step) => generateShort.mutate({ id: short.id, step })}
                            onDelete={() => deleteShort.mutate(short.id)}
                            isGenerating={generateShort.isPending}
                            isDeleting={deleteShort.isPending}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
