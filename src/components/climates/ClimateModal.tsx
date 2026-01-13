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
    NarrativePressure
} from '../../../prisma/generated/client_final'
import {
    EMOTIONAL_STATE_PROMPTS,
    REVELATION_DYNAMIC_PROMPTS,
    NARRATIVE_PRESSURE_PROMPTS
} from '@/lib/climate/behavior-mapping'
import { VALID_COMBINATIONS, getCorrectedConfig } from '@/lib/climate/guard-rails'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useCreateClimate, useUpdateClimate, Climate } from '@/hooks/use-climates'
import { ChevronLeft, ChevronRight, Loader2, Wand2, Sparkles } from 'lucide-react'
import { useImproveClimateText } from '@/hooks/use-improve-climate-text'
import { ImproveTextButton } from '@/components/climates/improve-text-button'
import { useToast } from '@/hooks/use-toast'

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ClimateModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    climate?: Climate | null // If null, create mode
}

export function ClimateModal({ open, onOpenChange, climate }: ClimateModalProps) {
    const { toast } = useToast()
    const [step, setStep] = React.useState(1)
    const [formData, setFormData] = React.useState<Partial<Climate>>({
        name: '',
        description: '',
        icon: '🎭',
        emotionalState: EmotionalState.CURIOSITY,
        revelationDynamic: RevelationDynamic.PROGRESSIVE,
        narrativePressure: NarrativePressure.FLUID,
        promptFragment: '',
        behaviorPreview: '',
    })

    const createMutation = useCreateClimate()
    const updateMutation = useUpdateClimate()
    const improveTextMutation = useImproveClimateText()
    const [improvingField, setImprovingField] = React.useState<string | null>(null)

    const [error, setError] = React.useState<string | null>(null)
    const [pendingPressure, setPendingPressure] = React.useState<NarrativePressure | null>(null)

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
                promptFragment: '',
                behaviorPreview: '',
            })
            setStep(1)
        }
        setError(null)
        setPendingPressure(null)
    }, [climate, open])

    // Clear error when form data changes
    React.useEffect(() => {
        if (error) setError(null)
    }, [formData, step])

    const handleNext = () => {
        if (step === 1 && !formData.name?.trim()) {
            setError('O nome do clima é obrigatório para continuar.')
            return
        }
        setStep(s => Math.min(s + 1, 3))
    }
    const handlePrev = () => {
        setError(null)
        setStep(s => Math.max(s - 1, 1))
    }

    const handleSubmit = async () => {
        // Validação final antes de salvar
        if (!formData.name?.trim()) {
            setError('O nome do clima é obrigatório.')
            return
        }
        if (!formData.description?.trim()) {
            setError('A descrição interna é obrigatória.')
            return
        }
        if (!formData.promptFragment?.trim()) {
            setError('As instruções customizadas são obrigatórias.')
            return
        }
        if (!formData.behaviorPreview?.trim()) {
            setError('O preview do comportamento é obrigatório.')
            return
        }

        if (climate?.id) {
            await updateMutation.mutateAsync({ id: climate.id, ...formData })
        } else {
            await createMutation.mutateAsync(formData)
        }
        onOpenChange(false)
    }

    const handleImproveText = async (field: 'description' | 'instructions' | 'preview') => {
        setImprovingField(field)
        setError(null)

        try {
            const climateContext = {
                name: formData.name || '',
                emotionalState: formData.emotionalState!,
                revelationDynamic: formData.revelationDynamic!,
                narrativePressure: formData.narrativePressure!,
                description: formData.description || undefined,
                instructions: formData.promptFragment || undefined,
            }

            const currentText = field === 'instructions'
                ? (formData.promptFragment || '')
                : field === 'preview' ? '' : (formData[field] || '')

            const result = await improveTextMutation.mutateAsync({
                field,
                currentText,
                climateContext,
            })

            if (field === 'preview') {
                setFormData(prev => ({ ...prev, behaviorPreview: result.improvedText }))
                toast({ title: 'Preview gerado com sucesso!' })
            } else if (field === 'instructions') {
                setFormData(prev => ({ ...prev, promptFragment: result.improvedText }))
                toast({ title: 'Texto melhorado com sucesso!' })
            } else {
                setFormData(prev => ({ ...prev, [field]: result.improvedText }))
                toast({ title: 'Texto melhorado com sucesso!' })
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: error instanceof Error ? error.message : 'Erro ao processar'
            })
        } finally {
            setImprovingField(null)
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    // Sync guard rails when emotional state changes
    const updateEmotionalState = (state: EmotionalState) => {
        const corrected = getCorrectedConfig({ ...formData, emotionalState: state })
        setFormData(prev => ({
            ...prev,
            emotionalState: state,
            revelationDynamic: corrected.revelationDynamic,
            narrativePressure: corrected.narrativePressure
        }))
    }

    const rules = VALID_COMBINATIONS[formData.emotionalState || EmotionalState.CURIOSITY]

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-xl bg-background border-border text-foreground overflow-hidden">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px] opacity-50 uppercase">Passo {step} de 3</Badge>
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
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
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Nome do Clima <span className="text-destructive ml-1">*</span></Label>
                                        <Input
                                            value={formData.name || ''}
                                            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Ex: Tensão Crescente"
                                            className="h-12 bg-muted/30 border-border"
                                        />
                                    </div>
                                </div>


                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Estado Emocional Base</Label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Este estado define como o espectador se sente nos primeiros segundos.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {Object.entries(EMOTIONAL_STATE_PROMPTS).map(([key, value]) => (
                                            <button
                                                key={key}
                                                onClick={() => updateEmotionalState(key as EmotionalState)}
                                                className={cn(
                                                    "flex items-center gap-4 p-4 rounded-xl border transition-all text-left group",
                                                    formData.emotionalState === key
                                                        ? "bg-primary/10 border-primary text-foreground"
                                                        : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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
                                    <div>
                                        <Label className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Dinâmica de Revelação</Label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Como a informação é entregue ao espectador ao longo do vídeo.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <TooltipProvider>
                                            {Object.entries(REVELATION_DYNAMIC_PROMPTS).map(([key, value]) => {
                                                const isAllowed = rules.allowedRevelations.includes(key as RevelationDynamic)
                                                const currentEmotionalState = EMOTIONAL_STATE_PROMPTS[formData.emotionalState as EmotionalState]?.label || 'o estado atual'

                                                return (
                                                    <Tooltip key={key} delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <div className="w-full"> {/* Wrapper needed for disabled button tooltip */}
                                                                <button
                                                                    disabled={!isAllowed}
                                                                    onClick={() => setFormData(p => ({ ...p, revelationDynamic: key as RevelationDynamic }))}
                                                                    className={cn(
                                                                        "w-full flex flex-col gap-2 p-4 rounded-xl border transition-all text-left relative group",
                                                                        formData.revelationDynamic === key
                                                                            ? "bg-primary/10 border-primary text-foreground"
                                                                            : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                                                        !isAllowed && "opacity-50 grayscale cursor-not-allowed bg-muted/10"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xl">{value.icon}</span>
                                                                            <span className="font-medium text-sm">{value.label}</span>
                                                                        </div>
                                                                        {!isAllowed && <span className="text-lg">🔒</span>}
                                                                    </div>
                                                                    <span className="text-[10px] opacity-70 leading-relaxed max-w-[90%]">{value.subtitle}</span>
                                                                </button>
                                                            </div>
                                                        </TooltipTrigger>
                                                        {!isAllowed && (
                                                            <TooltipContent className="bg-destructive text-destructive-foreground border-destructive max-w-[250px]">
                                                                <p className="text-xs font-medium">Este tipo de revelação não funciona bem com {currentEmotionalState}.</p>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                )
                                            })}
                                        </TooltipProvider>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Pressão Narrativa (Ritmo)</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <TooltipProvider>
                                            {Object.entries(NARRATIVE_PRESSURE_PROMPTS).map(([key, value]) => {
                                                const isAllowed = rules.allowedPressures.includes(key as NarrativePressure)
                                                const currentEmotionalState = EMOTIONAL_STATE_PROMPTS[formData.emotionalState as EmotionalState]?.label || 'o estado atual'

                                                const handleClick = () => {
                                                    if (isAllowed) {
                                                        setFormData(p => ({ ...p, narrativePressure: key as NarrativePressure }))
                                                    } else {
                                                        setPendingPressure(key as NarrativePressure)
                                                    }
                                                }

                                                const isSelected = formData.narrativePressure === key

                                                return (
                                                    <Tooltip key={key} delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={handleClick}
                                                                className={cn(
                                                                    "w-full flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center group relative",
                                                                    isSelected
                                                                        ? "bg-primary/10 border-primary text-foreground"
                                                                        : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                                                    // Only apply muted warning style if NOT selected
                                                                    !isAllowed && !isSelected && "bg-amber-500/5 border-amber-500/20 text-muted-foreground/60",
                                                                    // If selected AND restricted, show amber warning style
                                                                    !isAllowed && isSelected && "border-amber-500/50 bg-amber-500/10"
                                                                )}
                                                            >
                                                                {!isAllowed && (
                                                                    <span className="absolute top-2 right-2 text-amber-500 text-[10px]">⚠️</span>
                                                                )}
                                                                <span className="text-2xl">{value.icon}</span>
                                                                <span className="text-xs font-medium">{value.label}</span>
                                                            </button>
                                                        </TooltipTrigger>
                                                        {!isAllowed && (
                                                            <TooltipContent className="bg-amber-600 text-white border-amber-600 max-w-[200px]">
                                                                <p className="text-xs font-medium">⚠️ Opção avançada. Pode gerar inconsistências com {currentEmotionalState}.</p>
                                                            </TooltipContent>
                                                        )}
                                                    </Tooltip>
                                                )
                                            })}
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="description">Descrição Interna <span className="text-destructive ml-1">*</span></Label>
                                        <ImproveTextButton
                                            onClick={() => handleImproveText('description')}
                                            isLoading={improvingField === 'description'}
                                            disabled={!formData.description?.trim()}
                                        />
                                    </div>
                                    <Textarea
                                        id="description"
                                        value={formData.description || ''}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Descreva quando usar este clima (1-2 frases)"
                                        className="bg-muted/30 border-border"
                                        rows={2}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Esta descrição ajuda você a lembrar quando usar este clima.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="instructions">Instruções Customizadas <span className="text-destructive ml-1">*</span></Label>
                                        <ImproveTextButton
                                            onClick={() => handleImproveText('instructions')}
                                            isLoading={improvingField === 'instructions'}
                                            disabled={!formData.promptFragment?.trim()}
                                        />
                                    </div>
                                    <p className="text-xs font-medium text-amber-600 bg-amber-500/10 p-2 rounded border border-amber-500/20 flex items-center gap-2 mb-2">
                                        ⚠️ Este campo ajusta, não substitui, o comportamento do clima.
                                    </p>
                                    <Textarea
                                        id="instructions"
                                        value={formData.promptFragment || ''}
                                        onChange={e => setFormData(p => ({ ...p, promptFragment: e.target.value }))}
                                        placeholder="Instruções específicas para o agente de IA..."
                                        className="min-h-[120px] bg-muted/30 border-border text-xs resize-none"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Instruções técnicas que serão enviadas ao agente de IA.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="behaviorPreview">Preview do Comportamento <span className="text-destructive ml-1">*</span></Label>
                                        <ImproveTextButton
                                            onClick={() => handleImproveText('preview')}
                                            isLoading={improvingField === 'preview'}
                                            variant="generate"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Input
                                            id="behaviorPreview"
                                            value={formData.behaviorPreview || ''}
                                            onChange={e => setFormData(p => ({ ...p, behaviorPreview: e.target.value }))}
                                            placeholder="SHOCK, CTA_DIRECT, MAX_15_WORDS"
                                            className="font-mono text-xs bg-muted/50"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Palavras-chave que resumem o comportamento esperado.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="px-6 pb-2">
                            <p className="text-xs font-medium text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-1">
                                ⚠️ {error}
                            </p>
                        </div>
                    )}

                    <DialogFooter className="border-t border-border pt-4 gap-2">
                        <div className="flex-1 flex gap-2">
                            {step > 1 && (
                                <Button variant="ghost" onClick={handlePrev} className="text-muted-foreground hover:text-foreground">
                                    <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                                </Button>
                            )}
                            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground/60">Cancelar</Button>
                        </div>

                        {step < 3 ? (
                            <Button
                                onClick={handleNext}
                                className="shadow-sm"
                            >
                                Próximo <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[120px]"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                                {climate ? 'Salvar Alterações' : 'Criar Clima'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!pendingPressure} onOpenChange={(open) => !open && setPendingPressure(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Atenção: Combinação Avançada</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta pressão pode não funcionar corretamente com {EMOTIONAL_STATE_PROMPTS[formData.emotionalState as EmotionalState]?.label || 'o estado atual'}.
                            <br /><br />
                            Ative apenas se for usuário avançado.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingPressure(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (pendingPressure) {
                                setFormData(p => ({ ...p, narrativePressure: pendingPressure }))
                                setPendingPressure(null)
                            }
                        }}>Ativar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
