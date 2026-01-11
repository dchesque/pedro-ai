import { useQuery } from '@tanstack/react-query'
import { AIModel } from '@/lib/ai/models'

export function useAIModels() {
    return useQuery({
        queryKey: ['ai-models'],
        queryFn: async () => {
            const res = await fetch('/api/ai/models')
            if (!res.ok) throw new Error('Failed to fetch models')
            const data = await res.json()
            return data.models as AIModel[]
        },
        staleTime: 1000 * 60 * 60, // Cache por 1 hora
    })
}

export function useDefaultModel() {
    const { data: models } = useAIModels()
    return models?.find((m) => m.isDefault) ?? null
}
