"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShortScene } from "@/hooks/use-shorts"

interface EditSceneDialogProps {
    scene: ShortScene | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (data: { narration?: string; visualDesc?: string; duration?: number }) => Promise<void>
}

export function EditSceneDialog({
    scene,
    open,
    onOpenChange,
    onSave
}: EditSceneDialogProps) {
    const [narration, setNarration] = useState("")
    const [visualDesc, setVisualDesc] = useState("")
    const [duration, setDuration] = useState(5)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (scene) {
            setNarration(scene.narration || "")
            setVisualDesc(scene.visualDesc || "")
            setDuration(scene.duration || 5)
        }
    }, [scene])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave({ narration, visualDesc, duration })
            onOpenChange(false)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Editar Cena</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="duration">Duração (segundos)</Label>
                        <Input
                            id="duration"
                            type="number"
                            min={1}
                            max={30}
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="narration">🎤 Narração</Label>
                        <Textarea
                            id="narration"
                            rows={4}
                            value={narration}
                            onChange={(e) => setNarration(e.target.value)}
                            placeholder="O que será falado nesta cena..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="visualDesc">👁️ Descrição Visual</Label>
                        <Textarea
                            id="visualDesc"
                            rows={4}
                            value={visualDesc}
                            onChange={(e) => setVisualDesc(e.target.value)}
                            placeholder="O que deve aparecer na imagem..."
                        />
                        <p className="text-xs text-muted-foreground italic">
                            Dica: Seja específico na descrição visual para melhores resultados na geração de imagem.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
