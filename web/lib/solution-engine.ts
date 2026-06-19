export interface BusinessSystem {
name: string
purpose: string
entities: string[]
workflows: string[]
metrics: string[]
}

export interface SolutionModel {
domain: string
businessType: string

userProblems: string[]
businessGoals: string[]

systems: BusinessSystem[]
}

export interface SolutionPack {
id: string
name: string
domains: string[]
keywords: string[]
solution: SolutionModel
}

export class SolutionEngine {
constructor(private packs: SolutionPack[]) {}

detect(prompt: string): SolutionModel | null {
const lower = prompt.toLowerCase()

const scored = this.packs
  .map(pack => ({
    pack,
    score: pack.keywords.reduce((acc, keyword) => {
      return lower.includes(keyword.toLowerCase()) ? acc + 1 : acc
    }, 0)
  }))
  .sort((a, b) => b.score - a.score)

if (!scored.length || scored[0].score === 0) {
  return null
}

return scored[0].pack.solution

}
}
