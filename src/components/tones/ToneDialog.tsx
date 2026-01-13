"use client"

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tone, useCreateTone, useUpdateTone } from '@/hooks/use-tones'

const formSchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    description: z.string().optional(),
    icon: z.string().max(4, "Use apenas 1 emoji").optional(),
    promptFragment: z.string().min(10, "Instrução deve ter pelo menos 10 caracteres"),
})

interface ToneDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children?: React.ReactNode
    tone?: Tone // If provided, edit mode
}

export function ToneDialog({ open, onOpenChange, children, tone }: ToneDialogProps) {
    const isEditing = !!tone
    const createTone = useCreateTone()
    const updateTone = useUpdateTone()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            icon: '🎭',
            promptFragment: '',
        },
    })

    useEffect(() => {
        if (tone) {
            form.reset({
                name: tone.name,
                description: tone.description || '',
                icon: tone.icon || '🎭',
                promptFragment: tone.promptFragment,
            })
        } else {
            form.reset({
                name: '',
                description: '',
                icon: '🎭',
                promptFragment: '',
            })
        }
    }, [tone, form])

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if (isEditing && tone) {
            updateTone.mutate({ id: tone.id, ...values }, {
                onSuccess: () => onOpenChange?.(false)
            })
        } else {
            createTone.mutate(values, {
                onSuccess: () => {
                    onOpenChange?.(false)
                    form.reset()
                }
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Tom' : 'Criar Novo Tom'}</DialogTitle>
                    <DialogDescription>
                        Defina a personalidade e o estilo de escrita deste tom.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-3">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nome</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Sarcástico, Profissional..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="col-span-1">
                                <FormField
                                    control={form.control}
                                    name="icon"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ícone</FormLabel>
                                            <FormControl>
                                                <Input className="text-center text-xl" placeholder="🎭" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição Curta</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Para que serve este tom?" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="promptFragment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Instruções para IA</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ex: Use linguagem formal, evite gírias, foque em dados técnicos..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Como o roteirista deve se comportar ao usar este tom?
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="submit" disabled={createTone.isPending || updateTone.isPending}>
                                {isEditing ? 'Salvar Alterações' : 'Criar Tom'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
