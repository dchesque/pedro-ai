import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Next.js 15 params are promises
) {
    try {
        const { id } = await params;
        const { userId } = await auth();

        const tone = await db.tone.findUnique({
            where: { id },
        });

        if (!tone) {
            return NextResponse.json({ error: "Tone not found" }, { status: 404 });
        }

        // Check visibility: System tones are public, Personal tones need ownership
        if (!tone.isSystem && tone.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json({
            ...tone,
            type: tone.isSystem ? 'system' : 'personal'
        });
    } catch (error) {
        console.error("Error fetching tone:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, icon, description, promptFragment } = body;

        // Verify ownership and that it's NOT a system tone
        const existingTone = await db.tone.findUnique({
            where: { id },
        });

        if (!existingTone) {
            return NextResponse.json({ error: "Tone not found" }, { status: 404 });
        }

        if (existingTone.isSystem) {
            return NextResponse.json(
                { error: "Cannot modify system tones" },
                { status: 403 }
            );
        }

        if (existingTone.userId !== userId) {
            return NextResponse.json(
                { error: "You can only modify your own tones" },
                { status: 403 }
            );
        }

        const updatedTone = await db.tone.update({
            where: { id },
            data: {
                name,
                icon,
                description,
                promptFragment,
            },
        });

        return NextResponse.json(updatedTone);
    } catch (error) {
        console.error("Error updating tone:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const existingTone = await db.tone.findUnique({
            where: { id },
        });

        if (!existingTone) {
            return NextResponse.json({ error: "Tone not found" }, { status: 404 });
        }

        if (existingTone.isSystem) {
            return NextResponse.json(
                { error: "Cannot delete system tones" },
                { status: 403 }
            );
        }

        if (existingTone.userId !== userId) {
            return NextResponse.json(
                { error: "You can only delete your own tones" },
                { status: 403 }
            );
        }

        await db.tone.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting tone:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
