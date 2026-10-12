import { Component, type ReactNode } from 'react';

/** Keeps one broken page from blanking the whole app: shows the error and a way back. Resets when `resetKey` changes. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null; key: string }> {
  state = { error: null as Error | null, key: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(props: { resetKey: string }, state: { error: Error | null; key: string }) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error) {
    console.error('Page crashed:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="card" role="alert">
        <h2>😵 This page hit a bug</h2>
        <p className="muted small">Your progress is safe. Try another page, or reload the app.</p>
        <pre className="small">{String(this.state.error.message).slice(0, 400)}</pre>
        <div className="row">
          <button onClick={() => (location.hash = '#/')}>🏠 Home</button>
          <button className="ghost" onClick={() => location.reload()}>↻ Reload</button>
        </div>
      </div>
    );
  }
}
