'use client'

import { useAIModels } from '@/hooks/use-ai-models'
import { cn } from '@/lib/utils'

interface CreditEstimateProps {
    modelId: string
    estimatedScenes: number
    creditsPerImage?: number  // default: 2
    userBalance?: number
    className?: string
}

export function CreditEstimate({
    modelId,
    estimatedScenes,
    creditsPerImage = 2,
    userBalance,
    className
}: CreditEstimateProps) {
    const { data: models } = useAIModels()
    const model = models?.find((m) => m.id === modelId)

    const scriptCredits = model?.isFree ? 0 : (model?.creditsPerUse ?? 2)
    const imageCredits = estimatedScenes * creditsPerImage
    const totalCredits = scriptCredits + imageCredits

    const isInsufficient = userBalance !== undefined && userBalance < totalCredits

    return (
        <div className={cn("space-y-4 p-4 bg-muted/30 border-2 border-dashed rounded-xl", className)}>
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm tracking-tight flex items-center gap-2 uppercase">
                    <span>💰</span> Estimativa de Créditos
                </h4>
                {userBalance !== undefined && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-background rounded-full border text-[10px] font-bold">
                        <span className="text-muted-foreground uppercase">Saldo:</span>
                        <span className={cn(userBalance < totalCredits ? "text-red-500" : "text-primary")}>
                            {userBalance} cr
                        </span>
                    </div>
                )}
            </div>

            <div className="space-y-2 text-xs">
                {/* Etapa 1 */}
                <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
                    <div className="flex flex-col">
                        <span className="font-semibold">📝 Etapa 1 - Roteiro</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                            {model?.name || 'Selecionar modelo'}
                        </span>
                    </div>
                    <span className={cn(
                        "font-bold",
                        model?.isFree ? 'text-green-600' : 'text-foreground'
                    )}>
                        {model?.isFree ? 'GRÁTIS' : `${scriptCredits} cr`}
                    </span>
                </div>

                {/* Etapa 2 */}
                <div className="flex justify-between items-center p-2 bg-background/50 rounded-lg">
                    <div className="flex flex-col">
                        <span className="font-semibold">🖼️ Etapa 2 - Imagens</span>
                        <span className="text-[10px] text-muted-foreground">
                            Estimativa: ~{estimatedScenes} cenas
                        </span>
                    </div>
                    <span className="font-bold">{imageCredits} cr</span>
                </div>

                {/* Separador */}
                <div className="border-t border-muted-foreground/10 my-1" />

                {/* Total */}
                <div className="flex justify-between items-center px-2 py-1">
                    <span className="font-bold text-sm uppercase">Total Estimado</span>
                    <div className="text-right">
                        <span className="font-black text-lg text-primary">{totalCredits}</span>
                        <span className="font-bold text-[10px] ml-1 uppercase opacity-70">créditos</span>
                    </div>
                </div>

                {/* Aviso se saldo insuficiente */}
                {isInsufficient && (
                    <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg mt-2 text-[10px] font-medium leading-relaxed italic animate-pulse">
                        ⚠️ Saldo insuficiente para estas configurações. Considere usar o modelo <strong>DeepSeek V3.2 (GRÁTIS)</strong> para economizar créditos.
                    </div>
                )}
            </div>
        </div>
    )
}
