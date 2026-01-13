import { db as prisma } from '@/lib/db';

export async function getSystemPrompt(key: string, defaultTemplate: string): Promise<string> {
    try {
        // Tenta buscar do banco
        // @ts-ignore - SystemPrompt pode não existir no client antigo até restart
        const prompt = await prisma.systemPrompt.findUnique({
            where: { key }
        });

        if (prompt) {
            return prompt.template;
        }

        // Se não existir, tenta criar (Auto-seeding on demand)
        try {
            // @ts-ignore
            await prisma.systemPrompt.create({
                data: {
                    key,
                    template: defaultTemplate,
                    module: key.startsWith('STYLE') ? 'STYLE' : 'CLIMATE',
                    description: `Auto-generated prompt for ${key}`
                }
            });
        } catch (e) {
            // Ignora erro de criação concorrente
            console.warn(`Could not auto-seed prompt ${key}`, e);
        }

        return defaultTemplate;
    } catch (error) {
        console.error(`Error fetching system prompt ${key}`, error);
        return defaultTemplate;
    }
}
