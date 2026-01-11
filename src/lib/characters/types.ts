export interface CharacterTraits {
    age?: string
    gender?: 'male' | 'female' | 'other'
    hairColor?: string
    hairStyle?: string
    skinTone?: string
    eyeColor?: string
    clothing?: string
    accessories?: string
    bodyType?: string
    distinctiveFeatures?: string
}

export interface CharacterPromptData {
    traits: CharacterTraits
    promptDescription: string
}
