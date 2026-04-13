import { useTreeStore } from '../features/DecisionTree/store/useTreeStore.js';

export function useClipboardActions(id, isEdge = true) {
  const updateEdgeData = useTreeStore((s) => s.updateEdgeData);
  const updateNodeData = useTreeStore((s) => s.updateNodeData);

  const updateFn = isEdge ? updateEdgeData : updateNodeData;

  const executeCopy = (e, value) => {
    e.stopPropagation();
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => console.error("Clipboard error"));
  };

  const executePaste = async (e, key) => {
    e.stopPropagation();
    try {
      const text = await navigator.clipboard.readText();
      if (text) updateFn(id, { [key]: text });
    } catch {
      alert("Wymagane HTTPS i zgoda na schowek.");
    }
  };

  const executeDelete = (e, key, callback) => {
    e.stopPropagation();
    updateFn(id, { [key]: "" });
    if (callback) callback();
  };

  return { executeCopy, executePaste, executeDelete };
}