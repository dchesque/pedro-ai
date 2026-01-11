import { runFalAsync } from './client';

export type KlingInput = {
    prompt: string;
    image_url?: string;
    duration?: '5' | '10';
    aspect_ratio?: '16:9' | '9:16' | '1:1';
    negative_prompt?: string;
};

export type KlingOutput = {
    video: {
        url: string;
        content_type: string;
        file_name: string;
        file_size: number;
    };
    seed: number;
};

export const KLING_MODELS = {
    text_to_video: 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
    image_to_video: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
} as const;

export async function generateKlingVideo(input: KlingInput): Promise<KlingOutput> {
    const model = input.image_url ? KLING_MODELS.image_to_video : KLING_MODELS.text_to_video;

    return await runFalAsync<KlingOutput>(model, {
        prompt: input.prompt,
        image_url: input.image_url,
        duration: input.duration ?? '5',
        aspect_ratio: input.aspect_ratio ?? '9:16',
        negative_prompt: input.negative_prompt,
    });
}
