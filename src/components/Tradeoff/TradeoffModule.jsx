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
    <div className="w-full h-full min-h-screen bg-gray-100 p-4 md:p-10 text-gray-900 font-sans text-[16px] leading-normal">
      <div className="max-w-[1200px] w-full mx-auto bg-white rounded-xl shadow-md p-8 overflow-auto max-h-[85vh]">
      <TradeoffHeader />
      <TradeoffGrid />
      <TradeoffSettings />
      
      <div className="mt-3 flex justify-between items-center">
        <div></div>
        <button 
          className="bg-transparent border-none text-red-500 text-xs font-semibold cursor-pointer underline mt-2.5 hover:text-red-700"
          onClick={handleReset}
        >
          Resetuj wszystko
        </button>
      </div>
    </div>
    </div>
  );
}