import { useState } from 'react';
import { useTradeoffStore } from '../../store/useTradeOffStore';


export function TradeoffHeader() {
  const showTradeoffs = useTradeoffStore(s => s.showTradeoffs);
  const showRanking = useTradeoffStore(s => s.showRanking);
  const toggleTradeoffs = useTradeoffStore(s => s.toggleTradeoffs);
  const toggleRanking = useTradeoffStore(s => s.toggleRanking);
  
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center">
        <h2 className="m-0 text-2xl font-semibold text-gray-900 tracking-tight">Tabela Decyzyjna</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex">
          <button 
            className={`h-[40px] leading-none px-5 py-2.5 font-semibold text-sm rounded-md border-none cursor-pointer transition-all duration-200 inline-flex items-center gap-1.5 ${showTradeoffs ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
            onClick={toggleTradeoffs}
          >
            Kompromisy
            <span 
              className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-white text-white text-[10px] font-bold -translate-y-[1px] ml-1 transition-all hover:bg-white hover:text-purple-500"
              onClick={(e) => { e.stopPropagation(); setShowHelpTooltip(!showHelpTooltip); }}
            >
              ?
            </span>
          </button>
          
          {/* Tu wklej zawartość tooltipa z informacjami o kompromisach */}
          {showHelpTooltip && (  <div className="absolute top-full right-0 mt-3 w-[380px] bg-gray-800 text-gray-50 p-5 rounded-xl shadow-xl z-50 text-sm leading-relaxed text-left">
                                        <button className="absolute top-3 right-3 bg-transparent border-none text-gray-400 text-xl cursor-pointer px-2 py-1 rounded transition-colors hover:text-gray-50 hover:bg-white/10 leading-none" onClick={() => setShowHelpTooltip(false)} aria-label="Zamknij">&times;</button>
                                        <p className="mb-3"><strong>Kompromisy</strong> polegają na "eliminacji celów" przez równą wymianę. Jeżeli w jednym z celów wartości są takie same dla każdej alternatywy, ten cel można pominąć - nie wpływa już na decyzję.</p>
                                        <h4 className="mt-4 mb-2 text-purple-400 text-sm uppercase tracking-wide">Równa wymiana</h4>
                                        <p className="mb-3">Wybierz łatwy cel, np. czas dojazdu. Znajdź w tabeli alternatywę z najlepszym czasem i zastanów się, o ile musiałbyś zwiększyć inny cel (np. czynsz) w pozostałych alternatywach, aby wyrównać w nich czas do tego poziomu. Np. każde 10 min mniej dojazdu zwiększa czynsz o 300zł.</p>
                                        <p className="mb-3">Wprowadź zmiany, cel zostanie przekreślony — skoro jest równy, nie ma już znaczenia.</p>
                                        <p className="mb-3">Postępuj tak dla kolejnych, łatwych celów, aż:</p>
                                        <ul className="m-0 pl-5 mb-3 list-disc">
                                            <li className="mb-1">wyłonisz zwycięzcę, albo</li>
                                            <li className="mb-1">zostanie tylko jeden cel do porównania.</li>
                                        </ul>
                                        <p className="m-0">💡<i className="text-gray-300">Najprościej zrównywać atrybuty (np. czas, standard, kolor), a zwiększać kwoty.</i></p>
                                    </div> )} 
        </div>

        <button 
          className={`h-[40px] leading-none px-5 py-2.5 font-semibold text-sm rounded-md border-none cursor-pointer transition-all duration-200 inline-flex items-center gap-1.5 ${showRanking ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
          onClick={toggleRanking}
        >
          Ranking
        </button>
      </div>
    </div>
  );
}