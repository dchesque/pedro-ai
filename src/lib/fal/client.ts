import { fal } from "@fal-ai/client";

// Configurar credenciais
fal.config({
    credentials: process.env.FAL_API_KEY,
});

// Modo síncrono (para modelos rápidos como Flux)
export async function runFal<T>(
    model: string,
    input: Record<string, unknown>
): Promise<T> {
    const result = await fal.run(model, { input });
    return result.data as T;
}

// Modo assíncrono com queue (para modelos lentos como Kling)
export async function runFalAsync<T>(
    model: string,
    input: Record<string, unknown>
): Promise<T> {
    const result = await fal.subscribe(model, {
        input,
        logs: true,
        onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
                console.log(`[fal] ${model}: in progress...`);
            }
        },
    });
    return result.data as T;
}

export { fal };
