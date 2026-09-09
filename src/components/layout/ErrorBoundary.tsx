import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    error: Error | null;
}

/**
 * Captura erros de renderização para não derrubar a aplicação inteira.
 *
 * Sem isto, qualquer exceção durante o render — um campo ausente numa resposta
 * da API, por exemplo — desmontava a árvore e deixava a página em branco, sem
 * mensagem e sem caminho de recuperação.
 *
 * Precisa ser componente de classe: `componentDidCatch` e
 * `getDerivedStateFromError` não têm equivalente em hooks.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        // Em produção, encaminhe para o monitoramento (Sentry, etc.).
        console.error('[ErrorBoundary] Falha na renderização', error, info.componentStack);
    }

    private handleReload = (): void => {
        window.location.reload();
    };

    render(): React.ReactNode {
        if (!this.state.error) return this.props.children;

        return (
            <div className="app-error" role="alert" style={{ padding: 'var(--space-8)', maxWidth: 640 }}>
                <h2>Algo deu errado nesta tela</h2>
                <p>
                    A aplicação encontrou um erro inesperado. Recarregar costuma resolver; se persistir,
                    informe o time com a mensagem abaixo.
                </p>
                <pre
                    style={{
                        whiteSpace: 'pre-wrap',
                        overflowX: 'auto',
                        padding: 'var(--space-3)',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,0.05)',
                    }}
                >
                    {this.state.error.message}
                </pre>
                <button className="btn btn-primary" onClick={this.handleReload}>
                    Recarregar
                </button>
            </div>
        );
    }
}
