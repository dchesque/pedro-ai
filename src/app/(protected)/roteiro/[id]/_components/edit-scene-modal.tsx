'use client'

import React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Sparkles,
    Image as ImageIcon,
    Clock,
    Save,
    Loader2,
    AlertCircle
} from "lucide-react"
import { useUpdateScene } from "@/hooks/use-shorts"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

interface EditSceneModalProps {
    isOpen: boolean
    onClose: () => void
    scene: any
    shortId: string
}

export function EditSceneModal({
    isOpen,
    onClose,
    scene,
    shortId
}: EditSceneModalProps) {
    const updateSceneMutation = useUpdateScene()

    const [formData, setFormData] = React.useState({
        narration: "",
        visualDesc: "",
        visualPrompt: "",
        duration: 5
    })

    React.useEffect(() => {
        if (scene) {
            setFormData({
                narration: scene.narration || "",
                visualDesc: scene.visualDesc || "",
                visualPrompt: scene.visualPrompt || scene.imagePrompt || "",
                duration: scene.duration || 5
            })
        }
    }, [scene])

    const handleSave = async () => {
        if (!formData.narration || !formData.visualPrompt) {
            toast.error("Narração e Prompt são obrigatórios.")
            return
        }

        try {
            await updateSceneMutation.mutateAsync({
                shortId,
                sceneId: scene.id,
                data: formData
            })
            toast.success("Cena atualizada com sucesso!")
            onClose()
        } catch (error) {
            toast.error("Erro ao salvar cena.")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl border-border/50 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-500" />
                        Editar Cena {scene?.order + 1}
                    </DialogTitle>
                    <DialogDescription>
                        Ajuste o texto e as instruções visuais desta cena.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Narração */}
                    <div className="space-y-2">
                        <Label htmlFor="narration" className="text-xs font-bold uppercase tracking-wider h-auto flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-primary" />
                            Narração (Texto Falado)
                        </Label>
                        <Textarea
                            id="narration"
                            placeholder="O que será dito nesta cena..."
                            className="min-h-[100px] bg-muted/30 focus:bg-background transition-colors resize-none text-sm leading-relaxed"
                            value={formData.narration}
                            onChange={(e) => setFormData(prev => ({ ...prev, narration: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Visual Description */}
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="visualPrompt" className="text-xs font-bold uppercase tracking-wider h-auto flex items-center gap-2">
                                <ImageIcon className="h-3 w-3 text-indigo-500" />
                                Prompt Visual (Inglês)
                            </Label>
                            <Textarea
                                id="visualPrompt"
                                placeholder="Instruções para a IA gerar a imagem..."
                                className="min-h-[80px] bg-muted/30 focus:bg-background transition-colors resize-none text-xs font-mono"
                                value={formData.visualPrompt}
                                onChange={(e) => setFormData(prev => ({ ...prev, visualPrompt: e.target.value }))}
                            />
                            <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                                <AlertCircle className="h-2.5 w-2.5" />
                                O prompt em inglês garante melhores resultados com a IA.
                            </p>
                        </div>

                        {/* Duração */}
                        <div className="space-y-2">
                            <Label htmlFor="duration" className="text-xs font-bold uppercase tracking-wider h-auto flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                Duração (seg)
                            </Label>
                            <Input
                                id="duration"
                                type="number"
                                min={1}
                                max={30}
                                className="bg-muted/30"
                                value={formData.duration}
                                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 1 }))}
                            />
                        </div>
                    </div>
                </div>

                <Separator className="bg-border/30" />

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} disabled={updateSceneMutation.isPending}>
                        Cancelar
                    </Button>
                    <Button
                        className="font-bold px-8 shadow-lg shadow-primary/20"
                        onClick={handleSave}
                        disabled={updateSceneMutation.isPending}
                    >
                        {updateSceneMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Salvar Alterações
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
