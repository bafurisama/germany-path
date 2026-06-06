export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped'

export type NodeCategory =
  | 'registration'
  | 'finance'
  | 'insurance'
  | 'legal'
  | 'language'
  | 'integration'
  | 'milestone'

export interface PathNode {
  id: string
  title: string
  category: NodeCategory
  stage: 1 | 2 | 3 | 4 | 5
  description: string
  whyItMatters: string
  howTo: string
  typicalDuration?: string
  dependencies: string[]
  unlocks: string[]
  isOptional?: boolean
  countdownDays?: number // if it has a deadline concept
  applicableVisaTypes?: string[] // null means all
  officialLink?: string
}

export interface Stage {
  id: 1 | 2 | 3 | 4 | 5
  title: string
  subtitle: string
  description: string
  color: string
  accentColor: string
}

export interface UserProfile {
  id: string
  email: string
  nationality: string
  visaType: string
  city: string
  maritalStatus: string
  arrivalDate: string
  employmentStatus: string
  hasAnmeldung: boolean
  hasHealthInsurance: boolean
  hasTaxId: boolean
  hasBankAccount: boolean
  hasResidencePermit: boolean
  hasSocialSecurityNumber: boolean
  germanLevel: string
  onboardingCompleted: boolean
  createdAt: string
}

export interface UserNodeState {
  userId: string
  nodeId: string
  status: NodeStatus
  startedAt?: string
  completedAt?: string
  notes?: string
}

export interface ComputedProgress {
  totalNodes: number
  completedNodes: number
  inProgressNodes: number
  availableNodes: number
  percentage: number
  currentStage: 1 | 2 | 3 | 4 | 5
  nextCriticalNode: PathNode | null
  prMonthsRemaining: number | null
  citizenshipMonthsRemaining: number | null
}
