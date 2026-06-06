import { ComputedProgress, NodeStatus, PathNode, UserNodeState, UserProfile } from '@/types'
import { PATH_NODES, getNodeById } from './pathConfig'

export function computeAvailableNodes(
  nodeStates: Record<string, NodeStatus>,
  userProfile: UserProfile
): Record<string, NodeStatus> {
  const result: Record<string, NodeStatus> = { ...nodeStates }

  // Initialize all nodes as locked if not set
  PATH_NODES.forEach((node) => {
    if (!result[node.id]) {
      result[node.id] = 'locked'
    }
  })

  // Apply visa-type filtering
  PATH_NODES.forEach((node) => {
    if (
      node.applicableVisaTypes &&
      !node.applicableVisaTypes.includes(userProfile.visaType)
    ) {
      result[node.id] = 'locked'
    }
  })

  // Unlock nodes whose dependencies are all completed
  let changed = true
  let iterations = 0
  while (changed && iterations < 10) {
    changed = false
    iterations++
    PATH_NODES.forEach((node) => {
      if (result[node.id] === 'locked' || result[node.id] === 'available') {
        const allDepsMet = node.dependencies.every(
          (depId) => result[depId] === 'completed' || result[depId] === 'skipped'
        )
        if (allDepsMet && result[node.id] === 'locked') {
          result[node.id] = 'available'
          changed = true
        }
      }
    })
  }

  return result
}

export function computeProgress(
  nodeStates: Record<string, NodeStatus>,
  userProfile: UserProfile
): ComputedProgress {
  const resolvedStates = computeAvailableNodes(nodeStates, userProfile)

  const relevantNodes = PATH_NODES.filter(
    (node) =>
      !node.applicableVisaTypes ||
      node.applicableVisaTypes.includes(userProfile.visaType)
  )

  const totalNodes = relevantNodes.length
  const completedNodes = relevantNodes.filter(
    (n) => resolvedStates[n.id] === 'completed'
  ).length
  const inProgressNodes = relevantNodes.filter(
    (n) => resolvedStates[n.id] === 'in_progress'
  ).length
  const availableNodes = relevantNodes.filter(
    (n) => resolvedStates[n.id] === 'available'
  ).length

  const percentage = Math.round((completedNodes / totalNodes) * 100)

  // Determine current stage
  let currentStage: 1 | 2 | 3 | 4 | 5 = 1
  const stageCompletions = [1, 2, 3, 4, 5].map((stage) => {
    const stageNodes = relevantNodes.filter((n) => n.stage === stage)
    const completed = stageNodes.filter(
      (n) => resolvedStates[n.id] === 'completed'
    ).length
    return completed / (stageNodes.length || 1)
  })

  if (stageCompletions[0] >= 0.8) currentStage = 2
  if (stageCompletions[1] >= 0.8) currentStage = 3
  if (stageCompletions[2] >= 0.8) currentStage = 4
  if (stageCompletions[3] >= 0.8) currentStage = 5

  // Find next critical node (available, lowest stage, highest impact)
  const availableNodesList = relevantNodes
    .filter((n) => resolvedStates[n.id] === 'available')
    .sort((a, b) => {
      if (a.stage !== b.stage) return a.stage - b.stage
      return b.unlocks.length - a.unlocks.length // more unlocks = higher priority
    })

  const nextCriticalNode = availableNodesList[0] || null

  // Estimate PR months remaining
  let prMonthsRemaining: number | null = null
  const arrivalDate = userProfile.arrivalDate ? new Date(userProfile.arrivalDate) : null
  if (arrivalDate) {
    const monthsInGermany = Math.floor(
      (Date.now() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    if (userProfile.visaType === 'blue_card') {
      const hasB1 = resolvedStates['german_b1'] === 'completed'
      const targetMonths = hasB1 ? 21 : 33
      prMonthsRemaining = Math.max(0, targetMonths - monthsInGermany)
    } else {
      prMonthsRemaining = Math.max(0, 60 - monthsInGermany)
    }
  }

  // Estimate citizenship months
  let citizenshipMonthsRemaining: number | null = null
  if (arrivalDate) {
    const monthsInGermany = Math.floor(
      (Date.now() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )
    citizenshipMonthsRemaining = Math.max(0, 96 - monthsInGermany)
  }

  return {
    totalNodes,
    completedNodes,
    inProgressNodes,
    availableNodes,
    percentage,
    currentStage,
    nextCriticalNode,
    prMonthsRemaining,
    citizenshipMonthsRemaining,
  }
}

export function initializeNodeStatesFromOnboarding(
  profile: UserProfile
): Record<string, NodeStatus> {
  const states: Record<string, NodeStatus> = {}

  if (profile.hasAnmeldung) states['anmeldung'] = 'completed'
  if (profile.hasTaxId) states['tax_id'] = 'completed'
  if (profile.hasBankAccount) states['bank_account'] = 'completed'
  if (profile.hasHealthInsurance) states['health_insurance'] = 'completed'
  if (profile.hasResidencePermit) states['residence_permit'] = 'completed'
  if (profile.hasSocialSecurityNumber) states['social_security_number'] = 'completed'

  return states
}
