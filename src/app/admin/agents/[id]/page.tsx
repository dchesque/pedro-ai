"use client"

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAgentV2, useUpdateAdminAgentV2 } from '@/hooks/use-admin-agents-v2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ChevronLeft, Save, Sparkles, Loader2 } from 'lucide-react'
import { ModelSelector } from '@/components/admin/model-selector'

export default function AdminAgentEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { data: agent, isLoading } = useAdminAgentV2(id)
    const updateMutation = useUpdateAdminAgentV2()

    const [formData, setFormData] = useState<any>({
        name: '',
        description: '',
        icon: '',
        systemMessage: '',
        model: '',
        provider: 'openrouter',
        modelId: '',
        creditsPerUse: 0,
        isActive: true,
    })

    useEffect(() => {
        if (agent) {
            let provider = 'openrouter'
            let modelId = agent.model

            if (agent.model && agent.model.includes(':')) {
                const parts = agent.model.split(':')
                provider = parts[0]
                modelId = parts.slice(1).join(':')
            } else if (agent.model && agent.model.startsWith('fal-ai/')) {
                provider = 'fal'
            }

            setFormData({
                name: agent.name,
                description: agent.description,
                icon: agent.icon,
                systemMessage: agent.systemMessage,
                model: agent.model,
                provider,
                modelId,
                creditsPerUse: agent.creditsPerUse,
                isActive: agent.isActive,
            })
        }
    }, [agent])

    const handleSave = async () => {
        const finalModel = formData.provider && formData.modelId
            ? `${formData.provider}:${formData.modelId}`
            : formData.modelId || formData.model

        const payload = {
            ...formData,
            model: finalModel
        }

        // Limpar campos auxiliares
        delete payload.provider
        delete payload.modelId

        await updateMutation.mutateAsync({ id, ...payload })
    }

    if (isLoading) return <div className="p-8 text-center">Carregando dados...</div>
    if (!agent) return <div className="p-8 text-center text-red-500">Agent não encontrado.</div>

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Editar Agent</h1>
                    <p className="text-muted-foreground">{agent.name} ({agent.type})</p>
                </div>
                <Button className="ml-auto gap-2" onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações Básicas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome do Agent</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Ícone (Emoji)</Label>
                                    <Input
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        className="text-2xl text-center w-20"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Descrição (público)</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                System Message (Prompt)
                            </CardTitle>
                            <CardDescription>
                                As instruções principais que guiam o comportamento da IA. Use variáveis e regras claras de validação JSON.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formData.systemMessage}
                                onChange={(e) => setFormData({ ...formData, systemMessage: e.target.value })}
                                rows={20}
                                className="font-mono text-sm bg-muted/30"
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>IA & IA Model</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ModelSelector
                                selectedProvider={formData.provider}
                                selectedModel={formData.modelId}
                                onProviderChange={(p) => setFormData(prev => ({ ...prev, provider: p, modelId: '' }))}
                                onModelChange={(m) => setFormData(prev => ({ ...prev, modelId: m }))}
                                capability="text"
                                showPricing={true}
                                label="Configuração de IA"
                            />

                            <div className="space-y-2 pt-2">
                                <Label>Créditos por Uso</Label>
                                <Input
                                    type="number"
                                    value={formData.creditsPerUse}
                                    onChange={(e) => setFormData({ ...formData, creditsPerUse: Number(e.target.value) })}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Custo para o usuário final em créditos.
                                </p>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t">
                                <Label>Agent Ativo</Label>
                                <Switch
                                    checked={formData.isActive}
                                    onCheckedChange={(val) => setFormData({ ...formData, isActive: val })}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Dados Estruturados</CardTitle>
                            <CardDescription>
                                Estes campos (Perguntas e Output) devem ser alterados via Seed/Database por agora devido à complexidade do JSON.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-3 bg-muted rounded-lg text-xs font-mono">
                                {JSON.stringify(agent.questions, null, 2).substring(0, 100)}...
                            </div>
                            <Button variant="ghost" className="w-full text-xs" disabled>
                                Editar via JSON Editor (Em breve)
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
