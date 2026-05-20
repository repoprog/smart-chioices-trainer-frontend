import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { decisionApi } from '../api/decisionApi';
import { APP_ROUTES } from '../constants/appConstants';

import { TreeCanvas } from '../features/DecisionTree/components/TreeCanvas';
import { TableGrid } from '../features/DecisionTable/components/TableGrid'; 
import { Button } from '../components/ui/Button';
import { Trophy, TableProperties } from 'lucide-react';

export function SharedProjectPage() {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // DODANE: Stan do sterowania widokiem rankingu w tabeli
  const [isRankingView, setIsRankingView] = useState(true);

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
      <div className="bg-primary/10 border-b border-primary/20 text-foreground p-3 flex flex-col sm:flex-row justify-between items-center px-6 shadow-sm z-50 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-xl">👁</span>
          <span>Tryb tylko do odczytu: <strong className="text-primary">{project.title}</strong></span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* DODANE: Przycisk przełączający widok (tylko dla Tabeli) */}
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

          <Link to={APP_ROUTES.REGISTER} className="px-5 py-2.5 cursor-pointer font-semibold text-sm bg-purple-500 !text-white border-none rounded-md transition-all hover:shadow-[0_0_30px_0_rgba(139,92,246,0.2)] hover:bg-purple-600 whitespace-nowrap">
            Zbuduj własną decyzję za darmo
          </Link>
        </div>
      </div>

      {/* Kontener GŁÓWNY */}
      <div className="flex-1 w-full h-full relative p-4 bg-muted/20">
        <div className="w-full h-full bg-card rounded-xl border border-border shadow-sm overflow-hidden relative">
          
          {project.type === 'TREE' ? (
            <TreeCanvas readOnlyData={project.content} />
          ) : (
            // DODANE: Przekazujemy stan do TableGrid
            <TableGrid readOnlyData={project.content} readOnlyShowRanking={isRankingView} />
          )}

        </div>
      </div>
    </div>
  );
}