import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Configuração estática de módulos com metadados
const MODULE_CONFIG: Record<string, { name: string; icon: string; description: string }> = {
    roteirista: {
        name: 'Roteirista',
        icon: 'FileText',
        description: 'Prompts para criação e assistência de roteiros'
    },
    climas: {
        name: 'Climas',
        icon: 'Thermometer',
        description: 'Prompts para criação de climas narrativos'
    },
    estilos: {
        name: 'Estilos',
        icon: 'Palette',
        description: 'Prompts para criação de estilos visuais'
    },
    personagens: {
        name: 'Personagens',
        icon: 'Users',
        description: 'Prompts para criação de personagens'
    },
    imagens: {
        name: 'Imagens',
        icon: 'Image',
        description: 'Prompts para geração de imagens'
    },
    geral: {
        name: 'Geral',
        icon: 'Settings',
        description: 'Prompts genéricos do sistema'
    }
};

export async function GET() {
    // @ts-ignore
    const modulesWithCount = await db.systemPrompt.groupBy({
        by: ['module'],
        _count: { id: true }
    });

    const modules = modulesWithCount.map((m: any) => ({
        key: m.module || 'geral',
        count: m._count.id,
        ...MODULE_CONFIG[m.module || 'geral']
    }));

    // Ordenar: roteirista primeiro, geral por último
    const order = ['roteirista', 'climas', 'estilos', 'personagens', 'imagens', 'geral'];
    modules.sort((a: any, b: any) => {
        const idxA = order.indexOf(a.key);
        const idxB = order.indexOf(b.key);
        // Se não estiver na lista (idx -1), joga pro final antes do geral se possível, ou trata como genérico
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    return NextResponse.json({ modules });
}
