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

const formSchema = z.object({
    theme: z.string().min(10, 'Descreva o tema com pelo menos 10 caracteres').max(500),
    targetDuration: z.number().int().min(15).max(60),
    style: z.enum(['engaging', 'educational', 'funny', 'dramatic', 'inspirational']),
})

type FormValues = z.infer<typeof formSchema>

interface CreateShortFormProps {
    onSubmit: (values: FormValues) => Promise<void>
    isLoading?: boolean
}

const STYLES = [
    { value: 'engaging', label: 'Envolvente', desc: 'Conteúdo dinâmico e cativante' },
    { value: 'educational', label: 'Educacional', desc: 'Informativo e didático' },
    { value: 'funny', label: 'Divertido', desc: 'Humorístico e leve' },
    { value: 'dramatic', label: 'Dramático', desc: 'Intenso e emocionante' },
    { value: 'inspirational', label: 'Inspiracional', desc: 'Motivacional e positivo' },
]

export function CreateShortForm({ onSubmit, isLoading }: CreateShortFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            theme: "",
            targetDuration: 30,
            style: "engaging",
        },
    })

    const duration = form.watch("targetDuration")
    const estimatedScenes = Math.ceil(duration / 5)
    const estimatedCredits = 10 + estimatedScenes

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
                                ~{estimatedScenes} cenas • ~{estimatedCredits} créditos
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
                            <FormLabel>Estilo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um estilo" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {STYLES.map((style) => (
                                        <SelectItem key={style.value} value={style.value}>
                                            <div>
                                                <span className="font-medium">{style.label}</span>
                                                <span className="ml-2 text-muted-foreground text-xs">{style.desc}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Criando...
                        </>
                    ) : (
                        <>Criar Short ({estimatedCredits} créditos)</>
                    )}
                </Button>
            </form>
        </Form>
    )
}
