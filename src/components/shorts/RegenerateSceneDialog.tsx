"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AlertTriangle, RefreshCcw } from "lucide-react"

interface RegenerateSceneDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onRegenerate: (instructions?: string) => Promise<void>
    isGenerating?: boolean
}

export function RegenerateSceneDialog({
    open,
    onOpenChange,
    onRegenerate,
    isGenerating
}: RegenerateSceneDialogProps) {
    const [instructions, setInstructions] = useState("")

    const handleRegenerate = async () => {
        await onRegenerate(instructions)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCcw className="w-5 h-5 text-primary" />
                        Regenerar Cena com IA
                    </DialogTitle>
                    <DialogDescription>
                        A narração e descrição visual atuais serão substituídas.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="instructions">Instruções (opcional)</Label>
                        <Textarea
                            id="instructions"
                            placeholder="Ex: Torne mais mágico e misterioso, adicione mais suspense..."
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Deixe vazio para regenerar sem instruções específicas.
                        </p>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-3 rounded-md flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                            <p className="font-bold mb-1">Custo: ~0.5 créditos</p>
                            <p>Esta ação usará IA para reescrever o texto da cena baseada no contexto do roteiro.</p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                        Cancelar
                    </Button>
                    <Button onClick={handleRegenerate} disabled={isGenerating}>
                        {isGenerating ? "Regenerando..." : "🔄 Regenerar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
