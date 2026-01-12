"use client"

import React, { useEffect } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { Style, ContentType } from '@/hooks/use-styles'
import { ContentTypeSelector } from './ContentTypeSelector'
import { IconPicker } from './IconPicker'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Loader2, Save, X } from 'lucide-react'

const styleSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    description: z.string().max(500).default(''),
    icon: z.string().max(10).default('🎬'),
    contentType: z.enum(['news', 'story', 'meme', 'educational', 'motivational', 'tutorial', 'custom']),
    scriptwriterPrompt: z.string().max(5000).default(''),
    targetDuration: z.number().min(15).max(180).default(45),
    suggestedSceneCount: z.number().min(3).max(15).default(7),
    narrativeStyle: z.string().max(50).default('direto'),
    languageStyle: z.string().max(50).default('informal'),
    defaultTone: z.string().max(50).default(''),
    exampleHook: z.string().max(500).default(''),
    exampleCta: z.string().max(500).default(''),
    visualPrompt: z.string().max(2000).default(''),
})

type StyleFormValues = z.infer<typeof styleSchema>

interface StyleFormProps {
    initialData?: Style
    onSubmit: (data: StyleFormValues) => void
    isLoading?: boolean
}

const TONE_OPTIONS = [
    '🎬 Cinemático', '⚔️ Épico', '🎭 Dramático', '😄 Comédia', '😱 Suspense',
    '💕 Romance', '👻 Terror', '📚 Educativo', '💪 Motivacional', '📰 Urgente'
]

const NARRATIVE_OPTIONS = [
    { value: 'direto', label: 'Direto e Objetivo' },
    { value: 'storytelling', label: 'Storytelling Clássico' },
    { value: 'primeira_pessoa', label: 'Primeira Pessoa' },
    { value: 'narrador_onisciente', label: 'Narrador Onisciente' }
]

const LANGUAGE_OPTIONS = [
    { value: 'formal', label: 'Formal' },
    { value: 'informal', label: 'Informal' },
    { value: 'jovem', label: 'Gíria/Jovem' },
    { value: 'tecnico', label: 'Técnico/Profissional' }
]

