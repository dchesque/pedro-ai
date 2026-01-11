import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Character } from '../../prisma/generated/client_final'

interface CreateCharacterInput {
    name: string
    imageUrl: string
    description?: string
    traits?: any
    promptDescription?: string
}

interface UpdateCharacterInput {
    id: string
    name?: string
    imageUrl?: string
    description?: string
    traits?: any
    promptDescription?: string
}

export function useCharacters() {
    return useQuery<{ characters: Character[] }>({
        queryKey: ['characters'],
        queryFn: async () => {
            const res = await fetch('/api/characters')
            if (!res.ok) throw new Error('Failed to fetch characters')
            return res.json()
        }
    })
}

export function useCharacter(id: string) {
    return useQuery<{ character: Character }>({
        queryKey: ['character', id],
        queryFn: async () => {
            const res = await fetch(`/api/characters/${id}`)
            if (!res.ok) throw new Error('Failed to fetch character')
            return res.json()
        },
        enabled: !!id
    })
}

export function useCreateCharacter() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: CreateCharacterInput) => {
            const res = await fetch('/api/characters', {
                method: 'POST',
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to create character')
            return res.json() as Promise<{ character: Character }>
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['characters'] })
        }
    })
}

export function useUpdateCharacter() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: UpdateCharacterInput) => {
            const res = await fetch(`/api/characters/${data.id}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to update character')
            return res.json() as Promise<{ character: Character }>
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['characters'] })
            queryClient.invalidateQueries({ queryKey: ['character', data.character.id] })
        }
    })
}

export function useDeleteCharacter() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/characters/${id}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw new Error('Failed to delete character')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['characters'] })
        }
    })
}

export function useGenerateCharacterPrompt() {
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/characters/${id}/generate-prompt`, {
                method: 'POST',
            })
            if (!res.ok) throw new Error('Failed to generate prompt')
            return res.json() as Promise<{ character: Character }>
        }
    })
}
