export class FalClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    // Modo síncrono (para modelos rápidos como Flux Schnell)
    async run<T>(model: string, input: any, options: { timeout?: number } = {}): Promise<T> {
        const { timeout = 60000 } = options;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // Usar endpoint síncrono diretamente
            const res = await fetch(`https://fal.run/${model}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Key ${this.apiKey}`,
                },
                body: JSON.stringify(input),
                signal: controller.signal,
            });

            if (!res.ok) {
                const error = await res.text();
                throw new Error(`Fal API error: ${res.status} ${error}`);
            }

            return await res.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    // Modo assíncrono (para modelos lentos como Kling Video)
    async runAsync<T>(model: string, input: any, options: { timeout?: number; pollingInterval?: number } = {}): Promise<T> {
        const { timeout = 300000, pollingInterval = 2000 } = options;
        const startTime = Date.now();

        // 1. Submit to queue
        const submitRes = await fetch(`https://queue.fal.run/${model}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Key ${this.apiKey}`,
            },
            body: JSON.stringify(input),
        });

        if (!submitRes.ok) {
            const error = await submitRes.text();
            throw new Error(`Fal API error (submit): ${submitRes.status} ${error}`);
        }

        const { request_id } = await submitRes.json();

        // 2. Poll for result
        while (Date.now() - startTime < timeout) {
            const resultRes = await fetch(`https://queue.fal.run/${model}/requests/${request_id}`, {
                headers: { Authorization: `Key ${this.apiKey}` },
            });

            if (resultRes.status === 200) {
                return await resultRes.json();
            }

            if (resultRes.status !== 202) {
                const error = await resultRes.text();
                throw new Error(`Fal API error (poll): ${resultRes.status} ${error}`);
            }

            await new Promise((resolve) => setTimeout(resolve, pollingInterval));
        }

        throw new Error('Fal API timeout');
    }
}

let falClientInstance: FalClient | null = null;

export function getFalClient() {
    if (!falClientInstance) {
        const apiKey = process.env.FAL_API_KEY;
        if (!apiKey) {
            throw new Error('Missing FAL_API_KEY');
        }
        falClientInstance = new FalClient(apiKey);
    }
    return falClientInstance;
}
