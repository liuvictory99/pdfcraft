import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressBar } from '../components/common/ProgressBar';
import { DropZone } from '../components/common/DropZone';

describe('ProgressBar', () => {
  it('renders with correct percentage', () => {
    render(<ProgressBar percent={45} message="Processing..." />);
    expect(screen.getByText('45%')).toBeDefined();
    expect(screen.getByText('Processing...')).toBeDefined();
  });

  it('clamps percent to 0-100 range', () => {
    // When percent > 100, the displayed text should still show 100%
    render(<ProgressBar percent={150} message="Clamped" />);
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('renders without message', () => {
    const { container } = render(<ProgressBar percent={50} />);
    const textElements = container.querySelectorAll('.text-xs');
    expect(textElements.length).toBe(0);
  });
});

describe('DropZone', () => {
  it('renders children content', () => {
    render(
      <DropZone onFilesDropped={() => {}}>
        <span>Drop files here</span>
      </DropZone>,
    );
    expect(screen.getByText('Drop files here')).toBeDefined();
  });

  it('calls onFilesDropped when PDF files are dropped', () => {
    const onDrop = vi.fn();
    const { container } = render(
      <DropZone onFilesDropped={onDrop} accept=".pdf">
        <span>Drop zone</span>
      </DropZone>,
    );

    const dropzone = container.firstElementChild as HTMLElement;
    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });

    const dataTransfer = {
      files: [file],
      items: [{ kind: 'file', type: 'application/pdf', getAsFile: () => file }],
      types: ['Files'],
    };

    fireEvent.drop(dropzone, { dataTransfer });
    expect(onDrop).toHaveBeenCalledWith([file]);
  });

  it('filters out non-PDF files', () => {
    const onDrop = vi.fn();
    const { container } = render(
      <DropZone onFilesDropped={onDrop} accept=".pdf">
        <span>Drop zone</span>
      </DropZone>,
    );

    const dropzone = container.firstElementChild as HTMLElement;
    const txtFile = new File(['text'], 'test.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [txtFile] },
    });

    expect(onDrop).not.toHaveBeenCalled();
  });
});
