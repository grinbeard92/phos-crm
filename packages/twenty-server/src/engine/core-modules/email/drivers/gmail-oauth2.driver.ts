import { Logger } from '@nestjs/common';

import {
  createTransport,
  type SendMailOptions,
  type Transporter,
} from 'nodemailer';

import { type EmailDriverInterface } from 'src/engine/core-modules/email/drivers/interfaces/email-driver.interface';

export type GmailOAuth2Options = {
  user: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
};

/**
 * Gmail OAuth2 driver using Nodemailer's OAuth2 transport.
 *
 * IMPORTANT: The refresh token must be obtained with the scope:
 * https://mail.google.com/
 *
 * This is different from the gmail.send scope used for the Gmail API.
 * The full mail.google.com scope is required for SMTP access.
 *
 * @see https://nodemailer.com/smtp/oauth2/
 */
export class GmailOAuth2Driver implements EmailDriverInterface {
  private readonly logger = new Logger(GmailOAuth2Driver.name);
  private transport: Transporter;

  constructor(options: GmailOAuth2Options) {
    this.transport = createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: options.user,
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        refreshToken: options.refreshToken,
      },
    });
  }

  async send(sendMailOptions: SendMailOptions): Promise<void> {
    try {
      const info = await this.transport.sendMail(sendMailOptions);

      this.logger.log(
        `Email to '${sendMailOptions.to}' successfully sent via Gmail OAuth2 (messageId: ${info.messageId})`,
      );
    } catch (err) {
      this.logger.error(
        `Error sending email to '${sendMailOptions.to}' via Gmail OAuth2: ${err}`,
      );
      throw err;
    }
  }
}
