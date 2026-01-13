'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SYSTEM_PROMPTS_CONFIG } from '@/lib/system-prompts-config';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

interface SystemPrompt {
    id: string;
    key: string;
    description: string;
    template: string;
    module: string;
}

type EnrichedPrompt = SystemPrompt & {
    pageName: string;
    pageHref: string;
    blockName: string;
};

export default function SystemPromptsPage() {
    const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingPrompt, setEditingPrompt] = useState<(SystemPrompt & { pageName: string; blockName: string }) | null>(null);

    useEffect(() => {
        fetchPrompts();
    }, []);

    const fetchPrompts = async () => {
        try {
            const response = await fetch('/api/admin/prompts');
            if (response.ok) {
                const data = await response.json();
                setPrompts(data);
            }
        } catch (error) {
            toast.error('Erro ao carregar prompts');
        } finally {
            setLoading(false);
        }
    };

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
                // Atualiza lista local
                setPrompts(prev => prev.map(p => p.id === editingPrompt.id ? { ...p, template: editingPrompt.template } : p));
                toast.success('Prompt atualizado com sucesso!');
                setEditingPrompt(null);
            } else {
                throw new Error('Falha ao salvar');
            }
        } catch (error) {
            toast.error('Erro ao salvar prompt');
        } finally {
            setSavingId(null);
        }
    };

    // Unir dados do banco com o config de metadata
    const enrichedPrompts = prompts.map(p => {
        const config = SYSTEM_PROMPTS_CONFIG.find(c => c.key === p.key);
        return {
            ...p,
            pageName: config?.pageName || 'Outros',
            pageHref: config?.pageHref || '#',
            blockName: config?.blockName || 'Geral',
            description: config?.description || p.description
        };
    });

    const filteredPrompts = enrichedPrompts.filter(p =>
        p.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.pageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.blockName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Agrupar por página
    const groupedByPage = filteredPrompts.reduce((acc, p) => {
        if (!acc[p.pageName]) acc[p.pageName] = { href: p.pageHref, prompts: [] };
        acc[p.pageName].prompts.push(p);
        return acc;
    }, {} as Record<string, { href: string, prompts: EnrichedPrompt[] }>);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container py-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Prompts do Sistema</h1>
                <p className="text-muted-foreground">Gerencie templates de IA organizados por página e bloco de funcionalidade.</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, descrição, página ou bloco..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-12">
                {Object.entries(groupedByPage).map(([pageName, group]) => (
                    <div key={pageName} className="space-y-4">
                        <div className="flex items-end gap-3 border-b pb-2">
                            <h2 className="text-lg font-semibold text-primary">{pageName}</h2>
                            <span className="text-[10px] text-muted-foreground mb-1 font-mono uppercase tracking-wider">{group.href}</span>
                        </div>

                        <div className="grid gap-3">
                            {group.prompts.map((prompt) => (
                                <div
                                    key={prompt.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-card border hover:bg-muted/30 transition-colors group"
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{prompt.blockName}</span>
                                            <span className="text-[10px] font-mono text-muted-foreground/60">{prompt.key}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{prompt.description}</p>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingPrompt(prompt)}
                                        className="gap-2"
                                    >
                                        Ver Prompt
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {Object.keys(groupedByPage).length === 0 && (
                    <div className="text-center py-20 bg-muted/10 rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">Nenhum prompt encontrado para os filtros atuais.</p>
                    </div>
                )}
            </div>

            {/* Modal de Edição */}
            <Dialog open={!!editingPrompt} onOpenChange={(open) => !open && setEditingPrompt(null)}>
                <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-primary bg-primary/5">
                                {editingPrompt?.blockName}
                            </Badge>
                            <span className="text-[10px] font-mono text-muted-foreground">{editingPrompt?.key}</span>
                        </div>
                        <DialogTitle>Editar Prompt</DialogTitle>
                        <DialogDescription>
                            {editingPrompt?.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 min-h-0 py-4 flex flex-col gap-4">
                        <div className="flex-1 relative">
                            <Textarea
                                className="h-full font-mono text-xs bg-muted/30 focus-visible:ring-1 resize-none p-4"
                                value={editingPrompt?.template || ''}
                                onChange={(e) => {
                                    if (editingPrompt) {
                                        setEditingPrompt({ ...editingPrompt, template: e.target.value });
                                    }
                                }}
                            />
                        </div>

                        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase">Variáveis Disponíveis:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {editingPrompt?.key.includes('STYLE') && (
                                    <>
                                        {editingPrompt.key.includes('SUGGESTION') && (
                                            <code className="text-[10px] text-primary font-mono bg-background px-2 py-0.5 rounded border border-primary/20">{"{{CONTEXT_STR}}"}</code>
                                        )}
                                        {editingPrompt.key.includes('VISUAL') && (
                                            <>
                                                <code className="text-[10px] text-primary font-mono bg-background px-2 py-0.5 rounded border border-primary/20">{"{{CONTEXT_BLOCK}}"}</code>
                                                <code className="text-[10px] text-primary font-mono bg-background px-2 py-0.5 rounded border border-primary/20">{"{{USER_PROMPT}}"}</code>
                                            </>
                                        )}
                                    </>
                                )}
                                {editingPrompt?.key.includes('CLIMATE') && (
                                    <>
                                        <code className="text-[10px] text-primary font-mono bg-background px-2 py-0.5 rounded border border-primary/20">{"{{GLOBAL_RULE}}"}</code>
                                        {editingPrompt.key.includes('PREVIEW') ? (
                                            <code className="text-[10px] text-primary font-mono bg-background px-2 py-0.5 rounded border border-primary/20">{"{{CLIMATE_CONTEXT}}"}</code>
                                        ) : (
                                            <code className="text-[10px] text-primary font-mono bg-background px-2 py-0.5 rounded border border-primary/20">{"{{CURRENT_TEXT}}"}</code>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
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
