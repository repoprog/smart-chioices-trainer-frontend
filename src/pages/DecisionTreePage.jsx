import { DecisionTreeCanvas } from '../components/DecisionTreeCanvas.jsx'

export function DecisionTreePage() {
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
      </header>
      <main className="flex flex-1 flex-col p-4 md:p-6">
        <DecisionTreeCanvas />
      </main>
    </div>
  )
}
