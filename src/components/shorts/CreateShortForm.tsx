"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { useAvailableStyles } from "@/hooks/use-agents"
import { CharacterSelector } from "../characters/CharacterSelector"
import { useCredits } from "@/hooks/use-credits"

import { AIModelSelector } from "./AIModelSelector"
import { CreditEstimate } from "./CreditEstimate"

const formSchema = z.object({
    theme: z.string().min(10, 'Descreva o tema com pelo menos 10 caracteres').max(500),
    targetDuration: z.number().int().min(15).max(60),
    style: z.string().min(1, 'Selecione um estilo'),
    aiModel: z.string().min(1),
    characterIds: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateShortFormProps {
    onSubmit: (values: FormValues) => Promise<void>
    isLoading?: boolean
}

export function CreateShortForm({ onSubmit, isLoading }: CreateShortFormProps) {
    const { data: stylesData, isLoading: loadingStyles } = useAvailableStyles()
    const styles = stylesData?.styles ?? []
    const { credits } = useCredits()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            theme: "",
            targetDuration: 30,
            style: "",
            aiModel: 'deepseek/deepseek-v3.2'
        },
    })

    // Selecionar estilo padrão quando carregar
    React.useEffect(() => {
        if (styles.length > 0 && !form.getValues('style')) {
            const defaultStyle = styles.find(s => s.source === 'default' && s.key === 'engaging') ??
                styles.find(s => s.source === 'default') ??
                styles[0]
            form.setValue('style', defaultStyle.key)
        }
    }, [styles, form])

    const duration = form.watch("targetDuration")
    const aiModel = form.watch("aiModel")
    const estimatedScenes = Math.ceil(duration / 5)

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tema do Short</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Ex: 5 curiosidades sobre o espaço que vão te surpreender"
                                    className="min-h-[100px] resize-none"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Descreva o tema, nicho ou ideia principal do seu short.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="characterIds"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Personagens (Opcional)</FormLabel>
                            <FormControl>
                                <CharacterSelector
                                    selectedCharacterIds={field.value || []}
                                    onSelect={(id) => field.onChange([...(field.value || []), id])}
                                    onDeselect={(id) => field.onChange((field.value || []).filter(v => v !== id))}
                                />
                            </FormControl>
                            <FormDescription>
                                Personagens selecionados aparecerão consistentemente nas cenas.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="targetDuration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Duração: {field.value}s</FormLabel>
                                <FormControl>
                                    <Slider
                                        min={15}
                                        max={60}
                                        step={5}
                                        value={[field.value]}
                                        onValueChange={(v) => field.onChange(v[0])}
                                        disabled={isLoading}
                                    />
                                </FormControl>
                                <FormDescription>
                                    ~{estimatedScenes} cenas
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="style"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Estilo Visuall</FormLabel>
                                {loadingStyles ? (
                                    <Skeleton className="h-10 w-full" />
                                ) : (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um estilo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {styles.map((style) => (
                                                <SelectItem key={style.key} value={style.key}>
                                                    <div className="flex items-center gap-2">
                                                        <span>{style.icon}</span>
                                                        <span className="font-medium">{style.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="aiModel"
                    render={({ field }) => (
                        <FormItem>
                            <AIModelSelector
                                value={field.value}
                                onChange={field.onChange}
                                disabled={isLoading}
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <CreditEstimate
                    modelId={aiModel}
                    estimatedScenes={estimatedScenes}
                    userBalance={credits?.creditsRemaining}
                />

                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isLoading || loadingStyles}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Criando e Gerando Roteiro...
                        </>
                    ) : (
                        <>Criar e Gerar Roteiro</>
                    )}
                </Button>
            </form>
        </Form>
    )
}
