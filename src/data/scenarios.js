// plik: scenarios.js

export const scenarios = {
  blank: {
    name: "Pusta karta (od nowa)",
    nodes: [
      { id: 'd1', type: 'decision', position: { x: 0, y: 0 }, data: { nodeNumber: 1 } },
    ],
    edges: [],
    labels: ["Wybór początkowy"]
  },
  
  investment: {
    name: "Analiza Inwestycji (Klasyk)",
    nodes: [
      // ... skopiowane nodes z Twojego obecnego initialNodes ...
    ],
    edges: [
      // ... skopiowane edges z Twojego obecnego initialEdges ...
    ],
    labels: ["Decyzja biznesowa", "Ryzyko Rynkowe", "Wynik Finansowy"]
  },

  court: {
    name: "Ugoda czy Proces (Prawny)",
    nodes: [
      // ... węzły dostosowane pod ugodę/sąd ...
    ],
    edges: [
      // ... krawędzie z prawdopodobieństwami wygranej w sądzie itp ...
    ],
    labels: ["Strategia", "Wyrok", "Koszty"]
  },
  marketingLaunch: {
    name: "Kampania Marketingowa",
    // 1. Etykiety nagłówków (Header 1, 2...)
    labels: ["Strategia", "Reakcja Rynku", "Wynik"], 
    
    nodes: [
      { id: 'd1', type: 'decision', position: { x: 0, y: 0 }, data: { nodeNumber: 1 } },
      { id: 'c1', type: 'chance', position: { x: 0, y: 0 }, data: { nodeNumber: 2 } },
      { id: 't1', type: 'terminal', position: { x: 0, y: 0 }, data: { payoff: '50 000 zł' } },
      { id: 't2', type: 'terminal', position: { x: 0, y: 0 }, data: { payoff: '-10 000 zł' } },
    ],

    edges: [
      { 
        id: 'e1', source: 'd1', target: 'c1', type: 'smartChoices', 
        data: { optionLabel: 'Social Media' } 
      },
      { 
        id: 'e2', source: 'c1', target: 't1', type: 'smartChoices', 
        // 2. Tu wpisujesz predefiniowane prawdopodobieństwo
        data: { optionLabel: 'Viral', probability: '30.00%', isLocked: true } 
      },
      { 
        id: 'e3', source: 'c1', target: 't2', type: 'smartChoices', 
        data: { optionLabel: 'Brak echa', probability: '70.00%', isLocked: true } 
      },
    ]
  }, basketball: {
    name: "Rzut w Ostatniej Sekundzie (Koszykówka)",
    labels: ["Wybór Rzutu", "Skuteczność Rzutu", "Dogrywka (OT)", "Wynik Meczu"],
    nodes: [
      // 1. Decyzja początkowa (Wybór rzutu)
      { id: 'd1', type: 'decision', position: { x: 0, y: 0 }, zIndex: 100, data: { nodeNumber: 1 } },
      
      // 2. Etap Skuteczności (Niepewność)
      { id: 'c1', type: 'chance', position: { x: 0, y: 0 }, data: { nodeNumber: 2 } }, // Niepewność przy rzucie za 2
      { id: 'c2', type: 'chance', position: { x: 0, y: 0 }, data: { nodeNumber: 3 } }, // Niepewność przy rzucie za 3
      
      // 3. Etap Dogrywki (Tylko dla rzutu za 2)
      { id: 'c3', type: 'chance', position: { x: 0, y: 0 }, data: { nodeNumber: 4 } },
      
      // 4. Konsekwencje (Terminal Nodes)
      { id: 't1', type: 'terminal', position: { x: 0, y: 0 }, data: { payoff: '0 (Porażka)' } }, // Pudło za 2
      { id: 't2', type: 'terminal', position: { x: 0, y: 0 }, data: { payoff: '100 (Wygrana)' } }, // Wygrana w OT
      { id: 't3', type: 'terminal', position: { x: 0, y: 0 }, data: { payoff: '0 (Porażka)' } }, // Porażka w OT
      { id: 't4', type: 'terminal', position: { x: 0, y: 0 }, data: { payoff: '100 (Wygrana)' } }, // Trafiony za 3
      { id: 't5', type: 'terminal', position: { x: 0, y: 0 }, data: { payoff: '0 (Porażka)' } }, // Pudło za 3
    ],
    edges: [
      // Opcje decyzji
      { id: 'e1', source: 'd1', target: 'c1', type: 'smartChoices', data: { optionLabel: 'Za 2 punkty', probability: null } },
      { id: 'e2', source: 'd1', target: 'c2', type: 'smartChoices', data: { optionLabel: 'Za 3 punkty', probability: null } },
      
      // RZUT ZA 2 PUNKTY
      { id: 'e3', source: 'c1', target: 'c3', type: 'smartChoices', data: { optionLabel: 'Trafiony', probability: '55.00%', isLocked: true } },
      { id: 'e4', source: 'c1', target: 't1', type: 'smartChoices', data: { optionLabel: 'Pudło', probability: '45.00%', isLocked: true } },
      
      // DOGRYWKA (Po trafieniu za 2)
      { id: 'e5', source: 'c3', target: 't2', type: 'smartChoices', data: { optionLabel: 'Wygrana w OT', probability: '50.00%', isLocked: true } },
      { id: 'e6', source: 'c3', target: 't3', type: 'smartChoices', data: { optionLabel: 'Porażka w OT', probability: '50.00%', isLocked: true } },

      // RZUT ZA 3 PUNKTY
      { id: 'e7', source: 'c2', target: 't4', type: 'smartChoices', data: { optionLabel: 'Trafiony', probability: '38.00%', isLocked: true } },
      { id: 'e8', source: 'c2', target: 't5', type: 'smartChoices', data: { optionLabel: 'Pudło', probability: '62.00%', isLocked: true } },
    ]
  }

};