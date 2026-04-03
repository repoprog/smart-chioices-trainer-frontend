import { DecisionTreeCanvas } from '../components/DecisionTreeCanvas.jsx'
import { useTreeStore } from '../store/useTreeStore.js'
import { scenarios } from '../data/scenarios.js' // <-- Ścieżka do nowego pliku
import { UndoRedoControls } from '../components/UndoRedoControls.jsx';

export function DecisionTreePage() {
  // Wyciągamy funkcję ładującą ze store'a
  const loadScenario = useTreeStore((s) => s.loadScenario);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Drzewo Decyzyjne
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Układ wg Smart Choices: kwadrat = decyzja, koło = niepewność, prostokąt =
          konsekwencja. Etykieta nad gałęzią, prawdopodobieństwo pod gałęzią
          (z węzła niepewności). Najedź na decyzję lub niepewność, aby dodać lub
          usunąć gałąź.
        </p>
        
        {/* NOWA SEKCJA: Przyciski Scenariuszy */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Wczytaj szablon:
          </span>
          {Object.entries(scenarios).map(([key, scenarioData]) => (
            <button
              key={key}
              onClick={() => loadScenario(scenarioData.nodes, scenarioData.edges, scenarioData.labels)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:focus:ring-cyan-400 transition-colors"
            >
              {scenarioData.name}
            </button>
          ))}
        </div>
       
      </header>
      
      <main className="flex flex-1 flex-col p-4 md:p-6">
        <DecisionTreeCanvas />
      </main>
    </div>
  )
}