/** BFS od korzenia; numery tylko dla decision + chance, kolejność jak w Smart Choices (poziomami). */

export function renumberDecisionAndChanceNodes(nodes, edges) {
  const hasIncoming = new Set()
  for (const e of edges) hasIncoming.add(e.target)

  const roots = nodes.filter((n) => !hasIncoming.has(n.id))
  const root = roots[0]
  if (!root) return nodes

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const outgoing = new Map()
  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, [])
    outgoing.get(e.source).push(e)
  }

  for (const [, list] of outgoing) {
    list.sort((a, b) => {
      const na = byId.get(a.target)
      const nb = byId.get(b.target)
      const dy = (na?.position?.y ?? 0) - (nb?.position?.y ?? 0)
      if (dy !== 0) return dy
      const dx = (na?.position?.x ?? 0) - (nb?.position?.x ?? 0)
      return dx
    })
  }

  const orderedIds = []
  const visited = new Set()
  const queue = [root.id]

  while (queue.length) {
    const id = queue.shift()
    if (visited.has(id)) continue
    visited.add(id)
    const node = byId.get(id)
    if (!node) continue
    if (node.type === 'decision' || node.type === 'chance') {
      orderedIds.push(id)
    }
    for (const e of outgoing.get(id) ?? []) queue.push(e.target)
  }

  let n = 1
  const idToNumber = new Map()
  for (const id of orderedIds) idToNumber.set(id, n++)

  return nodes.map((node) => {
    if (node.type !== 'decision' && node.type !== 'chance') return node
    const num = idToNumber.get(node.id) ?? 0
    return {
      ...node,
      data: { ...node.data, nodeNumber: num },
    }
  })
}

export function collectDescendants(startId, edges) {
  const set = new Set()
  const q = [startId]
  while (q.length) {
    const id = q.shift()
    if (set.has(id)) continue
    set.add(id)
    for (const e of edges) {
      if (e.source === id) q.push(e.target)
    }
  }
  return set
}

let idCounter = 0
export function nextDomId(prefix) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}



/**
 * Numer wierzchołka (`data.nodeNumber`), który usunie `removeBranch` (korzeń usuwanego poddrzewa).
 * Dla terminala zwraca `null` — wtedy etykieta tylko „Usuń gałąź”.
 */
export function getNextRemovalTargetVertexNumber(parentId, nodes, edges) {
  const outgoing = edges.filter((e) => e.source === parentId)
  if (!outgoing.length) return null

  const byId = new Map(nodes.map((n) => [n.id, n]))
  const compareAsc = (a, b) => {
    const na = byId.get(a.target)
    const nb = byId.get(b.target)
    const dy = (na?.position?.y ?? 0) - (nb?.position?.y ?? 0)
    if (dy !== 0) return dy
    const dx = (na?.position?.x ?? 0) - (nb?.position?.x ?? 0)
    if (dx !== 0) return dx
    return a.target.localeCompare(b.target)
  }

  const sortedDesc = [...outgoing].sort((a, b) => -compareAsc(a, b))
  const victimEdge = sortedDesc[0]
  const target = byId.get(victimEdge.target)
  if (!target || target.type === 'terminal') return null

  const num = target.data?.nodeNumber
  if (typeof num !== 'number' || num < 1) return null
  return num
}

/** głębokość od korzenia (0 = decyzja początkowa); zakładamy drzewo spójne z jednym korzeniem */
export function computeDepthMap(nodes, edges) {
  const hasIncoming = new Set()
  for (const e of edges) hasIncoming.add(e.target)

  const roots = nodes.filter((n) => !hasIncoming.has(n.id))
  if (!roots.length) return new Map()

  const root = roots[0]
  const depth = new Map([[root.id, 0]])
  const queue = [root.id]
  const outgoing = new Map()
  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, [])
    outgoing.get(e.source).push(e.target)
  }

  while (queue.length) {
    const id = queue.shift()
    const d = depth.get(id) ?? 0
    for (const t of outgoing.get(id) ?? []) {
      if (!depth.has(t)) {
        depth.set(t, d + 1)
        queue.push(t)
      }
    }
  }

  return depth
}

export function getTreeMaxDepth(depthMap) {
  let m = 0
  for (const d of depthMap.values()) m = Math.max(m, d)
  return m
}

export function estimateNodeWidthPx(node) {
  if (!node) return 44
  if (node.type === 'terminal') return 110
  return 44
}

export function minNodeTopY(nodes) {
  if (!nodes.length) return 0
  let m = Infinity
  for (const n of nodes) m = Math.min(m, n.position.y)
  return Number.isFinite(m) ? m : 0
}

