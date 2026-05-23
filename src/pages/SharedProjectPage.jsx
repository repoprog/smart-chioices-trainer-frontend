import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { decisionApi } from '../api/decisionApi';
import { APP_ROUTES } from '../constants/appConstants';
// DODANE: Importujemy magazyn autoryzacji
import useAuthStore from '../store/useAuthStore'; 

import { TreeCanvas } from '../features/DecisionTree/components/TreeCanvas';
import { TableGrid } from '../features/DecisionTable/components/TableGrid'; 
import { Button } from '../components/ui/Button';
// DODANE: Import FlaskConical dla trybu symulacji
import { Trophy, TableProperties, Eye, Calculator } from 'lucide-react';

export function SharedProjectPage() {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Stany do sterowania widokami
  const [isRankingView, setIsRankingView] = useState(true);
  const [isSimulationView, setIsSimulationView] = useState(false); 

  // DODANE: Pobieramy akcję otwierającą modal
  const openRegisterModal = useAuthStore((s) => s.openRegisterModal);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await decisionApi.getSharedProject(token);
        let parsedContent = data.content;
        if (typeof parsedContent === 'string') {
          try { parsedContent = JSON.parse(parsedContent); } catch(e){}
        }
        setProject({ ...data, content: parsedContent });
      } catch (err) {
        setError(err.response?.status === 410 ? 'Ten link wygasł.' : 'Nie znaleziono projektu.');
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchProject();
  }, [token]);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (error || !project) return <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-background"><h1 className="text-2xl font-bold text-destructive">{error}</h1><Link to={APP_ROUTES.HOME} className="text-primary hover:underline">Wróć na stronę główną</Link></div>;

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      
      {/* Baner Publiczny */}
      <div className="bg-primary/10 border-b-2 border-primary/30 px-6 py-3 shadow-sm z-50 shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        
        <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg shrink-0">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">Tryb tylko do odczytu</span>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm font-medium text-primary">{project.title}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Zaloguj się, aby zbudować własną decyzję.
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
          
          {/* PRZYCISKI DLA TABELI */}
          {project.type === 'TABLE' && (
            <Button
              variant={isRankingView ? "amber" : "defaultAmber"}
              onClick={() => setIsRankingView(!isRankingView)}
              className="h-8 px-2.5 text-xs lg:h-9 lg:px-4 lg:text-sm transition-all"
            >
              {isRankingView ? (
                <><TableProperties className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" /> Pokaż surowe dane</>
              ) : (
                <><Trophy className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" /> Pokaż wyniki analizy</>
              )}
            </Button>
          )}

          {/* PRZYCISKI DLA DRZEWA (Symulacja) */}
          {project.type === 'TREE' && (
            
            <Button
              variant={isSimulationView ? "cyan" : "defaultCyan"}
              onClick={() => setIsSimulationView(!isSimulationView)}
              className="h-8 px-2.5 text-xs lg:h-9 lg:px-4 lg:text-sm transition-all"
            >
              <Calculator className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1.5 lg:mr-2" /> 
              {isSimulationView ? "Ukryj kalkulacje " : "Pokaż kalkulacje"}
            </Button>
          )}

          {/* ZMIANA: Zastępujemy przestarzały <Link> bezpiecznym wywołaniem Modala */}
          <Button 
            onClick={openRegisterModal}
            variant="purple"
          >
            Zbuduj własną decyzję
          </Button>
          </div>
        </div>
      </div>

      {/* Kontener GŁÓWNY */}
      <div className="flex-1 w-full relative bg-muted/20 overflow-y-auto custom-scrollbar">
        
        {project.type === 'TREE' ? (
          // WIDOK DRZEWA
          <div className="absolute inset-4 md:inset-6 lg:inset-8">
            <div className="w-full h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden relative">
              {/* ZMIANA: Przekazujemy stan symulacji do płótna drzewa */}
              <TreeCanvas 
                readOnlyData={project.content} 
                readOnlySimulationMode={isSimulationView} 
              />
            </div>
          </div>
        ) : (
          // WIDOK TABELI: Klasyczny układ blokowy z paddingiem (zero flexowych anomalii)
          <div className="w-full mx-auto max-w-[1400px] p-4 md:p-8">
            <div className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="w-full overflow-x-auto custom-scrollbar [&>div]:!h-auto [&>div]:!min-h-0">
                <TableGrid 
                  readOnlyData={project.content} 
                  readOnlyShowRanking={isRankingView} 
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}