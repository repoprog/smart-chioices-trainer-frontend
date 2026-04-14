import { useCallback, useMemo } from 'react'
import { CustomControls } from './CustomControls.jsx'
import { Panel } from '@xyflow/react'
import {
  ReactFlow,
  Background,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { edgeTypes } from './edges/index.js'
import { nodeTypes } from './nodes/index.js'
import { useTreeStore } from '../store/useTreeStore.js'
import { StageHeaders} from './StageHeaders.jsx'
import { TreeToolbar } from './TreeToolbar.jsx'

export function TreeCanvas() {
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

  // Zaktualizowany onInit
  const onInit = useCallback((rf) => {
    requestAnimationFrame(() =>
      rf.fitView({
        padding: 0.3, // <--- Czyste, bezpieczne 10% marginesu
        includeHiddenNodes: false,
      })
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
    <div 
      id="tree-canvas-container" 
      className="relative flex h-full min-h-[560px] w-full flex-1 flex-col rounded-xl border border-border bg-background shadow-sm transition-colors"
    >
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
          fitView 
          fitViewOptions={{ 
          padding: 0.3, 
        includeHiddenNodes: false,
          }}
        >
          <StageHeaders />
          <Background
            id="tree-bg"
            gap={20}
            size={1}
            color="var(--border)"
            className="dark:opacity-30 transition-opacity"
          />
          <CustomControls />
          <MiniMap
            className="!rounded-md !border-border !bg-muted/50"
            maskColor="var(--muted)"
            nodeStrokeWidth={1}
            nodeColor={(n) => {
              if (n.type === 'decision') return 'var(--card)'
              if (n.type === 'chance') return 'var(--card)'
              if (n.type === 'terminal') return 'var(--card)'
              return 'var(--muted)'
            }}
          />
          <TreeToolbar />
          <Panel position="bottom-left" className="pointer-events-none m-4 mb-[4.5rem] hide-on-export">
            <div className=" ml-16 flex items-center gap-4 rounded border border-border bg-card/95 px-3 py-2 font-sans text-[10px] text-muted-foreground shadow-sm backdrop-blur-sm transition-colors leading-none">
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 border border-foreground bg-card transition-colors"
                  aria-hidden
                />
                Decyzja
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border border-foreground bg-card transition-colors"
                  aria-hidden
                />
                Niepewność
              </span>
              <span className="flex items-center gap-1.5">
                <svg 
                  className="h-2.5 w-2.5 overflow-visible" 
                  viewBox="0 0 44 44" 
                  aria-hidden
                >
                  <polygon 
                    points="2,2 42,22 2,42" 
                    className="fill-card stroke-foreground transition-colors" 
                    strokeWidth="4" 
                    strokeLinejoin="round" 
                  />
                </svg>
                Konsekwencja
              </span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  )
}