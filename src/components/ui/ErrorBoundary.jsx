import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
   
    console.error('Aplikacja napotkała błąd krytyczny:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full text-center p-8 border-destructive/20 shadow-lg">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-foreground">Coś poszło nie tak</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Aplikacja napotkała nieoczekiwany błąd renderowania. Nie martw się, twoje dane zapisane w przeglądarce są bezpieczne.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()} variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Odśwież aplikację
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}