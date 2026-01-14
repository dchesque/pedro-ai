import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { isAdmin } from '@/lib/admin-utils';
import { SYSTEM_PROMPTS_CONFIG } from '@/lib/system-prompts-config';

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        // TODO: Adicionar checagem de role admin se necessário
        if (!userId || !(await isAdmin(userId))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const module = searchParams.get('module');
        const search = searchParams.get('search');

        const where: any = {};

        // Filtro por módulo
        if (module && module !== 'todos') {
            where.module = module;
        }

        // Filtro por busca
        if (search) {
            where.OR = [
                { key: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // @ts-ignore
        let prompts = await db.systemPrompt.findMany({
            where,
            orderBy: [
                { module: 'asc' },
                { key: 'asc' }
            ]
        });

        // Auto-seed missing prompts (Sync bank with config)
        if (prompts.length < SYSTEM_PROMPTS_CONFIG.length && !search && (!module || module === 'todos')) {
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

            // Re-fetch after seeding if we were showing all
            // @ts-ignore
            prompts = await db.systemPrompt.findMany({
                where,
                orderBy: [
                    { module: 'asc' },
                    { key: 'asc' }
                ]
            });
        }

        // Agrupar por módulo para facilitar renderização
        const grouped = prompts.reduce((acc: any, prompt: any) => {
            const mod = prompt.module || 'geral';
            if (!acc[mod]) acc[mod] = [];
            acc[mod].push(prompt);
            return acc;
        }, {});

        return NextResponse.json({
            prompts,
            grouped,
            modules: Object.keys(grouped)
        });
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
