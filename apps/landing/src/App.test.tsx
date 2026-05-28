import { render, screen } from '@testing-library/react';
import App from './App';

describe('Fetcher landing', () => {
  it('renders the required Fetcher narrative and Filecoin MCP sections', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /your data/i })).toBeInTheDocument();
    expect(screen.getByText('Connect AI agents to Filecoin')).toBeInTheDocument();
    expect(screen.getAllByText(/filecoin/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Ghost')).toBeInTheDocument();
    expect(screen.getByText('Read Docs')).toBeInTheDocument();
  });

  it('uses the lavender video asset as the hero background', () => {
    render(<App />);
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', '/fetcher-lavender.mp4');
  });

  it('renders DocsPage when hash is #docs', () => {
    window.location.hash = '#docs';
    render(<App />);
    expect(screen.getByText('← Back to home')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /everything you need/i })).toBeInTheDocument();
    expect(screen.getByText(/Quickstart/i)).toBeInTheDocument();
    expect(screen.getByText(/MCP Setup/i)).toBeInTheDocument();
    expect(screen.getByText(/API Reference/i)).toBeInTheDocument();
    window.location.hash = '';
  });
});
