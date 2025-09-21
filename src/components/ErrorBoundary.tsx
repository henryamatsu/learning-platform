"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "./ui/Card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to log this to an error reporting service
    if (process.env.NODE_ENV === "production") {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <Card className="error-boundary__card">
            <CardHeader>
              <h2 className="error-boundary__title">⚠️ Something went wrong</h2>
              <p className="error-boundary__subtitle">
                We encountered an unexpected error. Please try again.
              </p>
            </CardHeader>

            <CardContent>
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="error-boundary__details">
                  <h3>Error Details (Development Mode):</h3>
                  <pre className="error-boundary__error-text">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="error-boundary__stack">
                      <summary>Component Stack</summary>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </details>
                  )}
                </div>
              )}

              <div className="error-boundary__suggestions">
                <h3>What you can try:</h3>
                <ul>
                  <li>Click &quot;Try Again&quot; to retry the operation</li>
                  <li>Refresh the page to start over</li>
                  <li>Go back to the previous page</li>
                  <li>If the problem persists, please contact support</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter>
              <div className="error-boundary__actions">
                <Button onClick={this.handleRetry}>Try Again</Button>
                <Button variant="secondary" onClick={this.handleReload}>
                  Refresh Page
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.history.back()}
                >
                  Go Back
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
