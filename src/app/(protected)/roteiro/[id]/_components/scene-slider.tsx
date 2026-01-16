'use client'

import React from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SceneCard } from "./scene-card"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface SceneSliderProps {
    scenes: any[]
    selectedIndex: number
    onSelectScene: (index: number) => void
}

export function SceneSlider({ scenes, selectedIndex, onSelectScene }: SceneSliderProps) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null)

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 200
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    return (
        <div className="relative group">
            {/* Navigation Buttons */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-lg border border-border/50"
                    onClick={() => scroll('left')}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>

            <div className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full shadow-lg border border-border/50"
                    onClick={() => scroll('right')}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Main Slider Container */}
            <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <AnimatePresence mode="popLayout">
                    {scenes.map((scene, index) => (
                        <motion.div
                            key={scene.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="snap-start"
                        >
                            <SceneCard
                                scene={scene}
                                index={index}
                                isSelected={selectedIndex === index}
                                onClick={() => onSelectScene(index)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Position Indicators */}
            <div className="flex justify-center gap-1.5 mt-2">
                {scenes.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => onSelectScene(index)}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            index === selectedIndex
                                ? "w-6 bg-primary"
                                : "w-1.5 bg-border hover:bg-muted-foreground/30"
                        )}
                        aria-label={`Ir para cena ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    )
}
