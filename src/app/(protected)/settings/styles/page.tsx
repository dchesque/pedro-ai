"use client"

import React from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import {
    useUserStyles,
    useCreateUserStyle,
    useUpdateUserStyle,
    useDeleteUserStyle,
    Style
} from '@/hooks/use-agents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from '@/components/ui/skeleton'

export default function StylesSettingsPage() {
    const { data: stylesData, isLoading } = useUserStyles()
    const createStyle = useCreateUserStyle()
    const updateStyle = useUpdateUserStyle()
    const deleteStyle = useDeleteUserStyle()

    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [editingStyle, setEditingStyle] = React.useState<(Style & { id: string }) | null>(null)

    const styles = stylesData?.styles ?? []

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const data = {
            key: formData.get('key') as string,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            icon: formData.get('icon') as string,
            scriptwriterPrompt: formData.get('scriptwriterPrompt') as string,
            promptEngineerPrompt: formData.get('promptEngineerPrompt') as string,
            visualStyle: formData.get('visualStyle') as string,
            negativePrompt: formData.get('negativePrompt') as string,
        }

        if (editingStyle) {
            await updateStyle.mutateAsync({ id: editingStyle.id, ...data })
            setEditingStyle(null)
        } else {
            await createStyle.mutateAsync(data)
            setIsCreateOpen(false)
        }
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Meus Estilos</h1>
                <p className="text-muted-foreground">
                    Crie e gerencie seus estilos personalizados para geração de shorts.
                </p>
            </div>

            <div className="flex justify-end">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Estilo
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Criar Novo Estilo</DialogTitle>
                            <DialogDescription>
                                Defina as instruções personalizadas para seus agentes.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 py-4">
                            <StyleFormFields />
                            <DialogFooter>
                                <Button type="submit" disabled={createStyle.isPending}>
                                    {createStyle.isPending ? 'Criando...' : 'Criar Estilo'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[200px] w-full" />
                    ))}
                </div>
            ) : styles.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="rounded-full bg-muted p-3 mb-4">
                            <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">Nenhum estilo personalizado</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-2">
                            Você ainda não criou nenhum estilo. Personalize como a IA escreve e gera imagens para seus shorts.
                        </p>
                        <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                            Criar meu primeiro estilo
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {styles.map((style: any) => (
                        <Card key={style.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{style.icon || '🎨'}</span>
                                        <CardTitle>{style.name}</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setEditingStyle(style)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => deleteStyle.mutate(style.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardDescription>{style.description || 'Sem descrição'}</CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <div className="text-xs text-muted-foreground border-t pt-4">
                                    Key: <code className="bg-muted px-1 rounded">{style.key}</code>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {editingStyle && (
                <Dialog open={!!editingStyle} onOpenChange={(open) => !open && setEditingStyle(null)}>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Editar Estilo: {editingStyle.name}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4 py-4">
                            <StyleFormFields style={editingStyle} />
                            <DialogFooter>
                                <Button type="submit" disabled={updateStyle.isPending}>
                                    {updateStyle.isPending ? 'Salvando...' : 'Salvar Alterações'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}

function StyleFormFields({ style }: { style?: Style }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nome do Estilo</Label>
                <Input id="name" name="name" defaultValue={style?.name} placeholder="Ex: Gamer Pro" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="key">Identificador (ID)</Label>
                <Input id="key" name="key" defaultValue={style?.key} placeholder="ex: gamer_pro" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="icon">Emoji/Ícone</Label>
                <Input id="icon" name="icon" defaultValue={style?.icon} placeholder="Ex: 🎮" />
            </div>
            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Input id="description" name="description" defaultValue={style?.description} placeholder="Breve resumo deste estilo" />
            </div>

            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="scriptwriterPrompt">Prompt Adicional (Roteirista)</Label>
                <Textarea
                    id="scriptwriterPrompt"
                    name="scriptwriterPrompt"
                    defaultValue={style?.scriptwriterPrompt}
                    placeholder="Instruções específicas para a escrita do roteiro..."
                    className="min-h-[100px]"
                />
            </div>

            <div className="space-y-2 md:col-span-2">
                <Label htmlFor="promptEngineerPrompt">Prompt Adicional (Imagens)</Label>
                <Textarea
                    id="promptEngineerPrompt"
                    name="promptEngineerPrompt"
                    defaultValue={style?.promptEngineerPrompt}
                    placeholder="Instruções específicas para a geração de prompts de imagem..."
                    className="min-h-[100px]"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="visualStyle">Estilo Visual Base</Label>
                <Input
                    id="visualStyle"
                    name="visualStyle"
                    defaultValue={style?.visualStyle}
                    placeholder="Ex: cinematic, high detail..."
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="negativePrompt">Negative Prompt Base</Label>
                <Input
                    id="negativePrompt"
                    name="negativePrompt"
                    defaultValue={style?.negativePrompt}
                    placeholder="O que evitar nas imagens..."
                />
            </div>
        </div>
    )
}
