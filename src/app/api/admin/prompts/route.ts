import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-utils';
import { SYSTEM_PROMPTS_CONFIG } from '@/lib/system-prompts-config';

export async function GET() {
    try {
        const { userId } = await auth();
        // TODO: Adicionar checagem de role admin se necessário
        if (!userId || !(await isAdmin(userId))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // @ts-ignore
        let prompts = await db.systemPrompt.findMany({
            orderBy: { key: 'asc' }
        });

        // Auto-seed missing prompts (Sync bank with config)
        if (prompts.length < SYSTEM_PROMPTS_CONFIG.length) {
            for (const config of SYSTEM_PROMPTS_CONFIG) {
                // @ts-ignore
                await db.systemPrompt.upsert({
                    where: { key: config.key },
                    update: {}, // Não sobrescreve se já existe
                    create: {
                        key: config.key,
                        template: config.defaultTemplate,
                        module: config.module,
                        description: config.description
                    }
                });
            }

            // Re-fetch after seeding
            // @ts-ignore
            prompts = await db.systemPrompt.findMany({
                orderBy: { key: 'asc' }
            });
        }

        return NextResponse.json(prompts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId || !(await isAdmin(userId))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, template } = body;

        if (!id || template === undefined) {
            return NextResponse.json({ error: 'ID e template são obrigatórios' }, { status: 400 });
        }

        // @ts-ignore
        const updated = await db.systemPrompt.update({
            where: { id },
            data: { template }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
