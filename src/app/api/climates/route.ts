import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@clerk/nextjs/server"
import { validateClimateConfiguration } from "@/lib/climate/guard-rails"
import { EMOTIONAL_STATE_PROMPTS, REVELATION_DYNAMIC_PROMPTS, NARRATIVE_PRESSURE_PROMPTS } from "@/lib/climate/behavior-mapping"

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { clerkId: clerkUserId }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const climates = await db.climate.findMany({
            where: {
                OR: [
                    { isSystem: true },
                    { userId: user.id }
                ],
            },
            orderBy: [
                { isSystem: 'desc' },
                { name: 'asc' }
            ]
        })

        // Add labels, icons and type for frontend
        const serializedClimates = climates.map(climate => {
            const emotionalDetails = EMOTIONAL_STATE_PROMPTS[climate.emotionalState]
            const revelationDetails = REVELATION_DYNAMIC_PROMPTS[climate.revelationDynamic]
            const pressureDetails = NARRATIVE_PRESSURE_PROMPTS[climate.narrativePressure]

            return {
                ...climate,
                type: climate.isSystem ? 'system' : 'personal',
                emotionalDetails,
                revelationDetails,
                pressureDetails
            }
        })

        return NextResponse.json({ climates: serializedClimates })
    } catch (error) {
        console.error("Error fetching climates:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth()
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { clerkId: clerkUserId }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const body = await request.json()
        const { name, icon, fromAgent, agentOutput } = body

        let dataToSave: any = {}

        if (fromAgent && agentOutput) {
            dataToSave = {
                name,
                icon: icon || '🎭',
                description: agentOutput.description,
                emotionalState: agentOutput.emotionalState,
                revelationDynamic: agentOutput.revelationDynamic,
                narrativePressure: agentOutput.narrativePressure,
                isSystem: false,
                userId: user.id
            }
        } else {
            const {
                description,
                emotionalState,
                revelationDynamic,
                narrativePressure,
                promptFragment,
                behaviorPreview
            } = body

            if (!name || !emotionalState || !revelationDynamic || !narrativePressure) {
                return NextResponse.json(
                    { error: "Missing required fields" },
                    { status: 400 }
                )
            }

            // Validate combination with guard-rails but respect overrides
            const { corrected } = validateClimateConfiguration({
                emotionalState,
                revelationDynamic,
                narrativePressure // Pass original pressure to check validity
            })

            // Trust the frontend provided pressure if it exists, otherwise use corrected default
            const finalNarrativePressure = narrativePressure || corrected.narrativePressure

            dataToSave = {
                name,
                icon: icon || '🎭',
                description,
                emotionalState: corrected.emotionalState,
                revelationDynamic: corrected.revelationDynamic,
                narrativePressure: finalNarrativePressure,
                promptFragment,
                behaviorPreview,
                isSystem: false,
                userId: user.id
            }
        }

        const climate = await db.climate.create({
            data: dataToSave
        })

        return NextResponse.json({
            ...climate,
            type: 'personal' // Ensure consistency with GET/PUT responses if needed, though usually implicit
        })
    } catch (error) {
        console.error("Error creating climate:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
