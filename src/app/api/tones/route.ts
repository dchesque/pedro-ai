import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        const tones = await db.tone.findMany({
            where: {
                OR: [
                    { isSystem: true },
                    { userId: userId || "undefined_user" } // If no user, only system tones match (userId null is handled by isSystem)
                    // Actually, we want system tones (isSystem: true) AND user tones if userId is present.
                    // Prisma OR logic:
                    // OR: [ { isSystem: true }, { userId: userId } ]
                ],
            },
            orderBy: [
                { isSystem: 'desc' }, // System first
                { name: 'asc' }
            ]
        });

        // Add type field for frontend usage
        const serializedTones = tones.map(tone => ({
            ...tone,
            type: tone.isSystem ? 'system' : 'personal'
        }));

        return NextResponse.json({ tones: serializedTones });
    } catch (error) {
        console.error("Error fetching tones:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, icon, description, promptFragment } = body;

        if (!name || !promptFragment) {
            return NextResponse.json(
                { error: "Name and promptFragment are required" },
                { status: 400 }
            );
        }

        const tone = await db.tone.create({
            data: {
                name,
                icon,
                description,
                promptFragment,
                isSystem: false,
                userId
            }
        });

        return NextResponse.json({
            ...tone,
            type: 'personal' // It's always personal if created via API
        });
    } catch (error) {
        console.error("Error creating tone:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
