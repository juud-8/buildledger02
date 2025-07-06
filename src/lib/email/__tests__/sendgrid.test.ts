import sgMail from '@sendgrid/mail';
import { sendEmail, createQuoteEmail, createInvoiceEmail } from '../sendgrid';

describe('sendgrid utilities', () => {
  const originalEnv = process.env.SENDGRID_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.SENDGRID_API_KEY = originalEnv;
  });

  it('throws if api key missing', async () => {
    delete process.env.SENDGRID_API_KEY;
    await expect(sendEmail({
      to: 'a@example.com',
      from: 'b@example.com',
      subject: 'Sub',
      text: 'hi',
      html: '<p>hi</p>'
    })).rejects.toThrow('SendGrid API key not configured');
  });

  it('sends email successfully', async () => {
    process.env.SENDGRID_API_KEY = 'key';
    const sendMock = jest.spyOn(sgMail, 'send').mockResolvedValue([{statusCode: 202, headers: {'x-message-id': '123'}}] as any);
    const result = await sendEmail({
      to: 'a@example.com',
      from: 'b@example.com',
      subject: 'Sub',
      text: 'hi',
      html: '<p>hi</p>'
    });
    expect(sendMock).toHaveBeenCalled();
    expect(result).toEqual({ success: true, messageId: '123' });
  });

  it('propagates send errors', async () => {
    process.env.SENDGRID_API_KEY = 'key';
    jest.spyOn(sgMail, 'send').mockRejectedValue(new Error('fail'));
    await expect(sendEmail({
      to: 'a@example.com',
      from: 'b@example.com',
      subject: 'Sub',
      text: 'hi',
      html: '<p>hi</p>'
    })).rejects.toThrow('fail');
  });
});

describe('email templates', () => {
  it('creates quote email with default message', () => {
    const q = createQuoteEmail('Client', 'Q1', 'ACME');
    expect(q.subject).toContain('Q1');
    expect(q.text).toContain('Client');
    expect(q.html).toContain('Quote Q1');
  });

  it('creates invoice email with custom message', () => {
    const inv = createInvoiceEmail('Client', 'I1', 'ACME', '1/1/2020', '$100', 'Hello');
    expect(inv.subject).toContain('I1');
    expect(inv.text).toContain('Hello');
    expect(inv.html).toContain('Amount Due');
  });
});
