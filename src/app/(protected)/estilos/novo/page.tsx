'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// Custom Components
import { GuidedSelectGroup } from '@/components/styles/guided-select-group';
import { GuidedSelectCard } from '@/components/styles/guided-select-card';
import { ClimateAffinities } from '@/components/styles/climate-affinities';
import { AdvancedInstructions } from '@/components/styles/advanced-instructions';

// Types & Labels
import {
    StyleFormData,
    ContentType,
    CONTENT_TYPE_LABELS,
    DISCOURSE_ARCHITECTURE_LABELS,
    LANGUAGE_REGISTER_LABELS,
    SCRIPT_FUNCTION_LABELS,
    NARRATOR_POSTURE_LABELS,
    CONTENT_COMPLEXITY_LABELS,
    STYLE_HOOK_LABELS,
    STYLE_CTA_LABELS,
    labelsToOptions,
} from '@/types/style';

// Icons
import { ArrowLeft, Sparkles, Save, Loader2, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

// Initial State
const initialFormData: StyleFormData = {
    name: '',
    description: '',
    icon: '📝',
    contentType: 'CUSTOM',
    targetAudience: '',
    keywords: [],
    discourseArchitecture: 'DIRECT_OBJECTIVE',
    languageRegister: 'INFORMAL',
    scriptFunction: 'INFORM',
    narratorPosture: 'AUTHORITY',
    contentComplexity: 'MEDIUM',
    advancedInstructions: '',
    hookExample: '',
    ctaExample: '',
    visualPromptBase: '',
    compatibleClimates: [],
};

export default function CreateStylePage() {
    const router = useRouter();
    const [formData, setFormData] = useState<StyleFormData>(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [keywordInput, setKeywordInput] = useState('');

    // Handlers
    const updateField = <K extends keyof StyleFormData>(
        field: K,
        value: StyleFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const [loadingSuggestion, setLoadingSuggestion] = useState<{ hook: boolean; cta: boolean }>({ hook: false, cta: false });

    const suggestWithAi = async (type: 'HOOK' | 'CTA') => {
        setLoadingSuggestion(prev => ({ ...prev, [type.toLowerCase()]: true }));
        try {
            const response = await fetch('/api/styles/ai/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, styleData: formData })
            });

            if (!response.ok) throw new Error('Falha na sugestão');

            const data = await response.json();
            if (data.type) {
                if (type === 'HOOK') {
                    updateField('hookType', data.type);
                    if (data.example) updateField('hookExample', data.example);
                } else {
                    updateField('ctaType', data.type);
                    if (data.example) updateField('ctaExample', data.example);
                }
                toast.success('Sugestão aplicada!');
            }
        } catch (e) {
            toast.error('Erro ao gerar sugestão com IA');
        } finally {
            setLoadingSuggestion(prev => ({ ...prev, [type.toLowerCase()]: false }));
        }
    };

    const [visualRefinement, setVisualRefinement] = useState<{ original: string; refined: string; isOpen: boolean; loading: boolean }>({
        original: '',
        refined: '',
        isOpen: false,
        loading: false
    });

    const refineVisualPrompt = async () => {
        if (!formData.visualPromptBase) return;

        setVisualRefinement(prev => ({ ...prev, loading: true, original: formData.visualPromptBase }));

        try {
            const response = await fetch('/api/styles/ai/refine-visual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: formData.visualPromptBase })
            });

            if (!response.ok) throw new Error('Falha no refinamento');

            const data = await response.json();
            setVisualRefinement(prev => ({
                ...prev,
                refined: data.refined,
                isOpen: true
            }));

        } catch (e) {
            toast.error('Erro ao refinar prompt visual');
        } finally {
            setVisualRefinement(prev => ({ ...prev, loading: false }));
        }
    };

    const addKeyword = () => {
        if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
            updateField('keywords', [...formData.keywords, keywordInput.trim()]);
            setKeywordInput('');
        }
    };

    const removeKeyword = (keyword: string) => {
        updateField('keywords', formData.keywords.filter(k => k !== keyword));
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('Nome do estilo é obrigatório');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/styles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Erro ao criar estilo');
            }

            toast.success('Estilo criado com sucesso!');
            router.push('/estilos');
        } catch (error) {
            toast.error('Erro ao criar estilo');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container max-w-4xl py-8 mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/estilos"
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para Estilos
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Criar Novo Estilo
                </h1>
                <p className="text-muted-foreground mt-1">
                    Defina a identidade estrutural e semântica do seu conteúdo
                </p>
            </div>

            <div className="space-y-8">
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-primary" />
                            Informações Básicas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Nome e Ícone */}
                        <div className="grid grid-cols-[auto_1fr] gap-4">
                            <div className="space-y-2">
                                <Label>Ícone</Label>
                                <Input
                                    value={formData.icon}
                                    onChange={(e) => updateField('icon', e.target.value)}
                                    className="w-16 text-center text-xl"
                                    maxLength={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome do Estilo *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    placeholder="Ex: Notícias High Tech"
                                />
                            </div>
                        </div>

                        {/* Descrição */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                placeholder="Breve descrição do propósito deste estilo"
                                rows={2}
                            />
                            <p className="text-xs text-muted-foreground">
                                Aparecerá nos cards de seleção
                            </p>
                        </div>

                        {/* Tipo de Conteúdo */}
                        <div className="space-y-3">
                            <Label>Tipo de Conteúdo *</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(CONTENT_TYPE_LABELS).map(([value, data]) => (
                                    <GuidedSelectCard
                                        key={value}
                                        value={value as ContentType}
                                        label={data.label}
                                        description={data.description}
                                        icon={data.icon}
                                        selected={formData.contentType === value}
                                        onSelect={(v) => updateField('contentType', v)}
                                    />
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* SEÇÃO 2: PARÂMETROS DE ESTRUTURA */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-primary" />
                            Parâmetros de Estrutura
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Público-alvo e Keywords */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="targetAudience">Público-Alvo</Label>
                                <Input
                                    id="targetAudience"
                                    value={formData.targetAudience}
                                    onChange={(e) => updateField('targetAudience', e.target.value)}
                                    placeholder="Ex: jovens empreendedores"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Quem é o espectador ideal?
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Palavras-chave</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={keywordInput}
                                        onChange={(e) => setKeywordInput(e.target.value)}
                                        placeholder="Ex: tecnologia"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                                    />
                                    <Button type="button" variant="outline" onClick={addKeyword}>
                                        +
                                    </Button>
                                </div>
                                {formData.keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {formData.keywords.map((kw) => (
                                            <Badge
                                                key={kw}
                                                variant="secondary"
                                                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                                                onClick={() => removeKeyword(kw)}
                                            >
                                                {kw} ×
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Arquitetura do Discurso */}
                        <GuidedSelectGroup
                            label="Arquitetura do Discurso"
                            description="Define como o conteúdo é estruturado (não confundir com ritmo/clima)"
                            options={labelsToOptions(DISCOURSE_ARCHITECTURE_LABELS)}
                            value={formData.discourseArchitecture}
                            onChange={(v) => updateField('discourseArchitecture', v)}
                            columns={3}
                        />

                        {/* Registro de Linguagem */}
                        <GuidedSelectGroup
                            label="Registro de Linguagem"
                            description="O nível de formalidade do vocabulário"
                            options={labelsToOptions(LANGUAGE_REGISTER_LABELS)}
                            value={formData.languageRegister}
                            onChange={(v) => updateField('languageRegister', v)}
                            columns={4}
                        />

                        {/* Afinidades de Clima */}
                        <Separator />
                        <ClimateAffinities
                            contentType={formData.contentType}
                            selectedClimates={formData.compatibleClimates}
                            onClimatesChange={(v) => updateField('compatibleClimates', v)}
                        />
                    </CardContent>
                </Card>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* SEÇÃO 3: BLOCOS GUIADOS DO ROTEIRO */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-primary" />
                            Configuração do Roteiro
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Define O QUE o roteiro deve fazer (o COMO é definido pelo Clima)
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Função do Roteiro */}
                        <GuidedSelectGroup
                            label="Função Principal"
                            description="Qual o objetivo primário do conteúdo?"
                            options={labelsToOptions(SCRIPT_FUNCTION_LABELS)}
                            value={formData.scriptFunction}
                            onChange={(v) => updateField('scriptFunction', v)}
                            columns={4}
                        />

                        {/* Postura do Narrador */}
                        <GuidedSelectGroup
                            label="Postura do Narrador"
                            description="Como o narrador se apresenta ao público?"
                            options={labelsToOptions(NARRATOR_POSTURE_LABELS)}
                            value={formData.narratorPosture}
                            onChange={(v) => updateField('narratorPosture', v)}
                            columns={4}
                        />

                        {/* Complexidade */}
                        <GuidedSelectGroup
                            label="Complexidade do Conteúdo"
                            description="Nível de profundidade e tecnicidade"
                            options={labelsToOptions(CONTENT_COMPLEXITY_LABELS)}
                            value={formData.contentComplexity}
                            onChange={(v) => updateField('contentComplexity', v)}
                            columns={3}
                        />

                        <Separator />

                        {/* Exemplos de Hook e CTA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* HOOK SECTION */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Hook – Tipo</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] text-primary gap-1 hover:bg-primary/10"
                                        onClick={() => suggestWithAi('HOOK')}
                                        disabled={loadingSuggestion.hook}
                                    >
                                        {loadingSuggestion.hook ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Wand2 className="h-3 w-3" />
                                        )}
                                        Sugerir com IA
                                    </Button>
                                </div>
                                <Select
                                    value={formData.hookType || ''}
                                    onValueChange={(v) => updateField('hookType', v as any)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo de abertura..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {labelsToOptions(STYLE_HOOK_LABELS).map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Exemplo de Hook (Opcional)</Label>
                                    <Textarea
                                        value={formData.hookExample}
                                        onChange={(e) => updateField('hookExample', e.target.value)}
                                        placeholder='Ex: "Você já parou para pensar..."'
                                        rows={3}
                                        className="bg-muted/20"
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground italic">
                                    Sugestões estruturais. O impacto emocional é definido pelo Clima no roteiro.
                                </p>
                            </div>

                            {/* CTA SECTION */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>CTA – Tipo</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-[10px] text-primary gap-1 hover:bg-primary/10"
                                        onClick={() => suggestWithAi('CTA')}
                                        disabled={loadingSuggestion.cta}
                                    >
                                        {loadingSuggestion.cta ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Wand2 className="h-3 w-3" />
                                        )}
                                        Sugerir com IA
                                    </Button>
                                </div>
                                <Select
                                    value={formData.ctaType || ''}
                                    onValueChange={(v) => updateField('ctaType', v as any)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo de fechamento..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {labelsToOptions(STYLE_CTA_LABELS).map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="space-y-1.5">
                                    <Label className="text-xs text-muted-foreground">Exemplo de CTA (Opcional)</Label>
                                    <Textarea
                                        value={formData.ctaExample}
                                        onChange={(e) => updateField('ctaExample', e.target.value)}
                                        placeholder='Ex: "Curta e compartilhe para mais!"'
                                        rows={3}
                                        className="bg-muted/20"
                                    />
                                </div>
                                <p className="text-[11px] text-muted-foreground italic">
                                    Sugestões estruturais. O impacto emocional é definido pelo Clima no roteiro.
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Instruções Avançadas */}
                        <AdvancedInstructions
                            value={formData.advancedInstructions}
                            onChange={(v) => updateField('advancedInstructions', v)}
                        />
                    </CardContent>
                </Card>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* SEÇÃO 4: ESTILO VISUAL */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-primary" />
                            Estilo Visual
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="visualPromptBase">Prompt Visual Base (Inglês)</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-[10px] text-primary gap-1 hover:bg-primary/10"
                                    onClick={() => refineVisualPrompt()}
                                    disabled={visualRefinement.loading || !formData.visualPromptBase}
                                >
                                    {visualRefinement.loading ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Wand2 className="h-3 w-3" />
                                    )}
                                    Refinar com IA
                                </Button>
                            </div>
                            <Textarea
                                id="visualPromptBase"
                                value={formData.visualPromptBase}
                                onChange={(e) => updateField('visualPromptBase', e.target.value)}
                                placeholder="Ex: cinematic style, dramatic lighting, vibrant colors, high resolution, photorealistic"
                                rows={3}
                            />
                            <p className="text-xs text-muted-foreground">
                                A IA melhora a clareza e tradução do prompt. Não altera o estilo escolhido.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* AÇÕES */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <Button variant="outline" asChild>
                        <Link href="/estilos">Cancelar</Link>
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Criar Estilo
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Visual Refinement Dialog */}
            <Dialog open={visualRefinement.isOpen} onOpenChange={(open) => setVisualRefinement(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Refinamento Visual IA</DialogTitle>
                        <DialogDescription>
                            Compare o prompt original com a sugestão técnica da IA.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase">Original</Label>
                            <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground border">
                                {visualRefinement.original}
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <ArrowLeft className="h-4 w-4 rotate-[-90deg] text-muted-foreground/50" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-primary uppercase flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                Sugestão Refinada
                            </Label>
                            <div className="bg-primary/5 p-3 rounded-md text-sm border border-primary/20">
                                {visualRefinement.refined}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setVisualRefinement(prev => ({ ...prev, isOpen: false }))}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                updateField('visualPromptBase', visualRefinement.refined);
                                setVisualRefinement(prev => ({ ...prev, isOpen: false }));
                                toast.success('Prompt visual atualizado!');
                            }}
                        >
                            Aceitar Refinamento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
