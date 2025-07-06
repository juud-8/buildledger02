import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EmailDialog from '../EmailDialog';

jest.useFakeTimers();

const setup = (props = {}) => {
  const defaults = {
    isOpen: true,
    onClose: jest.fn(),
    documentType: 'quote' as const,
    documentId: '123',
    recipientEmail: 'client@example.com',
    documentNumber: 'Q1'
  };
  return render(<EmailDialog {...defaults} {...props} />);
};

describe('EmailDialog', () => {
  it('does not render when closed', () => {
    const { container } = render(
      <EmailDialog isOpen={false} onClose={jest.fn()} documentType="quote" documentId="1" recipientEmail="a@b.com" documentNumber="Q1" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('sends email and shows success', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    setup();

    fireEvent.change(screen.getByPlaceholderText('your-email@company.com'), { target: { value: 'sender@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Quote/i }));

    expect(screen.getByText(/Sending/)).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText(/Email sent successfully/)).toBeInTheDocument());

    // trigger timeout
    jest.runAllTimers();
  });

  it('handles server error', async () => {
    window.alert = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'Bad' }) });
    const onClose = jest.fn();
    setup({ onClose });
    fireEvent.change(screen.getByPlaceholderText('your-email@company.com'), { target: { value: 'sender@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Send Quote/i }));

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Failed to send email: Bad'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
