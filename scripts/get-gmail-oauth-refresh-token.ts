#!/usr/bin/env npx ts-node
/**
 * Gmail OAuth2 Refresh Token Generator
 *
 * This script helps you obtain a refresh token for Gmail OAuth2 system email.
 * It launches a local server to handle the OAuth callback and guides you through
 * the authorization process.
 *
 * Usage:
 *   npx ts-node scripts/get-gmail-oauth-refresh-token.ts
 *
 * Or with environment variables:
 *   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=xxx npx ts-node scripts/get-gmail-oauth-refresh-token.ts
 *
 * Prerequisites:
 * 1. Gmail API must be enabled in your Google Cloud Console
 * 2. OAuth consent screen must be configured with gmail.send scope
 * 3. http://localhost:3333/oauth/callback must be added to authorized redirect URIs
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { execFile } from 'child_process';
import { URL } from 'url';
import * as readline from 'readline';

// Configuration
const OAUTH_PORT = 3333;
const REDIRECT_URI = `http://localhost:${OAUTH_PORT}/oauth/callback`;
// IMPORTANT: https://mail.google.com/ scope is required for SMTP access via Nodemailer
// The gmail.send scope only works with the Gmail REST API, not SMTP
const SCOPES = ['https://mail.google.com/'];

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getConfig(): Promise<OAuthConfig> {
  console.log('\n🔐 Gmail OAuth2 Refresh Token Generator\n');
  console.log('This script will help you obtain a refresh token for Gmail system emails.\n');

  let clientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_CLIENT_ID || '';
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_CLIENT_SECRET || '';

  if (!clientId) {
    clientId = await prompt('Enter your Google OAuth Client ID: ');
  } else {
    console.log(`Using Client ID from environment: ${clientId.substring(0, 20)}...`);
  }

  if (!clientSecret) {
    clientSecret = await prompt('Enter your Google OAuth Client Secret: ');
  } else {
    console.log('Using Client Secret from environment: ***');
  }

  if (!clientId || !clientSecret) {
    console.error('❌ Client ID and Client Secret are required');
    process.exit(1);
  }

  return { clientId, clientSecret };
}

function generateAuthUrl(clientId: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // Force consent to get refresh token
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCodeForTokens(
  code: string,
  config: OAuthConfig
): Promise<TokenResponse> {
  const params = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

function openBrowser(url: string): void {
  const openCommand =
    process.platform === 'darwin'
      ? 'open'
      : process.platform === 'win32'
        ? 'cmd'
        : 'xdg-open';

  const args =
    process.platform === 'win32' ? ['/c', 'start', '', url] : [url];

  execFile(openCommand, args, (err) => {
    if (err) {
      console.log('Could not open browser automatically. Please visit the URL above.');
    }
  });
}

async function startOAuthFlow(config: OAuthConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer(
      async (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url || '', `http://localhost:${OAUTH_PORT}`);

        if (url.pathname === '/oauth/callback') {
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');

          if (error) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                  <h1 style="color: #dc2626;">Authorization Failed</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (!code) {
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                  <h1 style="color: #dc2626;">No Authorization Code</h1>
                  <p>No authorization code received.</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(new Error('No authorization code received'));
            return;
          }

          try {
            const tokens = await exchangeCodeForTokens(code, config);

            if (!tokens.refresh_token) {
              res.writeHead(400, { 'Content-Type': 'text/html' });
              res.end(`
                <html>
                  <body style="font-family: system-ui; padding: 40px; text-align: center;">
                    <h1 style="color: #f59e0b;">No Refresh Token</h1>
                    <p>Google did not return a refresh token.</p>
                    <p>This usually means you have already authorized this app.</p>
                    <p>Go to <a href="https://myaccount.google.com/permissions">Google Account Permissions</a>,
                    remove this app, and try again.</p>
                  </body>
                </html>
              `);
              server.close();
              reject(new Error('No refresh token received. Revoke app access and try again.'));
              return;
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                  <h1 style="color: #16a34a;">Success!</h1>
                  <p>Refresh token obtained successfully.</p>
                  <p>Check your terminal for the token and next steps.</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);

            server.close();
            resolve(tokens.refresh_token);
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                  <h1 style="color: #dc2626;">Token Exchange Failed</h1>
                  <p>${err instanceof Error ? err.message : 'Unknown error'}</p>
                  <p>You can close this window.</p>
                </body>
              </html>
            `);
            server.close();
            reject(err);
          }
        } else {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    );

    server.listen(OAUTH_PORT, () => {
      const authUrl = generateAuthUrl(config.clientId);

      console.log('\nPrerequisites:');
      console.log('   1. Gmail API must be enabled in Google Cloud Console');
      console.log('   2. OAuth consent screen must include gmail.send scope');
      console.log(`   3. Add this redirect URI to your OAuth client:\n      ${REDIRECT_URI}\n`);

      console.log('Opening authorization URL...\n');
      console.log(`If browser does not open, visit:\n${authUrl}\n`);

      openBrowser(authUrl);

      console.log('Waiting for authorization...\n');
    });

    server.on('error', (err) => {
      reject(new Error(`Server error: ${err.message}`));
    });
  });
}

async function main() {
  try {
    const config = await getConfig();
    const refreshToken = await startOAuthFlow(config);

    console.log('\n' + '='.repeat(60));
    console.log('SUCCESS! Here is your refresh token:\n');
    console.log(refreshToken);
    console.log('\n' + '='.repeat(60));

    console.log('\nAdd these to your .env file:\n');
    console.log('EMAIL_DRIVER=gmail-oauth2');
    console.log(`EMAIL_GMAIL_OAUTH2_USER=<the-email-you-just-authorized>`);
    console.log(`EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN=${refreshToken}`);

    console.log('\nOr configure in Twenty Admin Panel:');
    console.log('   Settings -> Developers -> Server Config -> Email Settings\n');

    process.exit(0);
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
