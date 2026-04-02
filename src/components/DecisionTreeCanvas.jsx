import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { edgeTypes } from '../edges'
import { nodeTypes } from '../nodes'
import { useTreeStore } from '../store/useTreeStore.js'
import { StageHeadersFlow } from './StageHeadersFlow.jsx'


export function DecisionTreeCanvas() {
  const allNodes = useTreeStore((s) => s.nodes)
  const allEdges = useTreeStore((s) => s.edges)
  const winningPath = useTreeStore((s) => s.winningPath);

  const nodes = useMemo(() => {
    return allNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: winningPath.has(node.id),
      },
    }));
  }, [allNodes, winningPath]);

  const edges = useMemo(() => {
    return allEdges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        isHighlighted: winningPath.has(edge.id),
      },
    }));
  }, [allEdges, winningPath]);


  const onInit = useCallback((rf) => {
    requestAnimationFrame(() =>
      rf.fitView({
        padding: { top: 0.22, x: 0.12, bottom: 0.12 },
      }),
    )
  }, [])

 const onNodesChange = useCallback((changes) => {

    const isNoise = changes.every(
      (c) => c.type === 'dimensions' || c.type === 'select' || c.type === 'position'
    );
    
    if (isNoise) {
      useTreeStore.temporal.getState().pause();
    }

    useTreeStore.setState((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));

    if (isNoise) {
      useTreeStore.temporal.getState().resume();
    }
  }, []);

  const onEdgesChange = useCallback((changes) => {
    
    const isNoise = changes.every((c) => c.type === 'select');

    if (isNoise) {
      useTreeStore.temporal.getState().pause();
    }

    useTreeStore.setState((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));

    if (isNoise) {
      useTreeStore.temporal.getState().resume();
    }
  }, []);

  return (
    <div className="relative flex h-full min-h-[560px] w-full flex-1 flex-col rounded-md border border-slate-300 bg-[#fafaf9] shadow-inner dark:border-slate-600 dark:bg-slate-900/40">
      <div className="relative min-h-0 flex-1 [&_.react-flow__node:hover]:!z-[10000] [&_.react-flow__node.selected]:!z-[9999] [&_.react-flow__node]:z-10">
        <ReactFlow
          className="h-full w-full"
          nodes={nodes}
          edges={edges}
          onInit={onInit}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'smartChoices' }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          minZoom={0.35}
          maxZoom={1.75}
          proOptions={{ hideAttribution: true }}
          elevateEdgesOnSelect={false}
          elevateNodesOnSelect={false}
        >
        <StageHeadersFlow />
        <Background
          id="tree-bg"
          gap={20}
          size={0.75}
          color="#d4d4d8"
          className="dark:!bg-slate-900/30"
        />
        <Controls
          showInteractive={false}
          className="!rounded-md !border-slate-300 !bg-white !shadow-sm dark:!border-slate-600 dark:!bg-slate-800"
        />
        <MiniMap
          className="!rounded-md !border-slate-300 !bg-stone-100 dark:!border-slate-600 dark:!bg-slate-800"
          maskColor="rgb(15 23 42 / 0.12)"
          nodeStrokeWidth={1}
          nodeColor={(n) => {
            if (n.type === 'decision') return '#ffffff'
            if (n.type === 'chance') return '#ffffff'
            if (n.type === 'terminal') return '#f5f5f4'
            return '#e7e5e4'
          }}
        />
        </ReactFlow>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-10 z-10 flex items-center gap-4 rounded border border-slate-300 bg-white/95 px-3 py-2 font-sans text-[10px] text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-300">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 border border-slate-900 bg-white"
            aria-hidden
          />
          Decyzja
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border border-slate-900 bg-white"
            aria-hidden
          />
          Niepewność
        </span>
      </div>
    </div>
  )
}
