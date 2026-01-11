export class FalClient {
    private apiKey: string;
    private baseUrl = 'https://queue.fal.run';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async run<T>(model: string, input: any, options: { timeout?: number; pollingInterval?: number } = {}): Promise<T> {
        const { timeout = 60000, pollingInterval = 2000 } = options;
        const startTime = Date.now();

        // 1. Submit request to queue
        const submitRes = await fetch(`${this.baseUrl}/${model}`, {
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

        // 2. Polling for result
        while (Date.now() - startTime < timeout) {
            const statusRes = await fetch(`${this.baseUrl}/${model}/requests/${request_id}/status`, {
                headers: { Authorization: `Key ${this.apiKey}` },
            });

            if (!statusRes.ok) {
                throw new Error(`Fal API error (status): ${statusRes.status}`);
            }

            const { status } = await statusRes.json();

            if (status === 'COMPLETED') {
                const resultRes = await fetch(`${this.baseUrl}/${model}/requests/${request_id}`, {
                    headers: { Authorization: `Key ${this.apiKey}` },
                });
                if (!resultRes.ok) {
                    throw new Error(`Fal API error (result): ${resultRes.status}`);
                }
                return await resultRes.json();
            }

            if (status === 'FAILED') {
                throw new Error('Fal API generation failed');
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
