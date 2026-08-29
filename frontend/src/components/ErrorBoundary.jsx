import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // Swap for real error logging (Sentry, LogRocket, etc.) later.
    console.error('Uncaught render error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>Something went wrong.</h2>
          <p>Try refreshing the page. If it keeps happening, that's a bug worth reporting.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '12px' }}>
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
