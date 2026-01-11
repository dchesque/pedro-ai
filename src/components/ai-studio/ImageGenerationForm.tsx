"use client"

import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Sparkles, Loader2 } from "lucide-react"

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
import { useGenerateImage, type GenerateImageOutput } from "@/hooks/use-fal-generation"
import { useCredits } from "@/hooks/use-credits"

const imageSchema = z.object({
    prompt: z.string().min(1, 'Prompt é obrigatório').max(2000),
    preset: z.enum(['short_vertical', 'short_square', 'thumbnail']),
    count: z.string(),
})

type ImageFormValues = z.infer<typeof imageSchema>

interface ImageGenerationFormProps {
    onGenerated: (result: GenerateImageOutput) => void
    disabled?: boolean
}

export function ImageGenerationForm({ onGenerated, disabled }: ImageGenerationFormProps) {
    const { credits } = useCredits()
    const generateImage = useGenerateImage()

    const form = useForm<ImageFormValues>({
        resolver: zodResolver(imageSchema),
        defaultValues: {
            prompt: "",
            preset: "short_vertical",
            count: "1",
        },
    })

    const count = parseInt(form.watch("count"))
    const canGenerate = (credits?.creditsRemaining ?? 0) >= count && !disabled

    async function onSubmit(values: ImageFormValues) {
        try {
            const result = await generateImage.mutateAsync({
                prompt: values.prompt,
                preset: values.preset,
                count: parseInt(values.count),
            })
            onGenerated(result)
        } catch {
            // Erro já tratado no hook via toast
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="prompt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Prompt</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descreva a imagem que deseja gerar..."
                                    className="min-h-[120px] resize-none"
                                    disabled={generateImage.isPending || disabled}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Seja descritivo para melhores resultados.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="preset"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tamanho / Formato</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={generateImage.isPending || disabled}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o formato" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="short_vertical">Vertical (9:16) - Shorts/Reels</SelectItem>
                                        <SelectItem value="short_square">Quadrado (1:1) - Instagram</SelectItem>
                                        <SelectItem value="thumbnail">Horizontal (16:9) - Thumbnail</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="count"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantidade</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={generateImage.isPending || disabled}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Quantas imagens?" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="1">1 imagem</SelectItem>
                                        <SelectItem value="2">2 imagens</SelectItem>
                                        <SelectItem value="3">3 imagens</SelectItem>
                                        <SelectItem value="4">4 imagens</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={!canGenerate || generateImage.isPending}
                >
                    {generateImage.isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Gerar Imagem ({count} {count > 1 ? 'créditos' : 'crédito'})
                        </>
                    )}
                </Button>

                {!canGenerate && !generateImage.isPending && (credits?.creditsRemaining ?? 0) < count && (
                    <p className="text-center text-xs text-destructive">
                        Créditos insuficientes para gerar {count} {count > 1 ? 'imagens' : 'imagem'}.
                    </p>
                )}
            </form>
        </Form>
    )
}
