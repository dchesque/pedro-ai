import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { validateClimateConfiguration } from "@/lib/climate/guard-rails"
import { EMOTIONAL_STATE_PROMPTS, REVELATION_DYNAMIC_PROMPTS, NARRATIVE_PRESSURE_PROMPTS } from "@/lib/climate/behavior-mapping"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId } = await auth()

        const climate = await db.climate.findUnique({
            where: { id },
        })

        if (!climate) {
            return NextResponse.json({ error: "Climate not found" }, { status: 404 })
        }

        if (!climate.isSystem && climate.userId !== userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const emotionalDetails = EMOTIONAL_STATE_PROMPTS[climate.emotionalState]
        const revelationDetails = REVELATION_DYNAMIC_PROMPTS[climate.revelationDynamic]
        const pressureDetails = NARRATIVE_PRESSURE_PROMPTS[climate.narrativePressure]

        return NextResponse.json({
            ...climate,
            type: climate.isSystem ? 'system' : 'personal',
            emotionalDetails,
            revelationDetails,
            pressureDetails
        })
    } catch (error) {
        console.error("Error fetching climate:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, icon, description, emotionalState, revelationDynamic, narrativePressure, promptFragment } = body

        const existing = await db.climate.findUnique({
            where: { id },
        })

        if (!existing) {
            return NextResponse.json({ error: "Climate not found" }, { status: 404 })
        }

        if (existing.isSystem || existing.userId !== userId) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            )
        }

        // Validate combination
        const { corrected } = validateClimateConfiguration({
            emotionalState: emotionalState || existing.emotionalState,
            revelationDynamic: revelationDynamic || existing.revelationDynamic,
            narrativePressure: narrativePressure || existing.narrativePressure
        })

        const updated = await db.climate.update({
            where: { id },
            data: {
                name: name || existing.name,
                icon: icon || existing.icon,
                description: description !== undefined ? description : existing.description,
                emotionalState: corrected.emotionalState,
                revelationDynamic: corrected.revelationDynamic,
                narrativePressure: corrected.narrativePressure,
                hookType: corrected.hookType,
                closingType: corrected.closingType,
                promptFragment: promptFragment !== undefined ? promptFragment : existing.promptFragment,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Error updating climate:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const existing = await db.climate.findUnique({
            where: { id },
        })

        if (!existing || existing.isSystem || existing.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await db.climate.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting climate:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
