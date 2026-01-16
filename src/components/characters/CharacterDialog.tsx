import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Loader2, Sparkles, Wand2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useUpdateCharacter } from "@/hooks/use-characters"
import { useToast } from "@/hooks/use-toast"
import { generateCharacterPrompt } from "@/lib/characters/prompt-generator"
import { cn } from "@/lib/utils"
import { Copy } from "lucide-react"
import type { Character } from "../../../prisma/generated/client_final"

// Schema
const characterSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    description: z.string().optional(),
    imageUrl: z.string().url("URL da imagem inválida").min(1, "Imagem é obrigatória"),
    traits: z.object({
        age: z.string().optional(),
        gender: z.enum(['male', 'female', 'other']).optional(),
        hairColor: z.string().optional(),
        hairStyle: z.string().optional(),
        skinTone: z.string().optional(),
        eyeColor: z.string().optional(),
        clothing: z.string().optional(),
        accessories: z.string().optional(),
        distinctiveFeatures: z.string().optional(),
        bodyType: z.string().optional(),
    }),
    promptDescription: z.string().optional()
})

type CharacterFormValues = z.infer<typeof characterSchema>

interface CharacterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    character?: Character // If provided, edit mode
}

export function CharacterDialog({ open, onOpenChange, character }: CharacterDialogProps) {
    if (!character) return null

    const { toast } = useToast()
    const updateMutation = useUpdateCharacter()
    const [showTraits, setShowTraits] = useState(true)

    const form = useForm<CharacterFormValues>({
        resolver: zodResolver(characterSchema),
        defaultValues: {
            name: character?.name || "",
            description: character?.description || "",
            imageUrl: character?.imageUrl || "",
            traits: (character?.traits as any) || {
                age: "",
                gender: "female",
                hairColor: "",
                hairStyle: "",
                skinTone: "",
                eyeColor: "",
                clothing: "",
                accessories: "",
                distinctiveFeatures: "",
                bodyType: "",
            },
            promptDescription: character?.promptDescription || ""
        }
    })

    const isSubmitting = updateMutation.isPending

    // Reset form when character changes
    useEffect(() => {
        if (open && character) {
            form.reset({
                name: character.name || "",
                description: character.description || "",
                imageUrl: character.imageUrl || "",
                traits: (character.traits as any) || {
                    age: "",
                    gender: "female",
                    hairColor: "",
                    hairStyle: "",
                    skinTone: "",
                    eyeColor: "",
                    clothing: "",
                    accessories: "",
                    distinctiveFeatures: "",
                    bodyType: "",
                },
                promptDescription: character.promptDescription || ""
            })
        }
    }, [character, form, open])

    const onSubmit = async (data: CharacterFormValues) => {
        try {
            await updateMutation.mutateAsync({
                id: character.id,
                ...data
            })
            toast({ title: "Personagem atualizado com sucesso!" })
            onOpenChange(false)
        } catch (error) {
            toast({
                title: "Erro ao salvar personagem",
                description: (error as Error).message,
                variant: "destructive"
            })
        }
    }

    const handleGeneratePrompt = () => {
        const values = form.getValues()
        const generated = generateCharacterPrompt(values.name, values.traits as any)
        form.setValue("promptDescription", generated)
        toast({ title: "Prompt gerado!", description: "Revise o prompt gerado abaixo." })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg md:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Personagem</DialogTitle>
                    <DialogDescription>
                        Defina as características visuais para manter consistência nos shorts.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Coluna Esquerda: Básico + Imagem */}
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="imageUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Imagem de Referência (URL)</FormLabel>
                                            <FormControl>
                                                <div className="space-y-2">
                                                    {/* TODO: Substituir por componente de Upload real */}
                                                    <Input placeholder="https://..." {...field} />
                                                    {field.value && (
                                                        <div className="relative aspect-[3/4] w-full rounded-md overflow-hidden border">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={field.value} alt="Preview" className="object-cover w-full h-full" />
                                                        </div>
                                                    )}
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Maria" {...field} />
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
                                            <FormLabel>Descrição (Opcional)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Uma menina curiosa que adora aventuras..." className="resize-none h-20" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Coluna Direita: Traits e Prompt */}
                            <div className="space-y-4">
                                <Collapsible open={showTraits} onOpenChange={setShowTraits} className="border rounded-md p-4 bg-muted/20">
                                    <div className="flex items-center justify-between mb-4">
                                        <Label className="text-base font-semibold">Características Visuais</Label>
                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="sm"><ChevronDown className={`w-4 h-4 transition-transform ${showTraits ? 'rotate-180' : ''}`} /></Button>
                                        </CollapsibleTrigger>
                                    </div>

                                    <CollapsibleContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={form.control} name="traits.age" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Idade Aparente</FormLabel><FormControl><Input {...field} placeholder="Ex: 6 anos" className="h-8" /></FormControl></FormItem>
                                            )} />
                                            <FormField control={form.control} name="traits.gender" render={({ field }) => (
                                                <FormItem><FormLabel className="text-xs">Gênero</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                                        <SelectContent><SelectItem value="female">Feminino</SelectItem><SelectItem value="male">Masculino</SelectItem><SelectItem value="other">Outro</SelectItem></SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                        </div>

                                        <FormField control={form.control} name="traits.hairStyle" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Cabelo (Cor e Estilo)</FormLabel><FormControl><Input {...field} placeholder="Ex: Castanho, longo e cacheado" className="h-8" /></FormControl></FormItem>
                                        )} />

                                        <FormField control={form.control} name="traits.skinTone" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Tom de Pele</FormLabel><FormControl><Input {...field} placeholder="Ex: Clara, com sardas" className="h-8" /></FormControl></FormItem>
                                        )} />

                                        <FormField control={form.control} name="traits.clothing" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Roupa Típica</FormLabel><FormControl><Input {...field} placeholder="Ex: Vestido rosa" className="h-8" /></FormControl></FormItem>
                                        )} />

                                        <FormField control={form.control} name="traits.bodyType" render={({ field }) => (
                                            <FormItem><FormLabel className="text-xs">Tipo Físico</FormLabel><FormControl><Input {...field} placeholder="Ex: Criança magra" className="h-8" /></FormControl></FormItem>
                                        )} />
                                    </CollapsibleContent>
                                </Collapsible>

                                <div className="space-y-2 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Label>Prompt Otimizado (Inglês)</Label>
                                            {(() => {
                                                const portrait = form.watch("promptDescription")
                                                const wordCount = portrait?.trim() ? portrait.trim().split(/\s+/).length : 0
                                                if (wordCount === 0) return null
                                                const quality = wordCount > 80 ? 'Excelente' : wordCount > 50 ? 'Bom' : 'Básico'
                                                const color = wordCount > 80 ? 'text-green-600 bg-green-50' : wordCount > 50 ? 'text-blue-600 bg-blue-50' : 'text-yellow-600 bg-yellow-50'

                                                return (
                                                    <Badge variant="outline" className={cn("text-[10px] h-4 px-1", color)}>
                                                        {quality}
                                                    </Badge>
                                                )
                                            })()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-[10px] gap-1"
                                                disabled={!form.watch("promptDescription")}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(form.getValues("promptDescription"))
                                                    toast({ title: "Copiado!" })
                                                }}
                                            >
                                                <Copy className="h-3 w-3" />
                                                Copiar
                                            </Button>
                                            <Button type="button" variant="outline" size="sm" onClick={handleGeneratePrompt} className="h-7 gap-1 text-[10px]">
                                                <Sparkles className="w-3 h-3 text-amber-500" />
                                                IA
                                            </Button>
                                        </div>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="promptDescription"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        {...field}
                                                        placeholder="Prompt final que será enviado para a IA de imagem..."
                                                        className="h-32 font-mono text-xs bg-muted/50"
                                                    />
                                                </FormControl>
                                                <div className="flex justify-between items-center px-1">
                                                    <FormDescription className="text-[10px]">
                                                        Consistência visual do personagem.
                                                    </FormDescription>
                                                    <span className="text-[10px] text-muted-foreground italic">
                                                        {form.watch("promptDescription")?.trim() ? form.watch("promptDescription").trim().split(/\s+/).length : 0} palavras
                                                    </span>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="min-w-[100px]">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
