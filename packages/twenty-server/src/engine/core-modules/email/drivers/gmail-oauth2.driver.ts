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

export class GmailOAuth2Driver implements EmailDriverInterface {
  private readonly logger = new Logger(GmailOAuth2Driver.name);
  private transport: Transporter;

  constructor(options: GmailOAuth2Options) {
    this.transport = createTransport({
      service: 'gmail',
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
    this.transport
      .sendMail(sendMailOptions)
      .then(() =>
        this.logger.log(
          `Email to '${sendMailOptions.to}' successfully sent via Gmail OAuth2`,
        ),
      )
      .catch((err) =>
        this.logger.error(
          `Error sending email to '${sendMailOptions.to}' via Gmail OAuth2: ${err}`,
        ),
      );
  }
}
