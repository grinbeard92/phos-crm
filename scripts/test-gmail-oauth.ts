#!/usr/bin/env npx ts-node
/**
 * Test Gmail OAuth2 Configuration
 *
 * This script tests if your Gmail OAuth2 configuration is working correctly.
 * It will attempt to get an access token using your refresh token and send a test email.
 *
 * Usage:
 *   npx ts-node scripts/test-gmail-oauth.ts
 */

import * as readline from 'readline';

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
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

async function testRefreshToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  console.log('\n1. Testing refresh token exchange...');

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = (await response.json()) as TokenResponse;

    if (data.error) {
      return {
        success: false,
        error: `${data.error}: ${data.error_description}`
      };
    }

    if (data.access_token) {
      return { success: true, accessToken: data.access_token };
    }

    return { success: false, error: 'No access token in response' };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

interface TokenInfo {
  email?: string;
  scope?: string;
  expires_in?: number;
}

async function getTokenInfo(accessToken: string): Promise<void> {
  console.log('\n2. Getting token info...');

  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`
    );
    const data = (await response.json()) as TokenInfo;

    console.log('   Token info:');
    console.log(`   - Email: ${data.email || 'N/A'}`);
    console.log(`   - Scopes: ${data.scope || 'N/A'}`);
    console.log(`   - Expires in: ${data.expires_in || 'N/A'} seconds`);

    if (!data.scope?.includes('gmail.send')) {
      console.log('\n   WARNING: Token does NOT have gmail.send scope!');
      console.log('   You need to re-authorize with the gmail.send scope.');
    }
  } catch (err) {
    console.log(`   Error getting token info: ${err}`);
  }
}

async function testSendEmail(
  accessToken: string,
  userEmail: string,
  toEmail: string
): Promise<void> {
  console.log('\n3. Testing email send via Gmail API...');

  // Create a simple test email
  const emailContent = [
    `From: ${userEmail}`,
    `To: ${toEmail}`,
    'Subject: Twenty CRM - Gmail OAuth2 Test',
    'Content-Type: text/plain; charset=utf-8',
    '',
    'This is a test email from Twenty CRM to verify Gmail OAuth2 is working correctly.',
    '',
    `Sent at: ${new Date().toISOString()}`,
  ].join('\r\n');

  // Base64url encode the email
  const encodedEmail = Buffer.from(emailContent)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedEmail }),
      }
    );

    if (response.ok) {
      const data = (await response.json()) as { id: string };
      console.log(`   SUCCESS! Email sent. Message ID: ${data.id}`);
    } else {
      const error = await response.json();
      console.log(`   FAILED: ${JSON.stringify(error, null, 2)}`);
    }
  } catch (err) {
    console.log(`   Error: ${err instanceof Error ? err.message : err}`);
  }
}

async function main() {
  console.log('\nGmail OAuth2 Configuration Tester\n');
  console.log('='.repeat(50));

  const clientId = await prompt('Enter Google OAuth Client ID: ');
  const clientSecret = await prompt('Enter Google OAuth Client Secret: ');
  const refreshToken = await prompt('Enter Gmail OAuth2 Refresh Token: ');
  const userEmail = await prompt('Enter Gmail OAuth2 User Email: ');
  const toEmail = await prompt('Enter test recipient email: ');

  // Step 1: Test refresh token
  const tokenResult = await testRefreshToken(clientId, clientSecret, refreshToken);

  if (!tokenResult.success) {
    console.log(`\n   FAILED: ${tokenResult.error}`);
    console.log('\n   Common issues:');
    console.log('   - Refresh token was revoked');
    console.log('   - Client ID/Secret mismatch');
    console.log('   - Token was obtained with different credentials');
    process.exit(1);
  }

  console.log('   SUCCESS: Got access token');

  // Step 2: Get token info
  await getTokenInfo(tokenResult.accessToken!);

  // Step 3: Try sending email
  const sendTest = await prompt('\nSend a test email? (y/n): ');
  if (sendTest.toLowerCase() === 'y') {
    await testSendEmail(tokenResult.accessToken!, userEmail, toEmail);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Test complete!\n');
}

main().catch(console.error);
