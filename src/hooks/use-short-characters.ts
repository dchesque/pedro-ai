import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ShortCharacter, Character } from '../../prisma/generated/client_final'

export type ShortCharacterWithDetails = ShortCharacter & {
    character: Character
}

interface AddCharacterInput {
    shortId: string
    characterId: string
    role?: string
    orderIndex?: number
    customPrompt?: string
    customClothing?: string
}

export function useShortCharacters(shortId: string) {
    return useQuery<{ characters: ShortCharacterWithDetails[] }>({
        queryKey: ['short-characters', shortId],
        queryFn: async () => {
            const res = await fetch(`/api/shorts/${shortId}/characters`)
            if (!res.ok) throw new Error('Failed to fetch short characters')
            return res.json()
        },
        enabled: !!shortId
    })
}

export function useAddCharacterToShort() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: AddCharacterInput) => {
            const res = await fetch(`/api/shorts/${data.shortId}/characters`, {
                method: 'POST',
                body: JSON.stringify(data),
            })
            if (!res.ok) throw new Error('Failed to add character to short')
            return res.json() as Promise<{ shortCharacter: ShortCharacterWithDetails }>
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['short-characters', variables.shortId] })
        }
    })
}

export function useRemoveCharacterFromShort() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ shortId, characterId }: { shortId: string, characterId: string }) => {
            const res = await fetch(`/api/shorts/${shortId}/characters?characterId=${characterId}`, {
                method: 'DELETE',
            })
            if (!res.ok) throw new Error('Failed to remove character from short')
            return res.json()
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['short-characters', variables.shortId] })
        }
    })
}
