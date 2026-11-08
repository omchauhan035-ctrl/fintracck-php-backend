import { Component } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-extrabold text-white mb-2">Something went wrong</h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6">
              An unexpected error occurred while rendering this interface.
            </p>

            {this.state.error && (
              <div className="text-left bg-slate-950/80 rounded-xl p-3 border border-slate-800 mb-6 text-xs font-mono text-rose-400 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => (window.location.href = '/')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer justify-center"
              >
                <Home className="w-4 h-4 mr-1.5" />
                <span>User Dashboard</span>
              </Button>
              <Button
                size="sm"
                onClick={this.handleReset}
                className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                <span>Reload Page</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

