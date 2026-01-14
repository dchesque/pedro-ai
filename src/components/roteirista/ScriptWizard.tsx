"use client"

import React from 'react'
import { ChevronRight, ChevronLeft, Save, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { ConceptStep } from './steps/ConceptStep'
import { CharactersStep } from './steps/CharactersStep'
import { ScenesStep } from './steps/ScenesStep'
import { ReviewStep } from './steps/ReviewStep'
import { PreviewPanel } from './PreviewPanel'
import { useStyles } from '@/hooks/use-styles'
import { useClimates } from '@/hooks/use-climates'

import { useSaveScript } from '@/hooks/use-script-ai'
import { useToast } from '@/hooks/use-toast'
import type { ScriptFormData, WizardStep } from '@/lib/roteirista/types'

const STEPS: { id: WizardStep; label: string; description: string }[] = [
    { id: 'concept', label: 'Conceito', description: 'Defina o tema e sinopse' },
    { id: 'characters', label: 'Personagens', description: 'Quem aparecerá no vídeo' },
    { id: 'scenes', label: 'Cenas', description: 'O roteiro detalhado' },
    { id: 'review', label: 'Revisão', description: 'Verificação final' },
]

interface ScriptWizardProps {
    initialData?: any // Tipo aproximado de Short
}

export function ScriptWizard({ initialData }: ScriptWizardProps) {
    const [currentStep, setCurrentStep] = React.useState<WizardStep>('concept')
    const [formData, setFormData] = React.useState<Partial<ScriptFormData>>(() => {
        if (initialData) {
            return {
                title: initialData.title || '',
                premise: initialData.premise || initialData.theme || '',
                theme: initialData.theme || '',
                synopsis: initialData.synopsis || '',
                climateId: initialData.climateId || '',
                climate: initialData.climate || 'épico',
                targetAudience: initialData.targetAudience || '',
                styleId: initialData.style || initialData.styleId || '',
                sceneCount: initialData.sceneCount || initialData.scenes?.length || 7,
                characterIds: initialData.characterIds || [],
                scenes: initialData.scenes?.map((s: any) => ({
                    id: s.id,
                    orderIndex: s.order,
                    narration: s.narration || '',
                    visualPrompt: s.visualDesc || s.visualPrompt || '', // Suportar ambos os campos
                    duration: s.duration || 5,
                })) || [],
            }
        }
        return {
            title: '',
            premise: '',
            theme: '',
            synopsis: '',
            climateId: '',
            format: 'SHORT',
            climate: 'épico',
            targetAudience: '',
            sceneCount: 7,
            characterIds: [],
            scenes: [],
        }
    })

    // Hooks para dados completos (necessário para o PreviewPanel)
    const { data: stylesData } = useStyles()
    const { data: climatesData } = useClimates()

    const selectedStyle = stylesData?.styles.find(s => s.id === formData.styleId)
    const selectedClimate = climatesData?.climates.find(c => c.id === formData.climateId)

    const saveMutation = useSaveScript()

    const currentIndex = STEPS.findIndex((s) => s.id === currentStep)
    const progress = ((currentIndex + 1) / STEPS.length) * 100

    const handleNext = () => {
        if (currentIndex < STEPS.length - 1) {
            setCurrentStep(STEPS[currentIndex + 1].id)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentStep(STEPS[currentIndex - 1].id)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleSave = () => {
        if (initialData) {
            // Se for edição, precisamos de um hook handleUpdateScript
            toast({ title: 'Salvando alterações...' })
            saveMutation.mutate(formData as ScriptFormData)
        } else {
            saveMutation.mutate(formData as ScriptFormData)
        }
    }

    const { toast } = useToast()
    const isLastStep = currentStep === 'review'
    const isFirstStep = currentStep === 'concept'

    // Validação básica para prosseguir
    const canGoNext = () => {
        if (currentStep === 'concept') return !!formData.title && !!formData.theme
        if (currentStep === 'scenes') return (formData.scenes?.length ?? 0) > 0
        return true
    }

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Criador de Roteiro</h1>
                                <p className="text-muted-foreground">
                                    {STEPS[currentIndex].label}: {STEPS[currentIndex].description}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-medium">Passo {currentIndex + 1} de {STEPS.length}</span>
                                <Progress value={progress} className="w-32 h-2 mt-2" />
                            </div>
                        </div>

                        {/* Step Indicators (Mobile) */}
                        <div className="flex lg:hidden gap-1">
                            {STEPS.map((step, idx) => (
                                <div
                                    key={step.id}
                                    className={cn(
                                        "h-1 flex-1 rounded-full",
                                        idx <= currentIndex ? "bg-primary" : "bg-muted"
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    <Card className="min-h-[600px] flex flex-col">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                {STEPS[currentIndex].label}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 py-8">
                            {currentStep === 'concept' && (
                                <ConceptStep data={formData} onChange={setFormData} />
                            )}
                            {currentStep === 'characters' && (
                                <CharactersStep data={formData} onChange={setFormData} />
                            )}
                            {currentStep === 'scenes' && (
                                <ScenesStep data={formData} onChange={setFormData} onNext={handleNext} />
                            )}
                            {currentStep === 'review' && (
                                <ReviewStep data={formData} />
                            )}
                        </CardContent>

                        <CardFooter className="border-t bg-muted/30 py-4 flex justify-between">
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                disabled={isFirstStep || saveMutation.isPending}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Voltar
                            </Button>

                            <div className="flex gap-3">
                                {isLastStep ? (
                                    <Button
                                        onClick={handleSave}
                                        disabled={saveMutation.isPending || !canGoNext()}
                                        className="gap-2 bg-primary hover:bg-primary/90 min-w-[140px]"
                                    >
                                        {saveMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        Salvar Roteiro
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleNext}
                                        disabled={!canGoNext()}
                                        className="gap-2 min-w-[140px]"
                                    >
                                        Continuar
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Sidebar Preview */}
                <div className="hidden lg:block space-y-6">
                    <div className="sticky top-8">
                        <PreviewPanel
                            data={formData}
                            style={selectedStyle}
                            climate={selectedClimate}
                        />
                        <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground flex items-start gap-3">
                            <Sparkles className="h-4 w-4 text-primary shrink-0" />
                            <p>
                                Dica: Use os botões de assistência de IA em cada campo para melhorar
                                seus textos ou gerar novas ideias instantaneamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
