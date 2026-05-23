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
import { NODE_TYPES, EVALUATION_MODES } from '../../../constants/decisionTypes';

import { getLayoutedElements, renumberDecisionAndChanceNodes, syncColumnLabels } from '../logic/treeUtils.js';
// ADDED: Mathematical engine to recover the winning path in Share mode
import { evaluateAndSetWinningPath } from '../logic/treeAlgorithms.js'; 

export function TreeCanvas({ readOnlyData = null, readOnlySimulationMode = false }) {
  const isReadOnly = !!readOnlyData;

  const storeNodes = useTreeStore((s) => s.nodes);
  const storeEdges = useTreeStore((s) => s.edges);
  const storeWinningPath = useTreeStore((s) => s.winningPath);
  const storeLabels = useTreeStore((s) => s.stageColumnLabels);
  const storeEvalMode = useTreeStore((s) => s.evaluationMode);
  
  const isPreviewMode = useTreeStore((s) => s.isPreviewMode);
  const isSimulationMode = useTreeStore((s) => s.isSimulationMode);

  const computedReadOnly = useMemo(() => {
    if (!isReadOnly) return null;
    
    const rawNodes = readOnlyData.nodes || [];
    const rawEdges = readOnlyData.edges || [];
    const rawLabels = readOnlyData.stageColumnLabels || readOnlyData.labels || [];
    const evalMode = readOnlyData.evaluationMode || EVALUATION_MODES.MAX;
    
    const layoutedNodes = getLayoutedElements(rawNodes, rawEdges);
    const renumbered = renumberDecisionAndChanceNodes(layoutedNodes, rawEdges);
    const stageColumnLabels = syncColumnLabels(renumbered, rawEdges, rawLabels);
    
    // Locally evaluate the tree to recover the winningPath
    const stateWithMath = evaluateAndSetWinningPath({
      nodes: renumbered,
      edges: rawEdges,
      evaluationMode: evalMode
    });
    
    return {
      nodes: stateWithMath.nodes,
      edges: stateWithMath.edges,
      labels: stageColumnLabels,
      evalMode: stateWithMath.evaluationMode,
      winningPath: stateWithMath.winningPath
    };
  }, [isReadOnly, readOnlyData]);

  const baseNodes = isReadOnly ? computedReadOnly.nodes : storeNodes;
  const baseEdges = isReadOnly ? computedReadOnly.edges : storeEdges;
  const stageLabels = isReadOnly ? computedReadOnly.labels : storeLabels;
  const evaluationMode = isReadOnly ? computedReadOnly.evalMode : storeEvalMode;
  
  // ESLINT FIX: Moving the entire path logic inside useMemo to avoid unnecessary memory allocations
  const winningPath = useMemo(() => {
    const rawPath = isReadOnly ? (computedReadOnly?.winningPath || []) : storeWinningPath;
    return rawPath instanceof Set 
      ? rawPath 
      : new Set(rawPath || []);
  }, [isReadOnly, computedReadOnly, storeWinningPath]);

  // activeVisualLockdown applies a gray overlay and blocks clicks via CSS (removed during simulation)
  const activeVisualLockdown = (isReadOnly && !readOnlySimulationMode) || isPreviewMode;
  // blockInteractions prevents dragging nodes and drawing edges
  const blockInteractions = isReadOnly || isPreviewMode;

  const nodes = useMemo(() => {
    return baseNodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isHighlighted: winningPath.has(node.id),
        isSimulationActive: isReadOnly ? readOnlySimulationMode : isSimulationMode,
        isSharedView: isReadOnly,
      },
    }));
  }, [baseNodes, winningPath, isReadOnly, readOnlySimulationMode, isSimulationMode]);

  const edges = useMemo(() => {
    return baseEdges.map((edge) => {
      const siblingCount = baseEdges.filter(e => e.source === edge.source).length;
      const sourceNode = baseNodes.find(n => n.id === edge.source);

      return {
        ...edge,
        type: 'smartChoices',
        data: {
          ...edge.data,
          isHighlighted: winningPath.has(edge.id),
          injectedSiblingCount: siblingCount,
          injectedSourceType: sourceNode?.type,
          injectedIsSharedView: isReadOnly, 
        },
      };
    });
  }, [baseEdges, baseNodes, winningPath, isReadOnly]);

  const onInit = useCallback((rf) => {
    requestAnimationFrame(() =>
      rf.fitView({
        padding: 0.3, 
        includeHiddenNodes: false,
      })
    )
  }, []);

  const onNodesChange = useCallback((changes) => {
    if (isReadOnly) return;
    
    // Protect history (Zundo) from being cluttered by visual noise
    const isNoise = changes.every(c => c.type === 'dimensions' || c.type === 'select' || c.type === 'position');
    if (isNoise) useTreeStore.temporal.getState().pause();
    
    // ARCHITECTURAL NOTE (OCC & isDirty):
    // We use direct setState instead of a dedicated store action.
    // This intentionally bypasses the dataVersion increment and setting isDirty = true.
    // Purely visual changes (drag, select, dimensions) represent "volatile state" 
    // that does not require immediate Auto-Save to the database 
    // and does not violate the business logic of the EMV model.
    useTreeStore.setState((state) => ({ nodes: applyNodeChanges(changes, state.nodes) }));
    
    if (isNoise) useTreeStore.temporal.getState().resume();
  }, [isReadOnly]);

  const onEdgesChange = useCallback((changes) => {
    if (isReadOnly) return;
    
    // Protect history (Zundo) from being cluttered by visual noise
    const isNoise = changes.every((c) => c.type === 'select');
    if (isNoise) useTreeStore.temporal.getState().pause();
    
    // ARCHITECTURAL NOTE (OCC & isDirty): 
    // Similarly to onNodesChange, we bypass the mutation tracking system 
    // for purely visual edge changes (e.g., selection).
    useTreeStore.setState((state) => ({ edges: applyEdgeChanges(changes, state.edges) }));
    
    if (isNoise) useTreeStore.temporal.getState().resume();
  }, [isReadOnly]);