/** Wysokość pola Etap (h-8 + obramowanie), px w przestrzeni flow */
const STAGE_HEADER_INPUT_HEIGHT = 38
/** Minimalna luka między dolną krawędzią nagłówka a górną krawędzią najwyższego węzła */
const STAGE_HEADER_BASE_GAP = 68
/** Węzły w tym przedziale poniżej minY zwiększają dodatkowy odstęp (więcej gałęzi w górę) */
const STAGE_HEADER_CLUSTER_RANGE = 140
const STAGE_HEADER_CLUSTER_STEP = 14
const STAGE_HEADER_CLUSTER_MAX_EXTRA = 84

/**
 * Pozycja Y (górna krawędź) rzędu pól „Etap” — zawsze wyraźnie nad najwyższym węzłem;
 * przy większej liczbie węzłów blisko górnej krawędzi drzewa pasek idzie jeszcze wyżej.
 */
export function computeStageHeaderRowY(nodes) {
  if (!nodes.length) return -STAGE_HEADER_INPUT_HEIGHT - STAGE_HEADER_BASE_GAP

  const minTop = minNodeTopY(nodes)
  let cluster = 0
  for (const n of nodes) {
    if (n.position.y <= minTop + STAGE_HEADER_CLUSTER_RANGE) cluster += 1
  }
  const clusterExtra = Math.min(
    STAGE_HEADER_CLUSTER_MAX_EXTRA,
    Math.max(0, cluster - 1) * STAGE_HEADER_CLUSTER_STEP,
  )

  return (
    minTop -
    STAGE_HEADER_INPUT_HEIGHT -
    STAGE_HEADER_BASE_GAP -
    clusterExtra
  )
}

/**
 * Etap i (indeks 0..): krawędzie z głębokości i do i+1.
 * x / w w przestrzeni flow: poziomy zasięg odcinków (prawa krawędź źródła → lewa krawędź celu).
 */
export function computeStageHeaderBands(nodes, edges, labelCount) {
  if (!labelCount || !nodes.length) return []

  const depthMap = computeDepthMap(nodes, edges)
  const byId = new Map(nodes.map((n) => [n.id, n]))

  const bands = []
  for (let i = 0; i < labelCount; i++) {
    const fromDepth = i
    const toDepth = i + 1

    const edgeList = edges.filter(
      (e) =>
        depthMap.get(e.source) === fromDepth &&
        depthMap.get(e.target) === toDepth,
    )

    if (edgeList.length === 0) {
      const atTo = nodes.filter((n) => depthMap.get(n.id) === toDepth)
      if (atTo.length) {
        let minx = Infinity
        let maxx = -Infinity
        for (const n of atTo) {
          const w = estimateNodeWidthPx(n)
          minx = Math.min(minx, n.position.x)
          maxx = Math.max(maxx, n.position.x + w)
        }
        bands.push({ x: minx, w: Math.max(maxx - minx, 48) })
      } else {
        const prev = bands[bands.length - 1]
        const px = prev ? prev.x + Math.max(prev.w, 48) + 16 : i * 200
        bands.push({ x: px, w: 128 })
      }
      continue
    }

    let minLeft = Infinity
    let maxRight = -Infinity
    for (const e of edgeList) {
      const src = byId.get(e.source)
      const tgt = byId.get(e.target)
      if (!src || !tgt) continue
      const sw = estimateNodeWidthPx(src)
      const segLeft = src.position.x + sw
      const segRight = tgt.position.x
      minLeft = Math.min(minLeft, segLeft)
      maxRight = Math.max(maxRight, segRight)
    }

    if (!Number.isFinite(minLeft) || !Number.isFinite(maxRight)) {
      bands.push({ x: i * 200, w: 128 })
      continue
    }

    bands.push({
      x: minLeft,
      w: Math.max(maxRight - minLeft, 24),
    })
  }

  return bands
}

/** Nagłówki kolumn: indeks i = etap głębokości i+1 (pierwszy poziom dzieci korzenia → indeks 0) */
export function ensureColumnLabelsLength(labels, len) {
  const base = Array.isArray(labels) ? [...labels] : []
  while (base.length < len) base.push('')
  if (base.length > len) return base.slice(0, len)
  return base
}

export function getUniqueColumnXs(nodes) {
  const xs = nodes.map(n => n.position?.x || 0);
  const uniqueXs = [];
  
  xs.forEach(x => {
    if (!uniqueXs.some(ux => Math.abs(ux - x) < 150)) {
      uniqueXs.push(x);
    }
  });
  
  return uniqueXs.sort((a, b) => a - b);
}

