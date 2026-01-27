import { Body, Container, Head, Html, Preview } from '@react-email/components';

export type EmailStyle = 'professional' | 'marketing';

type ComposedEmailProps = {
  /**
   * HTML content to render in the email body.
   * SECURITY NOTE: This content MUST be sanitized with DOMPurify
   * on the backend before being passed to this component.
   * See: SendEmailTool.ts line 245 where sanitization occurs.
   */
  htmlContent: string;
  previewText?: string;
  /**
   * Email style:
   * - 'professional': Full-width, left-aligned, like a normal email (default)
   * - 'marketing': Centered, max-width container, like a newsletter
   */
  style?: EmailStyle;
};

/**
 * Email template for user-composed emails.
 * Wraps raw HTML content in a proper email structure with email-safe styling.
 *
 * SECURITY: The htmlContent is sanitized with DOMPurify on the backend
 * in SendEmailTool.ts before being passed to this template.
 *
 * @example
 * ```typescript
 * import { render } from '@react-email/render';
 * import { ComposedEmail } from 'twenty-emails';
 *
 * const html = await render(
 *   <ComposedEmail htmlContent="<p>Hello World</p>" />
 * );
 * ```
 */
export const ComposedEmail = ({
  htmlContent,
  previewText,
  style = 'professional',
}: ComposedEmailProps) => {
  const isMarketing = style === 'marketing';

  return (
    <Html>
      <Head>
        <style
          /* Email-safe styles for consistent rendering across email clients */
          dangerouslySetInnerHTML={{
            __html: `
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.5;
                color: #333333;
                background-color: #ffffff;
              }
              h1, h2, h3, h4, h5, h6 {
                margin-top: 0;
                margin-bottom: 16px;
                font-weight: 600;
                line-height: 1.3;
              }
              h1 { font-size: 24px; }
              h2 { font-size: 20px; }
              h3 { font-size: 18px; }
              p {
                margin-top: 0;
                margin-bottom: 16px;
              }
              a {
                color: #1a73e8;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
              ul, ol {
                margin-top: 0;
                margin-bottom: 16px;
                padding-left: 24px;
              }
              li {
                margin-bottom: 4px;
              }
              img {
                max-width: 100%;
                height: auto;
                border: 0;
              }
              blockquote {
                margin: 0 0 16px;
                padding: 8px 16px;
                border-left: 4px solid #e0e0e0;
                color: #666666;
              }
              code {
                font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                font-size: 13px;
                background-color: #f5f5f5;
                padding: 2px 4px;
                border-radius: 3px;
              }
              pre {
                font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
                font-size: 13px;
                background-color: #f5f5f5;
                padding: 12px;
                border-radius: 4px;
                overflow-x: auto;
                margin-bottom: 16px;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 16px;
              }
              th, td {
                border: 1px solid #e0e0e0;
                padding: 8px 12px;
                text-align: left;
              }
              th {
                background-color: #f5f5f5;
                font-weight: 600;
              }
            `,
          }}
        />
      </Head>
      {previewText && <Preview>{previewText}</Preview>}
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: '#ffffff',
        }}
      >
        {isMarketing ? (
          // Marketing style: centered, max-width container
          <Container
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              padding: '20px',
            }}
          >
            {/*
              SECURITY: htmlContent is sanitized with DOMPurify on the backend
              in SendEmailTool.ts before reaching this template.
            */}
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </Container>
        ) : (
          // Professional style: full-width, left-aligned like normal email
          <div
            style={{
              padding: '12px 16px',
              maxWidth: '100%',
            }}
          >
            {/*
              SECURITY: htmlContent is sanitized with DOMPurify on the backend
              in SendEmailTool.ts before reaching this template.
            */}
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        )}
      </Body>
    </Html>
  );
};

export default ComposedEmail;