return (
    <div 
      id="tree-canvas-container" 
      className={`relative flex-1 w-full h-full min-h-[560px] bg-background transition-colors ${
        activeVisualLockdown ? "opacity-90 grayscale-[0.1]" : ""
      }`}
    >
      {activeVisualLockdown && (
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
          nodesDraggable={!blockInteractions}
          nodesConnectable={!blockInteractions}
          elementsSelectable={!blockInteractions}
          minZoom={0.35}
          maxZoom={1.75}
          proOptions={{ hideAttribution: true }}
          elevateEdgesOnSelect={false}
          elevateNodesOnSelect={false}
          fitView 
          fitViewOptions={{ padding: 0.3, includeHiddenNodes: false }}
        >
          <StageHeaders 
            readOnlyNodes={isReadOnly ? nodes : null} 
            readOnlyEdges={isReadOnly ? edges : null} 
            readOnlyLabels={isReadOnly ? stageLabels : null} 
            readOnlyEvalMode={isReadOnly ? evaluationMode : null} 
          />
          <Background gap={20} size={1} color="var(--border)" className="dark:opacity-30 transition-opacity" />
          <CustomControls />
          <MiniMap
            className="!rounded-md !border-border !bg-muted/50"
            maskColor="var(--muted)"
            nodeStrokeWidth={1}
            nodeColor={(n) => {
              if (n.type === NODE_TYPES.DECISION || n.type === NODE_TYPES.CHANCE || n.type === NODE_TYPES.TERMINAL) return 'var(--card)'
              return 'var(--muted)'
            }}
          />
          
          {!isReadOnly && <TreeToolbar />}
          <TreeLegend />
        </ReactFlow>
      </div>
    </div>
  )
}