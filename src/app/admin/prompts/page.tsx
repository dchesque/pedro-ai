'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Search, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { ModelSelector } from '@/components/admin/model-selector';
import { useAdminModels, useSaveAdminModels } from '@/hooks/use-admin-models';
import { ModuleFilter } from '@/components/admin/prompts/ModuleFilter';
import { PromptCard } from '@/components/admin/prompts/PromptCard';
import { cn } from '@/lib/utils';

interface SystemPrompt {
    id: string;
    key: string;
    description: string;
    template: string;
    module: string;
    isActive: boolean;
}

export default function SystemPromptsPage() {
    const queryClient = useQueryClient();
    const [selectedModule, setSelectedModule] = useState('todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);

    // Gestão de Modelos
    const { data: modelsData } = useAdminModels();
    const saveModelsMutation = useSaveAdminModels();
    const [selectedModel, setSelectedModel] = useState<{ provider: string, modelId: string }>({
        provider: 'openrouter',
        modelId: 'deepseek/deepseek-v3.2'
    });

    useEffect(() => {
        if (modelsData?.models?.system_prompts) {
            const config = modelsData.models.system_prompts;
            if (typeof config === 'object') {
                setSelectedModel(config);
            } else {
                setSelectedModel({
                    provider: 'openrouter',
                    modelId: config
                });
            }
        }
    }, [modelsData]);

    const handleModelChange = async (provider: string, modelId: string) => {
        if (!modelsData) return;

        const newModel = { provider, modelId };
        setSelectedModel(newModel);

        const updatedModels = {
            ...modelsData.models,
            system_prompts: newModel
        };

        const normalized: any = {};
        Object.entries(updatedModels).forEach(([key, val]) => {
            normalized[key] = val;
        });

        await saveModelsMutation.mutateAsync(normalized);
    };

    // Buscar módulos
    const { data: modulesData } = useQuery({
        queryKey: ['prompt-modules'],
        queryFn: () => fetch('/api/admin/prompts/modules').then(r => r.json())
    });

    // Buscar prompts
    const { data: promptsData, isLoading } = useQuery({
        queryKey: ['prompts', selectedModule, searchTerm],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectedModule !== 'todos') params.set('module', selectedModule);
            if (searchTerm) params.set('search', searchTerm);
            const res = await fetch(`/api/admin/prompts?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch prompts');
            return res.json();
        }
    });

    const modules = modulesData?.modules || [];
    const grouped = promptsData?.grouped || {};

    const handleSave = async () => {
        if (!editingPrompt) return;

        setSavingId(editingPrompt.id);
        try {
            const response = await fetch('/api/admin/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editingPrompt.id, template: editingPrompt.template })
            });

            if (response.ok) {
                toast.success('Prompt atualizado com sucesso!');
                setEditingPrompt(null);
                queryClient.invalidateQueries({ queryKey: ['prompts'] });
            } else {
                throw new Error('Falha ao salvar');
            }
        } catch (error) {
            toast.error('Erro ao salvar prompt');
        } finally {
            setSavingId(null);
        }
    };

    const MODULE_LABELS: Record<string, string> = {
        roteirista: 'Roteirista',
        climas: 'Climas',
        estilos: 'Estilos',
        personagens: 'Personagens',
        imagens: 'Imagens',
        geral: 'Geral',
    };

    return (
        <div className="container py-8 space-y-8 max-w-[1600px]">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Prompts do Sistema</h1>
                <p className="text-muted-foreground">Gerencie templates de IA organizados por módulo e funcionalidade.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Filtros */}
                    <div className="space-y-4">
                        <ModuleFilter
                            modules={modules}
                            selected={selectedModule}
                            onSelect={setSelectedModule}
                        />

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome, descrição ou key..."
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Lista de Prompts */}
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(grouped).map(([module, prompts]: [string, any]) => (
                                <section key={module} className="space-y-4">
                                    {(selectedModule === 'todos') && (
                                        <div className="flex items-center gap-2 border-b pb-2">
                                            <h2 className="text-lg font-semibold text-primary capitalize">
                                                {MODULE_LABELS[module] || module}
                                            </h2>
                                            <Badge variant="secondary" className="text-[10px] h-5">
                                                {prompts.length}
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {prompts.map((prompt: SystemPrompt) => (
                                            <PromptCard
                                                key={prompt.id}
                                                prompt={prompt}
                                                onEdit={() => setEditingPrompt(prompt)}
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))}

                            {Object.keys(grouped).length === 0 && (
                                <div className="text-center py-20 bg-muted/10 rounded-lg border-2 border-dashed">
                                    <p className="text-muted-foreground">Nenhum prompt encontrado para os filtros atuais.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Configuration */}
                <div className="space-y-6">
                    <Card className="bg-muted/30 border-dashed sticky top-6">
                        <CardHeader className="py-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Modelo Padrão
                            </CardTitle>
                            <CardDescription>
                                Modelo usado nas assistências.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <ModelSelector
                                selectedProvider={selectedModel.provider}
                                selectedModel={selectedModel.modelId}
                                onProviderChange={(p) => handleModelChange(p, '')}
                                onModelChange={(m) => handleModelChange(selectedModel.provider, m)}
                                showPricing={true}
                                label="Configuração Global"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modal de Edição */}
            <Dialog open={!!editingPrompt} onOpenChange={(open) => !open && setEditingPrompt(null)}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
                    <DialogHeader className="px-6 py-4 border-b">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-primary bg-primary/5 capitalize">
                                {editingPrompt?.module}
                            </Badge>
                            <span className="text-xs font-mono text-muted-foreground">{editingPrompt?.key}</span>
                        </div>
                        <DialogTitle>{editingPrompt?.description || 'Editar Prompt'}</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 flex flex-col md:flex-row">
                        {/* Editor */}
                        <div className="flex-1 flex flex-col p-4 min-h-0">
                            <Textarea
                                className="flex-1 font-mono text-xs bg-muted/30 focus-visible:ring-1 resize-none p-4 leading-relaxed"
                                value={editingPrompt?.template || ''}
                                onChange={(e) => {
                                    if (editingPrompt) {
                                        setEditingPrompt({ ...editingPrompt, template: e.target.value });
                                    }
                                }}
                                spellCheck={false}
                            />
                        </div>

                        {/* Sidebar Variáveis */}
                        <div className="w-full md:w-64 border-l bg-muted/10 p-4 overflow-y-auto">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3">Variáveis</h4>
                            <div className="space-y-2">
                                <p className="text-[10px] text-muted-foreground mb-2">
                                    Use as variáveis abaixo com <code>{`{{variavel}}`}</code> no texto.
                                </p>
                                {/* Fallback variables detection based on key context logic or standard set */}
                                {[
                                    { k: 'theme', d: 'Tema do conteúdo' },
                                    { k: 'tone', d: 'Clima / Tom de voz' },
                                    { k: 'style', d: 'Estilo visual' },
                                    { k: 'context', d: 'Contexto geral' }
                                ].map(v => (
                                    <div key={v.k} className="p-2 bg-background rounded border text-xs">
                                        <code className="text-primary font-bold block mb-0.5">{`{{${v.k}}}`}</code>
                                        <span className="text-muted-foreground text-[10px]">{v.d}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/10">
                        <Button variant="outline" onClick={() => setEditingPrompt(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={!!savingId}>
                            {savingId === editingPrompt?.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

