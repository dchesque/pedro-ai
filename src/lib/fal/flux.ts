import { runFal } from './client';
import { createLogger } from '@/lib/logger'

const log = createLogger('fal/flux')

export type FluxInput = {
    prompt: string;
    image_size?: 'square_hd' | 'portrait_16_9' | 'landscape_16_9' | { width: number; height: number };
    num_images?: number;
    num_inference_steps?: number;
    seed?: number;
    enable_safety_checker?: boolean;
    negative_prompt?: string;
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
    const startTime = log.start('Gerando imagem Flux', {
        size: input.image_size,
        images: input.num_images
    })

    try {
        log.debug('Prompt', { prompt: input.prompt.substring(0, 100) })

        const result = await runFal<FluxOutput>('fal-ai/flux/schnell', {
            ...input,
            num_inference_steps: input.num_inference_steps ?? 4,
            enable_safety_checker: input.enable_safety_checker ?? true,
        });

        log.success('Imagem gerada', startTime, {
            images: result.images.length,
            width: result.images[0]?.width,
            height: result.images[0]?.height
        })

        return result
    } catch (error) {
        log.fail('Flux Schnell', error)
        throw error
    }
}
