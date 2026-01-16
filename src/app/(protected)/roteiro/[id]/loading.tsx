import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function RoteiroLoading() {
    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Summary Card Skeleton */}
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                            <div className="space-y-4">
                                <Skeleton className="h-40 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Slider Skeleton */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                        <div className="flex gap-4 overflow-hidden">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-80 w-[180px] shrink-0 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Detail Panel Skeleton */}
                    <Card className="h-full">
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Skeleton className="aspect-[9/16] w-full rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
