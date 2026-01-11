"use client"

import { useState } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface AddSceneDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAdd: (data: {
        order: number
        narration?: string
        visualDesc?: string
        duration?: number
        generateWithAI?: boolean
        aiInstructions?: string
    }) => Promise<void>
    nextOrder: number
}

export function AddSceneDialog({
    open,
    onOpenChange,
    onAdd,
    nextOrder
}: AddSceneDialogProps) {
    const [method, setMethod] = useState<"manual" | "ai">("manual")
    const [narration, setNarration] = useState("")
    const [visualDesc, setVisualDesc] = useState("")
    const [instructions, setInstructions] = useState("")
    const [duration, setDuration] = useState(5)
    const [isAdding, setIsAdding] = useState(false)

    const handleAdd = async () => {
        setIsAdding(true)
        try {
            if (method === "ai") {
                await onAdd({
                    order: nextOrder,
                    generateWithAI: true,
                    aiInstructions: instructions,
                    duration
                })
            } else {
                await onAdd({
                    order: nextOrder,
                    narration,
                    visualDesc,
                    duration
                })
            }
            onOpenChange(false)
            // Reset
            setNarration("")
            setVisualDesc("")
            setInstructions("")
        } finally {
            setIsAdding(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Cena</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <Label>Como deseja criar a cena?</Label>
                        <RadioGroup value={method} onValueChange={(v) => setMethod(v as any)} className="flex flex-col gap-3">
                            <div className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <RadioGroupItem value="ai" id="method-ai" className="mt-1" />
                                <Label htmlFor="method-ai" className="cursor-pointer font-normal flex-1">
                                    <div className="font-bold">Gerar com IA</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        A IA criará o texto e descrição baseado no contexto. (Custo: ~0.5 cr)
                                    </div>
                                </Label>
                            </div>

                            <div className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                                <RadioGroupItem value="manual" id="method-manual" className="mt-1" />
                                <Label htmlFor="method-manual" className="cursor-pointer font-normal flex-1">
                                    <div className="font-bold">Escrever Manualmente</div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        Você define todo o conteúdo da cena.
                                    </div>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="new-duration">Duração (segundos)</Label>
                        <Input
                            id="new-duration"
                            type="number"
                            min={1}
                            max={30}
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                        />
                    </div>

                    {method === "ai" ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label htmlFor="ai-instructions">Instruções para IA</Label>
                            <Textarea
                                id="ai-instructions"
                                placeholder="Ex: Cena de transição mostrando passagem de tempo..."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="new-narration">🎤 Narração</Label>
                                <Textarea
                                    id="new-narration"
                                    rows={3}
                                    value={narration}
                                    onChange={(e) => setNarration(e.target.value)}
                                    placeholder="Texto que será narrado..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-visualDesc">👁️ Descrição Visual</Label>
                                <Textarea
                                    id="new-visualDesc"
                                    rows={3}
                                    value={visualDesc}
                                    onChange={(e) => setVisualDesc(e.target.value)}
                                    placeholder="O que deve aparecer na imagem..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAdding}>
                        Cancelar
                    </Button>
                    <Button onClick={handleAdd} disabled={isAdding}>
                        {isAdding ? "Adicionando..." : "Adicionar Cena"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
