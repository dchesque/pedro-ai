import { prisma } from '@/lib/db';

export async function getPromptTemplate(key: string): Promise<string | null> {
    const prompt = await prisma.systemPrompt.findUnique({
        where: { key }
    });

    return prompt?.template || null;
}

export function interpolateVariables(template: string, variables: Record<string, string>): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
        // Handle simple {{key}}
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);

        // Handle conditional {{#if key}}...{{/if}}
        // Captures content between tags
        const ifRegex = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{/if}}`, 'g');
        result = result.replace(ifRegex, value ? '$1' : '');
    }

    // Cleanup remaining unused conditionals (where variable was false/undefined)
    // Matches {{#if ANY_WORD}}...{{/if}}
    result = result.replace(/{{#if \w+}}[\s\S]*?{{\/if}}/g, '');

    return result;
}
