import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

const gradient = "linear-gradient(135deg, #ef4136, #fbb040)";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fullPage = true, message } = this.props;
    const errorMessage = message || this.state.error?.message || "Something went wrong.";

    if (!fullPage) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
          <p className="text-sm text-zinc-500 dark:text-white/40">{errorMessage}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-xs font-semibold text-zinc-400 dark:text-white/30 hover:text-zinc-700 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Try again
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: gradient }}
          >
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Something went wrong</h1>
          <p className="text-zinc-400 text-sm mb-2">{errorMessage}</p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="text-left text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 overflow-auto max-h-40 whitespace-pre-wrap">
              {this.state.error.stack}
            </pre>
          )}
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Try again
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: gradient }}
            >
              <Home className="w-4 h-4" /> Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
