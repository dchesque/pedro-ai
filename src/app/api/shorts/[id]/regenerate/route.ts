import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { regenerateScript } from "@/lib/shorts/pipeline"; // Assuming this exists or using generateScript
import { withApiLogging } from "@/lib/logging/api";

async function handlePost(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const short = await db.short.findUnique({
            where: { id },
        });

        if (!short) {
            return NextResponse.json({ error: "Short not found" }, { status: 404 });
        }

        // Since we use Clerk ID in short table "clerkUserId" usually, but auth() returns clerk userId.
        // Also short.userId is internal DB ID.
        // Let's verify by finding user first.
        // However, existing pattern checks user via db.user.findUnique({ clerkId }). 
        // Shorts are linked to internal userId.

        // For safety, let's verify via internal userId.
        const user = await db.user.findUnique({ where: { clerkId: userId } });
        if (!user || user.id !== short.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Call regeneration pipeline
        // This will reset status to DRAFT or similar and trigger generation
        const updatedScript = await regenerateScript(id);

        return NextResponse.json({ success: true, script: updatedScript });
    } catch (error) {
        console.error("Error regenerating short:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export const POST = withApiLogging(handlePost, {
    method: 'POST',
    route: '/api/shorts/[id]/regenerate',
    feature: 'script_regeneration' as any
})
