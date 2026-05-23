import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export const exportGraph = async ({ format, getNodes, getNodesBounds, getViewport, setViewport, addToast }) => {
  const nodes = getNodes();
  if (nodes.length === 0) {
    addToast("Plansza jest pusta. Brak danych do eksportu.", "warning");
    return;
  }

  const paddingX = 100;      
  const paddingTop = 180;    
  const paddingBottom = 100; 

  const nodesBounds = getNodesBounds(nodes);
  const imageWidth = nodesBounds.width + paddingX * 2;
  const imageHeight = nodesBounds.height + paddingTop + paddingBottom;

  const flowWrapper = document.querySelector('.react-flow');
  if (!flowWrapper) return;

  const currentViewport = getViewport(); 
  const origWidth = flowWrapper.style.width;
  const origHeight = flowWrapper.style.height;

  const bgElement = document.querySelector('.react-flow__background');
  const origBgDisplay = bgElement ? bgElement.style.display : '';
  if (bgElement) bgElement.style.display = 'none';

  try {
    flowWrapper.style.width = `${imageWidth}px`;
    flowWrapper.style.height = `${imageHeight}px`;

    setViewport({ 
      x: -nodesBounds.x + paddingX, 
      y: -nodesBounds.y + paddingTop, 
      zoom: 1 
    });

    const exportStyles = document.createElement('style');
    exportStyles.id = 'react-flow-export-style';
    exportStyles.innerHTML = `
      .react-flow * {
        transition: none !important;
      }
      
      .hide-on-export-img { display: none !important; }
      .show-on-export-img { display: block !important; }
      
      .export-force-light-legend {
        background-color: #ffffff !important; 
        backdrop-filter: none !important; 
        border-color: #e2e8f0 !important; 
        color: #64748b !important; 
      }
      
      .export-force-light-legend svg {
        color: #0f172a !important; 
        fill: #ffffff !important; 
      }
    
      input[placeholder^="Etap"], input[placeholder="Konsekwencje"] {
        color: #1e293b !important;
      }
      button[title^="Zmień na poszukiwanie"] {
        background-color: #ecfdf5 !important;
        border-color: #34d399 !important;
        color: #065f46 !important;
      }
      button[title^="Zmień na poszukiwanie"] span {
        color: #059669 !important;
      }

      /* ---> NAPRAWA ODZNAK EV + USUNIĘCIE BŁĘDU POŚWIATY <--- */
      .react-flow__node div[class*="dark:bg-slate-900"],
      .react-flow__node div[class*="dark:bg-emerald-950"] {
         backdrop-filter: none !important; /* Wyłączenie rozmycia tła pod elementem */
      }
      
      .react-flow__node div[class*="dark:bg-slate-900"] {
         background-color: #ffffff !important;
         border-color: #94a3b8 !important; 
         /* ZMIANA: Czysty, standardowy cień. Usunięto 'inset' powodujący dziwną górną poświatę */
         box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
      }
      .react-flow__node span[class*="dark:text-yellow-400"] {
         color: #b45309 !important; 
         filter: none !important; 
      }

      .react-flow__node div[class*="dark:bg-emerald-950"] {
         background-color: #ecfdf5 !important; 
         border-color: #34d399 !important; 
         /* ZMIANA: Czysty, lekki cień. */
         box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; 
      }
      .react-flow__node span[class*="dark:text-emerald-300"] {
         color: #047857 !important; 
      }
    `;
    document.head.appendChild(exportStyles);
    
    await new Promise((resolve) => setTimeout(resolve, 50));

    const dataUrl = await toPng(flowWrapper, {
      backgroundColor: '#ffffff', 
      width: imageWidth,
      height: imageHeight,
      pixelRatio: 2, 
      filter: (node) => {
        if (node?.classList?.contains('tree-toolbar-export')) return false;
        if (node?.classList?.contains('react-flow__controls')) return false;
        if (node?.classList?.contains('react-flow__minimap')) return false;
        if (node?.classList?.contains('hide-on-export')) return false;
        return true;
      }
    });

    document.head.removeChild(exportStyles);

    flowWrapper.style.width = origWidth;
    flowWrapper.style.height = origHeight;
    setViewport(currentViewport);
    if (bgElement) bgElement.style.display = origBgDisplay;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = 'drzewo-decyzyjne.png';
      link.href = dataUrl;
      link.click();
    } else if (format === 'pdf') {
      const pdf = new jsPDF({
        orientation: imageWidth > imageHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imageWidth, imageHeight]
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, imageWidth, imageHeight);
      pdf.save('drzewo-decyzyjne.pdf');
    }
  } catch (err) {
    console.error("Błąd podczas eksportu:", err);
    flowWrapper.style.width = origWidth;
    flowWrapper.style.height = origHeight;
    setViewport(currentViewport);
    if (bgElement) bgElement.style.display = origBgDisplay;
  }
};