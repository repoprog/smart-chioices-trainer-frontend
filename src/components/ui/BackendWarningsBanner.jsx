import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

export function BackendWarningsBanner({ warnings, onDismiss, onRetry }) {
  // Proste odcięcie z Figmy - bez kombinowania
  if (!warnings || warnings.length === 0) return null;

  return (
    // DOKŁADNIE Twoje klasy animacji i układu:
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 animate-in slide-in-from-top duration-300">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-amber-500/20 rounded-lg flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-amber-800 dark:text-amber-400">
              Wykryto {warnings.length} {warnings.length === 1 ? "uwagę" : warnings.length < 5 ? "uwagi" : "uwag"} z serwera
            </h4>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-amber-500/10 rounded transition-colors"
                title="Zamknij"
              >
                <X className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {warnings.map((warning, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-amber-600 dark:text-amber-500 mt-0.5">•</span>
                <div className="flex-1">
                  <span className="text-amber-800/90 dark:text-amber-400/90">{warning}</span>
                </div>
              </li>
            ))}
          </ul>

          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-400 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Spróbuj ponownie
            </button>
          )}
        </div>
      </div>
    </div>
  );
}