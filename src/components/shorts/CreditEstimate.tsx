"use client"

import { Card } from "@/components/ui/card"
import { Coins } from "lucide-react"

interface CreditEstimateProps {
    sceneCount: number
}

export function CreditEstimate({ sceneCount }: CreditEstimateProps) {
    const scriptCost = 2
    const imagesCost = sceneCount * 2
    const totalCost = scriptCost + imagesCost

    return (
        <Card className="p-4 bg-muted/30 border-dashed">
            <div className="flex items-center gap-2 mb-3">
                <Coins className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold italic">Estimativa de Créditos</h4>
            </div>

            <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                    <span>📝 Etapa 1 - Roteiro</span>
                    <span className="font-mono text-xs">{scriptCost} cr</span>
                </div>

                <div className="flex justify-between items-center text-muted-foreground">
                    <span>🖼️ Etapa 2 - Imagens ({sceneCount} cenas)</span>
                    <span className="font-mono text-xs">{imagesCost} cr</span>
                </div>

                <div className="pt-2 mt-2 border-t border-muted flex justify-between items-center font-bold">
                    <span>Total estimado</span>
                    <span className="text-primary font-mono">{totalCost} cr</span>
                </div>
            </div>
        </Card>
    )
}
