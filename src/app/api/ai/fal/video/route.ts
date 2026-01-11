import { NextResponse } from 'next/server';
import { z } from 'zod';
import { validateUserAuthentication } from '@/lib/auth-utils';
import { validateCreditsForFeature, deductCreditsForFeature, refundCreditsForFeature } from '@/lib/credits/deduct';
import { InsufficientCreditsError } from '@/lib/credits/errors';
import { withApiLogging } from '@/lib/logging/api';
import { generateKlingVideo } from '@/lib/fal/kling';

const BodySchema = z.object({
    prompt: z.string().min(1).max(2000),
    image_url: z.string().url().optional(),
    duration: z.enum(['5', '10']).optional().default('5'),
    aspect_ratio: z.enum(['16:9', '9:16', '1:1']).optional().default('9:16'),
    negative_prompt: z.string().max(500).optional(),
}).strict();

async function handleVideoGeneration(req: Request) {
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

        const { prompt, image_url, duration, aspect_ratio, negative_prompt } = parsed.data;
        const feature = 'fal_video_generation';
        const quantity = parseInt(duration); // 1 credit per second

        // 1. Validate Credits
        try {
            await validateCreditsForFeature(userId, feature, quantity);
            await deductCreditsForFeature({ clerkUserId: userId, feature, quantity, details: { prompt: prompt.slice(0, 50), duration } });
        } catch (e) {
            if (e instanceof InsufficientCreditsError) {
                return NextResponse.json({ error: 'insufficient_credits', required: e.required, available: e.available }, { status: 402 });
            }
            throw e;
        }

        // 2. Generate Video
        try {
            const output = await generateKlingVideo({
                prompt,
                image_url,
                duration: duration as '5' | '10',
                aspect_ratio: aspect_ratio as any,
                negative_prompt,
            });

            return NextResponse.json({
                ...output,
                duration: quantity,
            });
        } catch (e) {
            console.error('[fal-video] generation failed', e);
            // Refund credits on failure
            await refundCreditsForFeature({ clerkUserId: userId, feature, quantity, reason: 'generation_failed' });
            return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 });
        }
    } catch (e) {
        console.error('[fal-video] unexpected error', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export const POST = withApiLogging(handleVideoGeneration, {
    method: 'POST',
    route: '/api/ai/fal/video',
    feature: 'fal_video',
});
