import { Injectable } from '@nestjs/common';

import { type EmailDriverInterface } from 'src/engine/core-modules/email/drivers/interfaces/email-driver.interface';

import { GmailOAuth2Driver } from 'src/engine/core-modules/email/drivers/gmail-oauth2.driver';
import { LoggerDriver } from 'src/engine/core-modules/email/drivers/logger.driver';
import { SmtpDriver } from 'src/engine/core-modules/email/drivers/smtp.driver';
import { EmailDriver } from 'src/engine/core-modules/email/enums/email-driver.enum';
import { DriverFactoryBase } from 'src/engine/core-modules/twenty-config/dynamic-factory.base';
import { ConfigVariablesGroup } from 'src/engine/core-modules/twenty-config/enums/config-variables-group.enum';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

@Injectable()
export class EmailDriverFactory extends DriverFactoryBase<EmailDriverInterface> {
  constructor(twentyConfigService: TwentyConfigService) {
    super(twentyConfigService);
  }

  protected buildConfigKey(): string {
    const driver = this.twentyConfigService.get('EMAIL_DRIVER');

    if (driver === EmailDriver.LOGGER) {
      return 'logger';
    }

    if (driver === EmailDriver.SMTP) {
      const emailConfigHash = this.getConfigGroupHash(
        ConfigVariablesGroup.EMAIL_SETTINGS,
      );

      return `smtp|${emailConfigHash}`;
    }

    if (driver === EmailDriver.GMAIL_OAUTH2) {
      const emailConfigHash = this.getConfigGroupHash(
        ConfigVariablesGroup.EMAIL_SETTINGS,
      );

      return `gmail-oauth2|${emailConfigHash}`;
    }

    throw new Error(`Unsupported email driver: ${driver}`);
  }

  protected createDriver(): EmailDriverInterface {
    const driver = this.twentyConfigService.get('EMAIL_DRIVER');

    switch (driver) {
      case EmailDriver.LOGGER:
        return new LoggerDriver();

      case EmailDriver.SMTP: {
        const host = this.twentyConfigService.get('EMAIL_SMTP_HOST');
        const port = this.twentyConfigService.get('EMAIL_SMTP_PORT');
        const user = this.twentyConfigService.get('EMAIL_SMTP_USER');
        const pass = this.twentyConfigService.get('EMAIL_SMTP_PASSWORD');
        const noTLS = this.twentyConfigService.get('EMAIL_SMTP_NO_TLS');

        if (!host || !port) {
          throw new Error('SMTP driver requires host and port to be defined');
        }

        const options: {
          host: string;
          port: number;
          auth?: { user: string; pass: string };
          secure?: boolean;
          ignoreTLS?: boolean;
          requireTLS?: boolean;
        } = { host, port };

        if (user && pass) {
          options.auth = { user, pass };
        }

        if (noTLS) {
          options.secure = false;
          options.ignoreTLS = true;
        }

        return new SmtpDriver(options);
      }

      case EmailDriver.GMAIL_OAUTH2: {
        const user = this.twentyConfigService.get('EMAIL_GMAIL_OAUTH2_USER');
        const clientId = this.twentyConfigService.get('AUTH_GOOGLE_CLIENT_ID');
        const clientSecret = this.twentyConfigService.get(
          'AUTH_GOOGLE_CLIENT_SECRET',
        );
        const refreshToken = this.twentyConfigService.get(
          'EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN',
        );

        if (!user || !clientId || !clientSecret || !refreshToken) {
          throw new Error(
            'Gmail OAuth2 driver requires EMAIL_GMAIL_OAUTH2_USER, ' +
              'AUTH_GOOGLE_CLIENT_ID, AUTH_GOOGLE_CLIENT_SECRET, and ' +
              'EMAIL_GMAIL_OAUTH2_REFRESH_TOKEN to be defined',
          );
        }

        return new GmailOAuth2Driver({
          user,
          clientId,
          clientSecret,
          refreshToken,
        });
      }

      default:
        throw new Error(`Invalid email driver: ${driver}`);
    }
  }
}
