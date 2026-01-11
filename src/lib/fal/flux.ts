import { getFalClient } from './client';

export type FluxInput = {
    prompt: string;
    image_size?: 'square_hd' | 'portrait_16_9' | 'landscape_16_9' | { width: number; height: number };
    num_images?: number;
    num_inference_steps?: number;
    seed?: number;
    enable_safety_checker?: boolean;
};

export type FluxOutput = {
    images: Array<{
        url: string;
        width: number;
        height: number;
        content_type: string;
    }>;
    seed: number;
};

export const IMAGE_PRESETS = {
    short_vertical: 'portrait_16_9',
    short_square: 'square_hd',
    thumbnail: 'landscape_16_9',
} as const;

export async function generateFluxImage(input: FluxInput): Promise<FluxOutput> {
    const client = getFalClient();
    // Flux Schnell é rápido, usar modo síncrono (run)
    return await client.run<FluxOutput>('fal-ai/flux/schnell', {
        ...input,
        num_inference_steps: input.num_inference_steps ?? 4,
        enable_safety_checker: input.enable_safety_checker ?? true,
    }, { timeout: 60000 });
}
