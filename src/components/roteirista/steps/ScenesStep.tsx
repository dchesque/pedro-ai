"use client"

import React from 'react'
import { Plus, Wand2, Loader2, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SceneEditor } from '../SceneEditor'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { createId } from '@paralleldrive/cuid2'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import type { ScriptFormData, SceneData, GenerateScenesRequest, GenerateScenesResponse } from '@/lib/roteirista/types'

interface ScenesStepProps {
    data: Partial<ScriptFormData>
    onChange: (data: Partial<ScriptFormData>) => void
    onNext: () => void
}

// Wrapper para tornar o SceneEditor sortable
function SortableScene({
    scene,
    index,
    onChange,
    onDelete,
    context,
    disabled
}: {
    scene: SceneData;
    index: number;
    onChange: (scene: SceneData) => void;
    onDelete: () => void;
    context?: any;
    disabled?: boolean
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: scene.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <SceneEditor
                scene={scene}
                index={index}
                onChange={onChange}
                onDelete={onDelete}
                context={context}
                disabled={disabled}
                isDragging={isDragging}
            />
        </div>
    )
}

export function ScenesStep({ data, onChange, onNext }: ScenesStepProps) {
    const scenes = data.scenes || []

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Permite clicar em botões dentro do card
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const generateScenesMutation = useMutation({
        mutationFn: async () => {
            const request: GenerateScenesRequest = {
                title: data.title || '',
                premise: data.premise || '',
                theme: data.theme || data.premise || '',
                synopsis: data.synopsis || '',
                // tone: data.tone || '', // Legacy
                climate: data.climate || 'neutro', // Default fallback
                styleId: data.styleId || '',
                climateId: data.climateId || '',
                modelId: data.modelId || '',
                characterDescriptions: data.charactersDescription || '',
                sceneCount: data.sceneCount || 7,
                targetAudience: data.targetAudience || '',
            }
            return api.post<GenerateScenesResponse>('/api/roteirista/ai/generate-scenes', request)
        },
        onSuccess: (response) => {
            onChange({ ...data, scenes: response.scenes })
        },
    })

    const handleAddScene = () => {
        const newScene: SceneData = {
            id: createId(),
            orderIndex: scenes.length,
            narration: '',
            visualPrompt: '',
            duration: 5,
        }
        onChange({ ...data, scenes: [...scenes, newScene] })
    }

    const handleUpdateScene = (updatedScene: SceneData) => {
        const newScenes = scenes.map((s) => (s.id === updatedScene.id ? updatedScene : s))
        onChange({ ...data, scenes: newScenes })
    }

    const handleDeleteScene = (id: string) => {
        const newScenes = scenes.filter((s) => s.id !== id).map((s, idx) => ({ ...s, orderIndex: idx }))
        onChange({ ...data, scenes: newScenes })
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            const oldIndex = scenes.findIndex((s) => s.id === active.id)
            const newIndex = scenes.findIndex((s) => s.id === over?.id)

            const reordered = arrayMove(scenes, oldIndex, newIndex).map((s, idx) => ({
                ...s,
                orderIndex: idx,
            }))

            onChange({ ...data, scenes: reordered })
        }
    }

    const isLoading = generateScenesMutation.isPending

    return (
        <div className="space-y-6">
            {/* Empty State / Generation */}
            {scenes.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Wand2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="max-w-md space-y-2">
                            <h3 className="font-semibold text-lg">Pronto para criar as cenas?</h3>
                            <p className="text-sm text-muted-foreground">
                                A IA pode gerar todas as cenas baseadas na sua sinopse e personagens,
                                ou você pode criar manualmente uma por uma.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 pt-4">
                            <Button
                                onClick={() => generateScenesMutation.mutate()}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Wand2 className="h-4 w-4" />
                                )}
                                Gerar Roteiro com IA
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleAddScene}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Criar Manualmente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">Roteiro ({scenes.length} cenas)</h3>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateScenesMutation.mutate()}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <Loader2 className={cn("h-4 w-4", !isLoading && "hidden")} />
                                Regerar Tudo
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddScene}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Cena
                            </Button>
                        </div>
                    </div>

                    {/* List of Scenes */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={scenes.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {scenes.map((scene, index) => (
                                    <SortableScene
                                        key={scene.id}
                                        scene={scene}
                                        index={index}
                                        onChange={handleUpdateScene}
                                        onDelete={() => handleDeleteScene(scene.id)}
                                        context={{
                                            title: data.title,
                                            synopsis: data.synopsis,
                                            // tone: data.tone,
                                            climate: data.climate,
                                            targetAudience: data.targetAudience,
                                            characterDescriptions: data.charactersDescription,
                                        }}
                                        disabled={isLoading}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <Button
                        onClick={handleAddScene}
                        variant="ghost"
                        className="w-full border-dashed border-2 py-8 h-auto gap-2 text-muted-foreground hover:text-primary"
                        disabled={isLoading}
                    >
                        <Plus className="h-4 w-4" />
                        Adicionar Nova Cena
                    </Button>
                </div>
            )}
        </div>
    )
}
