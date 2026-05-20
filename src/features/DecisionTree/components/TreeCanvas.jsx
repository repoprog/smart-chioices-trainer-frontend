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
import { NODE_TYPES } from '../../../constants/decisionTypes';

// ZMIANA: Dodajemy opcjonalny prop readOnlyData
export function TreeCanvas({ readOnlyData = null }) {
  // Jeśli dostarczono readOnlyData (tryb publiczny), omijamy nasłuchiwanie na store
  const isReadOnly = !!readOnlyData;

  const storeNodes = useTreeStore((s) => s.nodes);
  const storeEdges = useTreeStore((s) => s.edges);
  const storeWinningPath = useTreeStore((s) => s.winningPath);
  const isPreviewMode = useTreeStore((s) => s.isPreviewMode);

  // ZMIANA: Logika wyboru danych: albo ze Store (normalna praca), albo z Propsa (publiczny link)
  const baseNodes = isReadOnly ? (readOnlyData.nodes || []) : storeNodes;
  const baseEdges = isReadOnly ? (readOnlyData.edges || []) : storeEdges;
  const rawWinningPath = isReadOnly ? (readOnlyData.winningPath || []) : storeWinningPath;
  const activePreviewMode = isReadOnly ? true : isPreviewMode; // ReadOnly to na sztywno zablokowany edytor

  const winningPath = useMemo(() => {
    return rawWinningPath instanceof Set 
      ? rawWinningPath 
      : new Set(rawWinningPath || []);
  }, [rawWinningPath]);
  
  const nodes = useMemo(() => {
    return baseNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: winningPath.has(node.id),
      },
    }));
  }, [baseNodes, winningPath]);

  const edges = useMemo(() => {
    return baseEdges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        isHighlighted: winningPath.has(edge.id),
      },
    }));
  }, [baseEdges, winningPath]);

  const onInit = useCallback((rf) => {
    requestAnimationFrame(() =>
      rf.fitView({
        padding: 0.3, 
        includeHiddenNodes: false,
      })
    )
  }, []);

  const onNodesChange = useCallback((changes) => {
    if (isReadOnly) return; // BLOKADA: W trybie read-only ignorujemy zdarzenia

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
  }, [isReadOnly]);

  const onEdgesChange = useCallback((changes) => {
    if (isReadOnly) return; // BLOKADA: W trybie read-only ignorujemy zdarzenia

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
  }, [isReadOnly]);

return (
    <div 
      id="tree-canvas-container" 
      className={`relative flex-1 w-full h-full min-h-[560px] bg-background transition-colors ${
        activePreviewMode ? "opacity-90 grayscale-[0.1]" : ""
      }`}
    >
      {/* --- MAGICZNY CSS SNAJPER --- */}
      {/* Odbiera kliknięcia tylko elementom na płótnie, przepuszczając je do tła */}
      {activePreviewMode && (
        <style>{`
          .react-flow__node *,
          .react-flow__edgelabel-renderer *,
          .react-flow__viewport-portal * {
            pointer-events: none !important;
          }
        `}</style>
      )}

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
          
          /* --- NATYWNE BLOKADY REACT FLOW --- */
          nodesDraggable={!activePreviewMode}
          nodesConnectable={!activePreviewMode}
          elementsSelectable={!activePreviewMode}

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
          {/* ZMIANA: Nagłówki i legenda wyświetlają się, ale upewnijmy się że działają z readOnlyData, jeśli tego używają */}
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
              if (n.type === NODE_TYPES.DECISION) return 'var(--card)'
              if (n.type === NODE_TYPES.CHANCE) return 'var(--card)'
              if (n.type === NODE_TYPES.TERMINAL) return 'var(--card)'
              return 'var(--muted)'
            }}
          />
          
          {/* ZMIANA: Pasek narzędziowy pokazujemy TYLKO jeśli NIE jesteśmy w trybie publicznego linku */}
          {!isReadOnly && <TreeToolbar />}
          <TreeLegend />
        </ReactFlow>
      </div>
    </div>
  )
}