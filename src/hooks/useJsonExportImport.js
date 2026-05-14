import { useRef, useCallback } from 'react';

export function useJsonExportImport({ buildExportData, onImport, filename, onError }) {
  const fileInputRef = useRef(null);

  const handleExport = useCallback(() => {
    try {
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
    } catch (error) {
      console.error("Błąd podczas eksportu:", error);
      onError?.('Wystąpił błąd podczas generowania pliku do eksportu.') ?? console.error(error);
    }
  }, [buildExportData, filename, onError]);

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
        
        onError?.("Błąd podczas odczytu pliku. Upewnij się, że to poprawny plik .json.") ?? console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset inputu
  }, [onImport, onError]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return { fileInputRef, handleExport, handleImportClick, handleFileChange };
}