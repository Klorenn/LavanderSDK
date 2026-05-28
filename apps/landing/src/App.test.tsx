import { render, screen } from '@testing-library/react';
import App from './App';

describe('Fetcher landing', () => {
  it('renders the required Fetcher narrative and Filecoin MCP sections', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /your data\. one clear spirit away\./i })).toBeInTheDocument();
    expect(screen.getByText(/Connect your AI agents to Filecoin/i)).toBeInTheDocument();
    expect(screen.getByText(/Five tools\. One install\. Full Filecoin\./i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'store_file' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'retrieve_file' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'check_deal' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'list_files' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'verify_cid' })).toBeInTheDocument();
    expect(screen.getByText(/Alex Chen/i)).toBeInTheDocument();
    expect(screen.getByText(/The keeper of secrets/i)).toBeInTheDocument();
    expect(screen.getByText(/The spirit messenger/i)).toBeInTheDocument();
  });

  it('uses the lavender video asset as the hero background', () => {
    render(<App />);

    const video = document.querySelector<HTMLVideoElement>('#hero-video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', '/fetcher-lavender.mp4');
  });
});