export function StyleForm({ initialData, onSubmit, isLoading }: StyleFormProps) {
    const router = useRouter()

    const form = useForm<StyleFormValues>({
        resolver: zodResolver(styleSchema) as any,
        defaultValues: {
            name: initialData?.name || '',
            description: initialData?.description || '',
            icon: initialData?.icon || '🎬',
            contentType: initialData?.contentType || 'story' as any,
            scriptwriterPrompt: initialData?.scriptwriterPrompt || '',
            targetDuration: initialData?.targetDuration || 45,
            suggestedSceneCount: initialData?.suggestedSceneCount || 7,
            narrativeStyle: initialData?.narrativeStyle || 'direto',
            languageStyle: initialData?.languageStyle || 'informal',
            defaultTone: initialData?.defaultTone || '',
            exampleHook: initialData?.exampleHook || '',
            exampleCta: initialData?.exampleCta || '',
            visualPrompt: initialData?.visualPrompt || '',
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name,
                description: initialData.description || '',
                icon: initialData.icon || '🎬',
                contentType: initialData.contentType as any,
                scriptwriterPrompt: initialData.scriptwriterPrompt || '',
                targetDuration: initialData.targetDuration || 45,
                suggestedSceneCount: initialData.suggestedSceneCount || 7,
                narrativeStyle: initialData.narrativeStyle || 'direto',
                languageStyle: initialData.languageStyle || 'informal',
                defaultTone: initialData.defaultTone || '',
                exampleHook: initialData.exampleHook || '',
                exampleCta: initialData.exampleCta || '',
                visualPrompt: initialData.visualPrompt || '',
            })
        }
    }, [initialData, form])

    const onFormSubmit = (values: StyleFormValues) => {
        onSubmit(values)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
                {/* INFORMAÇÕES BÁSICAS */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-xl font-bold uppercase tracking-wider text-muted-foreground/80">Informações Básicas</h2>
                    </div>

                    <Card className="glass-panel overflow-hidden border-border/50">
                        <CardContent className="p-6 space-y-6">
                            <div className="flex gap-4 items-start">
                                <FormField
                                    control={form.control}
                                    name="icon"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ícone</FormLabel>
                                            <FormControl>
                                                <IconPicker value={field.value} onChange={field.onChange} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex-1 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome do Estilo *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ex: Notícias High Tech" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Descrição</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Breve descrição do propósito deste estilo" {...field} />
                                                </FormControl>
                                                <FormDescription>Aparecerá nos cards de seleção.</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="contentType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Conteúdo *</FormLabel>
                                        <FormControl>
                                            <ContentTypeSelector value={field.value} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </section>

                <Separator className="bg-border/50" />

                {/* PARÂMETROS DE ESTRUTURA */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-xl font-bold uppercase tracking-wider text-muted-foreground/80">Parâmetros de Estrutura</h2>
                    </div>

                    <Card className="glass-panel border-border/50">
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="targetDuration"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between mb-2">
                                            <FormLabel>Duração Alvo: <span className="text-primary">{field.value}s</span></FormLabel>
                                        </div>
                                        <FormControl>
                                            <Slider
                                                min={15}
                                                max={180}
                                                step={5}
                                                value={[field.value]}
                                                onValueChange={(val) => field.onChange(val[0])}
                                            />
                                        </FormControl>
                                        <FormDescription className="flex justify-between mt-1">
                                            <span>15s</span>
                                            <span>180s</span>
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="suggestedSceneCount"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between mb-2">
                                            <FormLabel>Número de Cenas: <span className="text-primary">{field.value}</span></FormLabel>
                                        </div>
                                        <FormControl>
                                            <Slider
                                                min={3}
                                                max={15}
                                                step={1}
                                                value={[field.value]}
                                                onValueChange={(val) => field.onChange(val[0])}
                                            />
                                        </FormControl>
                                        <FormDescription className="flex justify-between mt-1">
                                            <span>3</span>
                                            <span>15</span>
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="defaultTone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tom Padrão</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um tom..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {TONE_OPTIONS.map(tone => (
                                                    <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="narrativeStyle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Narrativa</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {NARRATIVE_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="languageStyle"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Linguagem</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {LANGUAGE_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Separator className="bg-border/50" />

                {/* INSTRUÇÕES PARA O ROTEIRISTA */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-xl font-bold uppercase tracking-wider text-muted-foreground/80">Instruções para o Roteirista</h2>
                    </div>

                    <Card className="glass-panel border-border/50">
                        <CardContent className="p-6 space-y-6">
                            <FormField
                                control={form.control}
                                name="scriptwriterPrompt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prompt do Roteirista</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descreva detalhadamente como o roteirista deve se comportar..."
                                                rows={6}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Quanto mais detalhado, melhores os resultados. Explique o ritmo, estilo de frases e estrutura.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="exampleHook"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Exemplo de Abertura (Hook)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Ex: 'Você já parou para pensar...'" rows={3} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="exampleCta"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Exemplo de Fechamento (CTA)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Ex: 'Curta e compartilhe para mais!'" rows={3} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <Separator className="bg-border/50" />

                {/* ESTILO VISUAL */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-1 bg-primary rounded-full" />
                        <h2 className="text-xl font-bold uppercase tracking-wider text-muted-foreground/80">Estilo Visual</h2>
                    </div>

                    <Card className="glass-panel border-border/50">
                        <CardContent className="p-6">
                            <FormField
                                control={form.control}
                                name="visualPrompt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prompt Visual Base (Inglês)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Ex: cinematic style, dramatic lighting, vibrant colors, high resolution, photorealistic"
                                                rows={4}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Estilo base para as imagens geradas por IA. Escreva em inglês para melhores resultados.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </section>

                {/* BOTÕES DE AÇÃO */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <Button
                        variant="ghost"
                        type="button"
                        onClick={() => router.back()}
                        disabled={isLoading}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        size="lg"
                        disabled={isLoading}
                        className="px-8 shadow-lg shadow-primary/20"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {initialData ? 'Salvar Alterações' : 'Criar Estilo'}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
