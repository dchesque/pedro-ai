"use client"

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ShortScene } from '@/hooks/use-shorts'
import { SceneCard } from './SceneCard'

interface SortableSceneListProps {
    scenes: ShortScene[]
    onReorder: (sceneIds: string[]) => void
    onEdit: (scene: ShortScene) => void
    onRegenerate: (scene: ShortScene) => void
    onRemove: (sceneId: string) => void
    onDuplicate: (scene: ShortScene) => void
}

export function SortableSceneList({
    scenes,
    onReorder,
    onEdit,
    onRegenerate,
    onRemove,
    onDuplicate
}: SortableSceneListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = scenes.findIndex((s) => s.id === active.id)
            const newIndex = scenes.findIndex((s) => s.id === over.id)

            const newScenes = arrayMove(scenes, oldIndex, newIndex)
            onReorder(newScenes.map((s) => s.id))
        }
    }

    const moveUp = (index: number) => {
        if (index === 0) return
        const newScenes = arrayMove(scenes, index, index - 1)
        onReorder(newScenes.map(s => s.id))
    }

    const moveDown = (index: number) => {
        if (index === scenes.length - 1) return
        const newScenes = arrayMove(scenes, index, index + 1)
        onReorder(newScenes.map(s => s.id))
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={scenes.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {scenes.map((scene, index) => (
                        <SceneCard
                            key={scene.id}
                            scene={scene}
                            index={index}
                            onEdit={() => onEdit(scene)}
                            onRegenerate={() => onRegenerate(scene)}
                            onRemove={() => onRemove(scene.id)}
                            onDuplicate={() => onDuplicate(scene)}
                            onMoveUp={() => moveUp(index)}
                            onMoveDown={() => moveDown(index)}
                            canMoveUp={index > 0}
                            canMoveDown={index < scenes.length - 1}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    )
}
