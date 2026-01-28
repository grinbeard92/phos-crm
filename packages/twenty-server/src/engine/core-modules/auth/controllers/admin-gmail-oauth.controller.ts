import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Response, Request } from 'express';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath } from 'twenty-shared/utils';

import { AuthRestApiExceptionFilter } from 'src/engine/core-modules/auth/filters/auth-rest-api-exception.filter';
import { TransientTokenService } from 'src/engine/core-modules/auth/token/services/transient-token.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

/**
 * Controller for admin Gmail OAuth2 system email configuration.
 * This is separate from user account OAuth and uses the https://mail.google.com/
 * scope required for SMTP access via Nodemailer.
 */
@Controller('auth/admin-gmail-oauth')
@UseFilters(AuthRestApiExceptionFilter)
export class AdminGmailOauthController {
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly transientTokenService: TransientTokenService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
  ) {}

  /**
   * Initiates the OAuth flow for admin system email configuration.
   * Requires a valid transient token from an admin user.
   */
  @Get()
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async initiateOAuth(
    @Query('transientToken') transientToken: string,
    @Res() res: Response,
  ) {
    // Verify the transient token to ensure request is from authenticated admin
    const tokenData =
      await this.transientTokenService.verifyTransientToken(transientToken);

    if (!tokenData.workspaceId) {
      return res.status(401).json({ error: 'Invalid token - no workspace' });
    }

    const clientId = this.twentyConfigService.get('AUTH_GOOGLE_CLIENT_ID');

    if (!clientId) {
      return res.status(400).json({
        error:
          'Google OAuth is not configured. Set AUTH_GOOGLE_CLIENT_ID and AUTH_GOOGLE_CLIENT_SECRET.',
      });
    }

    const serverUrl =
      this.twentyConfigService.get('SERVER_URL') || 'http://localhost:3000';
    const callbackUrl = `${serverUrl}/auth/admin-gmail-oauth/callback`;

    // IMPORTANT: https://mail.google.com/ scope is required for SMTP access
    // The gmail.send scope only works with the Gmail REST API, not SMTP
    const scopes = ['email', 'profile', 'https://mail.google.com/'];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent', // Force consent to get refresh token
      state: JSON.stringify({
        transientToken,
        workspaceId: tokenData.workspaceId,
      }),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return res.redirect(authUrl);
  }

  /**
   * Handles the OAuth callback and stores the refresh token in config variables.
   */
  @Get('callback')
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const defaultSubdomain = this.twentyConfigService.get('DEFAULT_SUBDOMAIN');

    // Helper to redirect with error
    const redirectWithError = (errorMessage: string) => {
      const errorUrl = this.workspaceDomainsService.buildWorkspaceURL({
        workspace: {
          subdomain: defaultSubdomain,
          customDomain: null,
          isCustomDomainEnabled: false,
        },
        pathname: getSettingsPath(
          SettingsPath.AdminPanel,
          undefined,
          undefined,
          'config-variables',
        ),
        searchParams: { error: errorMessage },
      });

      return res.redirect(errorUrl.toString());
    };

    if (error) {
      return redirectWithError(`OAuth error: ${error}`);
    }

    if (!code || !state) {
      return redirectWithError('Missing authorization code or state');
    }

    let stateData: { transientToken: string; workspaceId: string };

    try {
      stateData = JSON.parse(state);
    } catch {
      return redirectWithError('Invalid state parameter');
    }

    // Exchange code for tokens
    const clientId = this.twentyConfigService.get('AUTH_GOOGLE_CLIENT_ID');
    const clientSecret = this.twentyConfigService.get(
      'AUTH_GOOGLE_CLIENT_SECRET',
    );
    const serverUrl =
      this.twentyConfigService.get('SERVER_URL') || 'http://localhost:3000';
    const callbackUrl = `${serverUrl}/auth/admin-gmail-oauth/callback`;

    const tokenParams = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    });

    try {
      const tokenResponse = await fetch(
        'https://oauth2.googleapis.com/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: tokenParams.toString(),
        },
      );

      const tokens = (await tokenResponse.json()) as {
        access_token?: string;
        refresh_token?: string;
        error?: string;
        error_description?: string;
      };

      if (tokens.error) {
        return redirectWithError(
          `Token exchange failed: ${tokens.error_description || tokens.error}`,
        );
      }

      if (!tokens.refresh_token) {
        return redirectWithError(
          'No refresh token received. You may need to revoke this app access at https://myaccount.google.com/permissions and try again.',
        );
      }

      // Get user email from access token
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        },
      );

      const userInfo = (await userInfoResponse.json()) as {
        email?: string;
      };

      const userEmail = userInfo.email;

      // Store the refresh token and user email in config variables
      await this.twentyConfigService.set(
        'EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN',
        tokens.refresh_token,
      );

      if (userEmail) {
        await this.twentyConfigService.set(
          'EMAIL_GMAIL_OAUTH2_USER',
          userEmail,
        );
      }

      // Redirect to admin panel config variables with success message
      const successUrl = this.workspaceDomainsService.buildWorkspaceURL({
        workspace: {
          subdomain: defaultSubdomain,
          customDomain: null,
          isCustomDomainEnabled: false,
        },
        pathname: getSettingsPath(
          SettingsPath.AdminPanelConfigVariableDetails,
          { variableName: 'EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN' },
        ),
        searchParams: {
          success: `Gmail OAuth configured for ${userEmail || 'system email'}`,
        },
      });

      return res.redirect(successUrl.toString());
    } catch (err) {
      return redirectWithError(
        `Failed to exchange code for tokens: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}
