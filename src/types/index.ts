export interface Question {
  id: string
  text: string
  options: string[]
  category: string
  correctAnswerIndex: number | null
  lockedAt: string | null
  displayOrder: number
  isActive: boolean
}

export interface Guest {
  id: string
  name: string
}

export interface Submission {
  id: string
  guestId: string
  questionId: string
  selectedOptionIndex: number
  createdAt: string
}

export interface QuestionStats {
  questionId: string
  optionCounts: number[]
  totalResponses: number
  percentages: number[]
}
