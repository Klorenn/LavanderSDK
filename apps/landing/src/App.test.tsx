import { render, screen } from '@testing-library/react';
import App from './App';

describe('Fetcher landing', () => {
  it('renders the required Fetcher narrative and Filecoin MCP sections', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /your data/i })).toBeInTheDocument();
    expect(screen.getByText('Connect AI agents to Filecoin')).toBeInTheDocument();
    expect(screen.getAllByText(/filecoin/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Ghost')).toBeInTheDocument();
    expect(screen.getAllByText(/MIT License/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Get Started/i).length).toBeGreaterThan(1);
    expect(screen.getByText('Read Docs')).toBeInTheDocument();
  });

  it('uses the lavender video asset as the hero background', () => {
    render(<App />);
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', '/fetcher-lavender.mp4');
  });
});
