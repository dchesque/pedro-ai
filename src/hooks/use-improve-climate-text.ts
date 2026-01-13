import { useMutation } from '@tanstack/react-query';

interface ImproveClimateTextRequest {
    field: 'description' | 'instructions' | 'preview';
    currentText: string;
    climateContext: {
        name: string;
        emotionalState: string;
        revelationDynamic: string;
        narrativePressure: string;
        hookType: string;
        closingType: string;
        description?: string;
        instructions?: string;
    };
}

interface ImproveClimateTextResponse {
    improvedText: string;
    field: string;
}

async function improveClimateText(
    data: ImproveClimateTextRequest
): Promise<ImproveClimateTextResponse> {
    const response = await fetch('/api/climates/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao melhorar texto');
    }

    return response.json();
}

export function useImproveClimateText() {
    return useMutation({
        mutationFn: improveClimateText,
    });
}
