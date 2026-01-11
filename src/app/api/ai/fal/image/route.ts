import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateUserAuthentication } from '@/lib/auth-utils';
import { validateCreditsForFeature, deductCreditsForFeature, refundCreditsForFeature } from '@/lib/credits/deduct';
import { InsufficientCreditsError } from '@/lib/credits/errors';
import { withApiLogging } from '@/lib/logging/api';
import { generateFluxImage, IMAGE_PRESETS } from '@/lib/fal/flux';

const BodySchema = z.object({
    prompt: z.string().min(1).max(2000),
    preset: z.enum(['short_vertical', 'short_square', 'thumbnail']).optional(),
    count: z.number().int().min(1).max(4).optional().default(1),
    seed: z.number().optional(),
}).strict();

async function handleImageGeneration(req: Request) {
    let userId: string | null = null;
    try {
        userId = await validateUserAuthentication();
    } catch (e) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const json = await req.json();
        const parsed = BodySchema.safeParse(json);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request body', issues: parsed.error.flatten() }, { status: 400 });
        }

        const { prompt, preset, count, seed } = parsed.data;
        const feature = 'fal_image_generation';
        const quantity = count;

        // 1. Validate Credits
        try {
            await validateCreditsForFeature(userId, feature, quantity);
            await deductCreditsForFeature({ clerkUserId: userId, feature, quantity, details: { prompt: prompt.slice(0, 50) } });
        } catch (e) {
            if (e instanceof InsufficientCreditsError) {
                return NextResponse.json({ error: 'insufficient_credits', required: e.required, available: e.available }, { status: 402 });
            }
            throw e;
        }

        // 2. Generate Image
        try {
            const output = await generateFluxImage({
                prompt,
                image_size: preset ? (IMAGE_PRESETS[preset] as any) : 'portrait_16_9',
                num_images: count,
                seed,
            });

            return NextResponse.json(output);
        } catch (e) {
            console.error('[fal-image] generation failed', e);
            // Refund credits on failure
            await refundCreditsForFeature({ clerkUserId: userId, feature, quantity, reason: 'generation_failed' });
            return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
        }
    } catch (e) {
        console.error('[fal-image] unexpected error', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const POST = withApiLogging(handleImageGeneration, {
    method: 'POST',
    route: '/api/ai/fal/image',
    feature: 'fal_image',
});
