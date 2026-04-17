import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  MiniMap,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { CustomControls } from './CustomControls.jsx'
import { edgeTypes } from './edges/index.js'
import { nodeTypes } from './nodes/index.js'
import { useTreeStore } from '../store/useTreeStore.js'
import { StageHeaders } from './StageHeaders.jsx'
import { TreeToolbar } from './TreeToolbar.jsx'
import { TreeLegend } from './TreeLegend.jsx' 

export function TreeCanvas() {
  const allNodes = useTreeStore((s) => s.nodes)
  const allEdges = useTreeStore((s) => s.edges)
  const storeWinningPath = useTreeStore((s) => s.winningPath);

  const winningPath = useMemo(() => {
    return storeWinningPath instanceof Set 
      ? storeWinningPath 
      : new Set(storeWinningPath || []);
  }, [storeWinningPath]);
  

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
        padding: 0.3, 
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
    
      className="relative flex-1 w-full h-full min-h-[560px] bg-background transition-colors"
    >
      <div className="relative min-h-0 flex-1 h-full [&_.react-flow__node:hover]:!z-[10000] [&_.react-flow__node.selected]:!z-[9999] [&_.react-flow__node]:z-10">
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
          <TreeLegend />
        </ReactFlow>
      </div>
    </div>
  )

}