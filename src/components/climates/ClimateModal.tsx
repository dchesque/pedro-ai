'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    EmotionalState,
    RevelationDynamic,
    NarrativePressure,
    HookType,
    ClosingType
} from '../../prisma/generated/client_final'
import {
    EMOTIONAL_STATE_PROMPTS,
    REVELATION_DYNAMIC_PROMPTS,
    NARRATIVE_PRESSURE_PROMPTS
} from '@/lib/climate/behavior-mapping'
import { VALID_COMBINATIONS, getCorrectedConfig } from '@/lib/climate/guard-rails'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useCreateClimate, useUpdateClimate, Climate } from '@/hooks/use-climates'
import { ChevronLeft, ChevronRight, Loader2, Wand2 } from 'lucide-react'

interface ClimateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    climate?: Climate | null // If null, create mode
}

export function ClimateModal({ open, onOpenChange, climate }: ClimateModalProps) {
    const [step, setStep] = React.useState(1)
    const [formData, setFormData] = React.useState<Partial<Climate>>({
        name: '',
        description: '',
        icon: '🎭',
        emotionalState: EmotionalState.CURIOSITY,
        revelationDynamic: RevelationDynamic.PROGRESSIVE,
        narrativePressure: NarrativePressure.FLUID,
        hookType: HookType.QUESTION,
        closingType: ClosingType.CTA_DIRECT,
        promptFragment: '',
    })

    const createMutation = useCreateClimate()
    const updateMutation = useUpdateClimate()

    React.useEffect(() => {
        if (climate) {
            setFormData(climate)
            setStep(1)
        } else {
            setFormData({
                name: '',
                description: '',
                icon: '🎭',
                emotionalState: EmotionalState.CURIOSITY,
                revelationDynamic: RevelationDynamic.PROGRESSIVE,
                narrativePressure: NarrativePressure.FLUID,
                hookType: HookType.QUESTION,
                closingType: ClosingType.CTA_DIRECT,
                promptFragment: '',
            })
            setStep(1)
        }
    }, [climate, open])

    const handleNext = () => setStep(s => Math.min(s + 1, 3))
    const handlePrev = () => setStep(s => Math.max(s - 1, 1))

    const handleSubmit = async () => {
        if (climate?.id) {
            await updateMutation.mutateAsync({ id: climate.id, ...formData })
        } else {
            await createMutation.mutateAsync(formData)
        }
        onOpenChange(false)
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    // Sync guard rails when emotional state changes
    const updateEmotionalState = (state: EmotionalState) => {
        const corrected = getCorrectedConfig({ ...formData, emotionalState: state })
        setFormData(prev => ({
            ...prev,
            emotionalState: state,
            revelationDynamic: corrected.revelationDynamic,
            narrativePressure: corrected.narrativePressure,
            hookType: corrected.hookType,
            closingType: corrected.closingType
        }))
    }

    const rules = VALID_COMBINATIONS[formData.emotionalState || EmotionalState.CURIOSITY]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl bg-zinc-950 border-white/10 text-white overflow-hidden">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px] opacity-50">PASSO {step} DE 3</Badge>
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500"
                                style={{ width: `${(step / 3) * 100}%` }}
                            />
                        </div>
                    </div>
                    <DialogTitle>{climate ? 'Editar Clima' : 'Novo Clima Narrativo'}</DialogTitle>
                    <DialogDescription>
                        {step === 1 && "Defina a identidade e o estado emocional base do clima."}
                        {step === 2 && "Configure como as informações serão reveladas e o ritmo da narrativa."}
                        {step === 3 && "Ajustes finais de ganchos e instruções personalizadas."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 min-h-[350px]">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-1 space-y-2">
                                    <Label>Ícone</Label>
                                    <Input
                                        value={formData.icon || ''}
                                        onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
                                        placeholder="🎭"
                                        className="text-center text-xl h-12 bg-white/5 border-white/10"
                                    />
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <Label>Nome do Clima</Label>
                                    <Input
                                        value={formData.name || ''}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Ex: Tensão Crescente"
                                        className="h-12 bg-white/5 border-white/10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Estado Emocional Base</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {Object.entries(EMOTIONAL_STATE_PROMPTS).map(([key, value]) => (
                                        <button
                                            key={key}
                                            onClick={() => updateEmotionalState(key as EmotionalState)}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                                                formData.emotionalState === key
                                                    ? "bg-primary/10 border-primary text-white"
                                                    : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                                            )}
                                        >
                                            <span className="text-2xl">{value.icon}</span>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{value.label}</span>
                                                <span className="text-xs opacity-70">{value.subtitle}</span>
                                            </div>
                                            {formData.emotionalState === key && <Wand2 className="ml-auto h-4 w-4 animate-pulse" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <Label className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Dinâmica de Revelação</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(REVELATION_DYNAMIC_PROMPTS).map(([key, value]) => {
                                        const isAllowed = rules.allowedRevelations.includes(key as RevelationDynamic)
                                        return (
                                            <button
                                                key={key}
                                                disabled={!isAllowed}
                                                onClick={() => setFormData(p => ({ ...p, revelationDynamic: key as RevelationDynamic }))}
                                                className={cn(
                                                    "flex flex-col gap-2 p-4 rounded-xl border transition-all text-left relative",
                                                    formData.revelationDynamic === key
                                                        ? "bg-primary/10 border-primary text-white"
                                                        : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10",
                                                    !isAllowed && "opacity-30 grayscale cursor-not-allowed"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{value.icon}</span>
                                                    <span className="font-medium text-sm">{value.label}</span>
                                                </div>
                                                <span className="text-[10px] opacity-70 leading-relaxed">{value.subtitle}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Pressão Narrativa (Ritmo)</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(NARRATIVE_PRESSURE_PROMPTS).map(([key, value]) => {
                                        const isAllowed = rules.allowedPressures.includes(key as NarrativePressure)
                                        return (
                                            <button
                                                key={key}
                                                disabled={!isAllowed}
                                                onClick={() => setFormData(p => ({ ...p, narrativePressure: key as NarrativePressure }))}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center",
                                                    formData.narrativePressure === key
                                                        ? "bg-primary/10 border-primary text-white"
                                                        : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10",
                                                    !isAllowed && "opacity-30 grayscale cursor-not-allowed"
                                                )}
                                            >
                                                <span className="text-2xl">{value.icon}</span>
                                                <span className="text-xs font-medium">{value.label}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-2">
                                <Label>Descrição Interna</Label>
                                <Input
                                    value={formData.description || ''}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Explique brevemente quando usar este clima..."
                                    className="bg-white/5 border-white/10"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center justify-between">
                                    <span>Instruções Customizadas (Opcional)</span>
                                    <Badge variant="outline" className="text-[9px] opacity-40">ADVANCED</Badge>
                                </Label>
                                <Textarea
                                    value={formData.promptFragment || ''}
                                    onChange={e => setFormData(p => ({ ...p, promptFragment: e.target.value }))}
                                    placeholder="Adicione orientações específicas para o agente de IA escrever as cenas..."
                                    className="min-h-[150px] bg-white/5 border-white/10 text-xs italic resize-none"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Estas instruções serão combinadas com o comportamento base selecionado nos passos anteriores.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                                <h4 className="text-xs font-semibold text-primary/80 uppercase tracking-widest flex items-center gap-2">
                                    <Wand2 className="h-3 w-3" /> Preview do Comportamento
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="bg-white/5 text-[9px]">{formData.hookType}</Badge>
                                    <Badge variant="secondary" className="bg-white/5 text-[9px]">{formData.closingType}</Badge>
                                    <Badge variant="secondary" className="bg-white/5 text-[9px]">MAX 15 PALAVRAS/FRASE</Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-white/5 pt-4 gap-2">
                    <div className="flex-1 flex gap-2">
                        {step > 1 && (
                            <Button variant="ghost" onClick={handlePrev} className="text-white/60">
                                <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                            </Button>
                        )}
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/40">Cancelar</Button>
                    </div>

                    {step < 3 ? (
                        <Button onClick={handleNext} className="bg-white text-black hover:bg-white/90">
                            Próximo <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading || !formData.name}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                            {climate ? 'Salvar Alterações' : 'Criar Clima'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
