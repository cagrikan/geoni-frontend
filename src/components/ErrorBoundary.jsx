import { Component } from 'react';

// Uygulama genelinde render hatalarini yakalar. Onceden hicbir sinir yoktu:
// bozuk bir result_json ya da beklenmeyen bir alan .map()'te patlayinca TUM SPA
// beyaz ekrana dusuyordu. Bu sinir hatayi tutup kullaniciya kurtulus yolu verir.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Konsola birak; ileride Sentry vb. buraya baglanabilir.
    console.error('ErrorBoundary yakaladi:', error, info);
  }

  handleReset = () => {
    // Duruma bagli bozulmayi temizlemek icin ana sayfaya tam yenileme.
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const tr = (navigator.language || 'tr').toLowerCase().startsWith('tr');
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24,
        textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif',
        background: '#07070F', color: '#F1F5F9',
      }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>
          {tr ? 'Bir şeyler ters gitti' : 'Something went wrong'}
        </h1>
        <p style={{ color: '#94A3B8', maxWidth: 420, lineHeight: 1.6, fontSize: 14 }}>
          {tr
            ? 'Beklenmeyen bir hata oluştu. Ana sayfaya dönüp tekrar deneyebilirsiniz.'
            : 'An unexpected error occurred. You can return to the home page and try again.'}
        </p>
        <button onClick={this.handleReset} style={{
          background: '#818CF8', color: '#0D0D1A', border: 'none',
          padding: '12px 26px', borderRadius: 8, fontWeight: 700, fontSize: 14,
          cursor: 'pointer',
        }}>
          {tr ? 'Ana Sayfaya Dön' : 'Back to Home'}
        </button>
      </div>
    );
  }
}
