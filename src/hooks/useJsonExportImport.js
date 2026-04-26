import { useRef, useCallback } from 'react';

export function useJsonExportImport({ buildExportData, onImport, filename }) {
  const fileInputRef = useRef(null);

  const handleExport = useCallback(() => {
    const data = buildExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [buildExportData, filename]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        onImport(parsed);
      } catch (error) {
        console.error("Błąd parsowania pliku JSON:", error);
        alert("Błąd podczas odczytu pliku. Upewnij się, że to poprawny plik .json.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset inputu
  }, [onImport]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return { fileInputRef, handleExport, handleImportClick, handleFileChange };
}