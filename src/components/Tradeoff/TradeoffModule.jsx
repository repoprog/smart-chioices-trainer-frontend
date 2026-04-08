import { useTradeoffStore } from '../../store/useTradeOffStore';
import { TradeoffHeader } from './TradeoffHeader';
import { TradeoffGrid } from './TradeoffGrid';
import { TradeoffSettings } from './TradeoffSettings';

export function TradeoffModule() {
  const resetAll = useTradeoffStore(s => s.resetAll);

  const handleReset = () => {
    if(window.confirm('Czy na pewno chcesz zresetować całą tabelę?')) {
      resetAll();
    }
  };

  return (
    <div className="w-full h-full flex flex-col font-sans">
      <div className="w-full mx-auto bg-card rounded-xl border border-border shadow-sm p-6 overflow-hidden flex flex-col">
        <TradeoffHeader />
        
        <div className="flex-1 overflow-auto custom-scrollbar mt-4">
            <TradeoffGrid />
        </div>
        
        <TradeoffSettings />
      
        <div className="mt-4 flex justify-end">
          <button 
            className="bg-transparent border-none text-destructive/80 text-xs font-semibold cursor-pointer hover:text-destructive hover:underline transition-colors"
            onClick={handleReset}
          >
            Resetuj wszystko
          </button>
        </div>
      </div>
    </div>
  );
}