import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../locales/i18n';
import { Sidebar } from '../components/layout/Sidebar';
import { StatusBar } from '../components/layout/StatusBar';

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('Sidebar', () => {
  it('renders app name', () => {
    renderWithI18n(<Sidebar currentPage="merge" onNavigate={() => {}} />);
    expect(screen.getByText('PDFCraft')).toBeDefined();
  });

  it('renders all navigation items', () => {
    renderWithI18n(<Sidebar currentPage="merge" onNavigate={() => {}} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('calls onNavigate when a nav item is clicked', () => {
    const onNavigate = vi.fn();
    renderWithI18n(<Sidebar currentPage="merge" onNavigate={onNavigate} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]);
    expect(onNavigate).toHaveBeenCalled();
  });

  it('highlights the active page', () => {
    renderWithI18n(<Sidebar currentPage="settings" onNavigate={() => {}} />);
    const buttons = screen.getAllByRole('button');
    const settingsBtn = buttons[buttons.length - 1];
    expect(settingsBtn).toBeDefined();
  });
});

describe('StatusBar', () => {
  it('renders status message', () => {
    renderWithI18n(<StatusBar message="status.ready" />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeDefined();
  });

  it('renders version info', () => {
    renderWithI18n(<StatusBar message="status.ready" />);
    expect(screen.getByText('PDFCraft v0.1.0')).toBeDefined();
  });
});
