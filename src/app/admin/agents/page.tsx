"use client"

import React from 'react'
import { Plus, Trash2, Save, Power, PowerOff } from 'lucide-react'
import {
    useGlobalAgents,
    useSaveGlobalAgent,
    useDeleteGlobalAgent,
    useGlobalStyles,
    useCreateGlobalStyle,
    useUpdateGlobalStyle,
    useDeleteGlobalStyle
} from '@/hooks/use-admin-agents'
import { Agent, Style } from '@/hooks/use-agents'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminAgentsPage() {
    return (
        <div className="container mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações de IA</h1>
                <p className="text-muted-foreground">
                    Gerencie os Agentes Globais (Prompts do Sistema) e Estilos Padrão.
                </p>
            </div>

            <Tabs defaultValue="agents" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="agents">Agentes Globais</TabsTrigger>
                    <TabsTrigger value="styles">Estilos Globais</TabsTrigger>
                </TabsList>

                <TabsContent value="agents">
                    <GlobalAgentsManager />
                </TabsContent>

                <TabsContent value="styles">
                    <GlobalStylesManager />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function GlobalAgentsManager() {
    const { data: agentsData, isLoading } = useGlobalAgents()
    const saveAgent = useSaveGlobalAgent()
    const deleteAgent = useDeleteGlobalAgent()

    const agents = agentsData?.agents ?? []

    const agentTypes = ['SCRIPTWRITER', 'PROMPT_ENGINEER', 'NARRATOR']

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                {isLoading ? (
                    [1, 2].map(i => <Skeleton key={i} className="h-[400px] w-full" />)
                ) : (
                    agentTypes.map(type => {
                        const agent = agents.find(a => a.type === type)
                        return (
                            <AgentCard
                                key={type}
                                type={type as any}
                                agent={agent}
                                onSave={(data) => saveAgent.mutate({ type, ...data })}
                                onDelete={() => deleteAgent.mutate(type)}
                                isSaving={saveAgent.isPending}
                            />
                        )
                    })
                )}
            </div>
        </div>
    )
}

function AgentCard({ type, agent, onSave, onDelete, isSaving }: any) {
    const [formData, setFormData] = React.useState({
        name: agent?.name || '',
        systemPrompt: agent?.systemPrompt || '',
        model: agent?.model || 'anthropic/claude-3.5-sonnet',
        temperature: agent?.temperature || 0.7,
        isActive: agent?.isActive ?? true
    })

    // Update form when agent changes
    React.useEffect(() => {
        if (agent) {
            setFormData({
                name: agent.name,
                systemPrompt: agent.systemPrompt,
                model: agent.model,
                temperature: agent.temperature,
                isActive: agent.isActive
            })
        }
    }, [agent])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        {type}
                        {!agent && <span className="text-xs font-normal text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">Não Configurado (Usando Default)</span>}
                    </CardTitle>
                    <CardDescription>
                        Configuração global para o agente {type.toLowerCase()}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                        <Label htmlFor={`${type}-active`}>{formData.isActive ? 'Ativo' : 'Inativo'}</Label>
                        <Switch
                            id={`${type}-active`}
                            checked={formData.isActive}
                            onCheckedChange={(v) => setFormData(prev => ({ ...prev, isActive: v }))}
                        />
                    </div>
                    {agent && (
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nome do Agente</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ex: Roteirista Premium"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Modelo (OpenRouter)</Label>
                        <Input
                            value={formData.model}
                            onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>System Prompt</Label>
                    <Textarea
                        className="min-h-[200px] font-mono text-xs"
                        value={formData.systemPrompt}
                        onChange={e => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                        placeholder="Instruções de sistema..."
                    />
                </div>

                <div className="flex items-center justify-between pt-4">
                    <div className="space-y-1">
                        <Label>Temperatura: {formData.temperature}</Label>
                        <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            className="w-48 block"
                            value={formData.temperature}
                            onChange={e => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                        />
                    </div>
                    <Button onClick={() => onSave(formData)} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? 'Salvando...' : 'Salvar Configuração'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function GlobalStylesManager() {
    const { data: stylesData, isLoading } = useGlobalStyles()
    const createStyle = useCreateGlobalStyle()
    const updateStyle = useUpdateGlobalStyle()
    const deleteStyle = useDeleteGlobalStyle()

    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const styles = stylesData?.styles ?? []

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Estilo Global
                </Button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-[200px] w-full" />
                    <Skeleton className="h-[200px] w-full" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {styles.map(style => (
                        <Card key={style.id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{style.icon}</span>
                                    <div>
                                        <CardTitle>{style.name}</CardTitle>
                                        <CardDescription>Key: {style.key}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => deleteStyle.mutate(style.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm line-clamp-2">{style.description}</p>
                                <div className="mt-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className={style.isActive ? "text-green-500" : "text-red-500"}>
                                            {style.isActive ? "● Ativo" : "○ Inativo"}
                                        </span>
                                        {style.isDefault && <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">Padrão</span>}
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => {/* Edit logic would go here, reusing fields */ }}>
                                        Editar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
