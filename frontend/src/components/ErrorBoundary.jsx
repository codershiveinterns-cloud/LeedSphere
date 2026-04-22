import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-[#0d1117] flex items-center justify-center font-sans">
           <div className="max-w-md w-full bg-[#161b22] border border-red-900/50 rounded-xl p-8 text-center shadow-lg">
              <h2 className="text-xl font-bold text-red-500 mb-4">Something went wrong</h2>
              <p className="text-gray-400 text-sm mb-6">The application encountered an unexpected error. You can try again or reload the page.</p>
              <div className="p-4 bg-[#0d1117] rounded-lg text-left overflow-auto max-h-32 mb-6">
                 <pre className="text-xs text-red-400 font-mono">{this.state.error?.toString()}</pre>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={this.handleReset}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                   Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                   Reload Page
                </button>
              </div>
           </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
