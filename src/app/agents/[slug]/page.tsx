"use client"

import React, { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAgent, useExecuteAgent, useCreateFromAgent } from '@/hooks/use-agents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Check, Sparkles, Wand2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

export default function AgentDetail({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params)
    const router = useRouter()
    const { data: agent, isLoading } = useAgent(slug)
    const executeAgent = useExecuteAgent(slug)
    const createMutation = useCreateFromAgent(agent?.type === 'STYLE' ? 'STYLE' : 'CLIMATE')

    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Record<string, any>>({})
    const [isExecuting, setIsExecuting] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [adjustments, setAdjustments] = useState<string[]>([])

    // Modal de criação final
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [finalName, setFinalName] = useState('')
    const [finalIcon, setFinalIcon] = useState('')

    if (isLoading) return <div className="p-8 text-center">Carregando agent...</div>
    if (!agent) return <div className="p-8 text-center text-red-500">Agent não encontrado.</div>

    const questions = agent.questions || []
    const totalSteps = questions.length
    const progress = ((currentStep + 1) / totalSteps) * 100

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(s => s + 1)
        } else {
            handleExecute()
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(s => s - 1)
        }
    }

    const handleExecute = async () => {
        setIsExecuting(true)
        try {
            const res = await executeAgent.mutateAsync(answers)
            setResult(res.output)
            setAdjustments(res.adjustments || [])
            setFinalIcon(agent.icon)
        } finally {
            setIsExecuting(false)
        }
    }

    const handleFinish = async () => {
        if (!finalName) return

        await createMutation.mutateAsync({
            name: finalName,
            icon: finalIcon,
            agentOutput: result
        })

        // Redirecionar para a listagem correspondente
        const redirectPath = agent.type === 'STYLE' ? '/estilos' : '/roteirista' // Clima é usado no roteirista v2.0
        router.push(redirectPath)
    }

    const currentQuestion = questions[currentStep]

    if (result) {
        return (
            <div className="container mx-auto py-8 max-w-4xl">
                <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
                    <Wand2 className="h-6 w-6 text-primary" />
                    Resultado do Agent: {agent.name}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="md:col-span-2 bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Descrição do Setup</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{result.description}</p>
                            {adjustments.length > 0 && (
                                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                    <h4 className="text-xs font-bold text-yellow-500 uppercase flex items-center gap-1 mb-2">
                                        <Info className="h-3 w-3" />
                                        Ajustes Automáticos
                                    </h4>
                                    <ul className="text-xs space-y-1 text-yellow-600/80">
                                        {adjustments.map((adj, i) => (
                                            <li key={i}>• {adj}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {agent.outputFields?.map((field: any) => {
                        if (field.key === 'description') return null; // Já mostrado no topo

                        return (
                            <Card key={field.key}>
                                <CardHeader className="py-3">
                                    <CardTitle className="text-sm text-muted-foreground">{field.label}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="font-semibold text-lg">
                                        {result[field.key] || 'Não definido'}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                <div className="flex gap-4 mt-8">
                    <Button variant="outline" onClick={() => setResult(null)}>
                        Tentar novamente
                    </Button>
                    <Button className="flex-1" onClick={() => setIsCreateModalOpen(true)}>
                        Salvar como novo {agent.type === 'STYLE' ? 'Estilo' : 'Clima'}
                    </Button>
                </div>

                {/* Modal para Salvar */}
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Salvar Configuração</DialogTitle>
                            <DialogDescription>
                                Dê um nome e escolha um ícone para sua nova configuração.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome da Configuração</Label>
                                <Input
                                    placeholder="Ex: Futurista Fluido, Vendas Rápido..."
                                    value={finalName}
                                    onChange={(e) => setFinalName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ícone (Emoji)</Label>
                                <Input
                                    placeholder="🎭"
                                    value={finalIcon}
                                    onChange={(e) => setFinalIcon(e.target.value)}
                                    className="w-20 text-center text-2xl"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
                            <Button onClick={handleFinish} disabled={!finalName || createMutation.isPending}>
                                {createMutation.isPending ? 'Salvando...' : 'Confirmar e Salvar'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft />
                </Button>
                <div>
                    <h1 className="text-xl font-bold">{agent.name}</h1>
                    <p className="text-sm text-muted-foreground">Passo {currentStep + 1} de {totalSteps}</p>
                </div>
                <div className="ml-auto text-3xl">{agent.icon}</div>
            </div>

            <Progress value={progress} className="mb-8" />

            <Card className="min-h-[400px] flex flex-col glass-card border-primary/20 bg-card/40 backdrop-blur-md">
                <CardHeader>
                    <CardTitle className="text-2xl">{currentQuestion.label}</CardTitle>
                    {currentQuestion.helpText && (
                        <CardDescription className="text-base mt-2">{currentQuestion.helpText}</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="flex-1">
                    {currentQuestion.type === 'select' && (
                        <RadioGroup
                            value={answers[currentQuestion.id]}
                            onValueChange={(val) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
                            className="gap-4"
                        >
                            {currentQuestion.options?.map((opt: any) => (
                                <div key={opt.value} className="flex items-center space-x-2">
                                    <label
                                        htmlFor={opt.value}
                                        className={cn(
                                            "flex flex-1 items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all hover:bg-muted/50",
                                            answers[currentQuestion.id] === opt.value ? "border-primary bg-primary/5" : "border-transparent bg-muted/20"
                                        )}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold">{opt.label}</span>
                                            {opt.description && <span className="text-xs text-muted-foreground">{opt.description}</span>}
                                        </div>
                                        <RadioGroupItem value={opt.value} id={opt.value} />
                                    </label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}

                    {currentQuestion.type === 'text' && (
                        <Input
                            value={answers[currentQuestion.id] || ''}
                            onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                            placeholder="Digite sua resposta..."
                            className="mt-4"
                        />
                    )}

                    {currentQuestion.example && (
                        <div className="mt-8 p-4 bg-muted/30 rounded-lg text-sm italic text-muted-foreground flex gap-3">
                            <Info className="h-5 w-5 shrink-0 text-primary/50" />
                            <p><span className="font-bold not-italic">Exemplo:</span> {currentQuestion.example}</p>
                        </div>
                    )}
                </CardContent>
                <div className="p-6 flex justify-between gap-4 border-t">
                    <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                        Voltar
                    </Button>
                    <Button
                        className="flex-1 gap-2"
                        onClick={handleNext}
                        disabled={currentQuestion.required && !answers[currentQuestion.id] || isExecuting}
                    >
                        {isExecuting ? 'Processando...' : currentStep === totalSteps - 1 ? 'Gerar Configuração' : 'Próximo'}
                        {currentStep < totalSteps - 1 && <ChevronRight className="h-4 w-4" />}
                        {currentStep === totalSteps - 1 && <Sparkles className="h-4 w-4" />}
                    </Button>
                </div>
            </Card>
        </div>
    )
}
