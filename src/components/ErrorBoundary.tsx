import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: Readonly<ErrorBoundaryProps>;
  declare setState: (state: ErrorBoundaryState) => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Algo não saiu como esperado.'
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('EasyLib ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#E8E2D9] p-7 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1E6] text-[#EA580C] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#1C1917]">Algo saiu do esperado</h2>
            <p className="text-sm text-[#57534E] break-words">
              {this.state.errorMessage}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
              className="tactile-btn px-5 py-2.5 rounded-2xl bg-[#EA580C] hover:bg-[#DC4F06] text-white font-bold text-sm border-b-4 border-[#9A3412] cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
