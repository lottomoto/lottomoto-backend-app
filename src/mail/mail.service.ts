import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { MAIL_FROM, APP_NAME } from '../common/constants';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  private compileTemplate(name: string, vars: Record<string, any>): string {
    const filePath = path.join(__dirname, 'templates', `${name}.hbs`);
    const source = fs.readFileSync(filePath, 'utf-8');
    const template = Handlebars.compile(source);
    return template(vars);
  }

  async sendWelcomeEmail(to: string, firstname: string, tempPassword: string) {
    const loginUrl = `${this.configService.get<string>('FRONTEND_URL')}/login`;

    const html = this.compileTemplate('welcome', {
      firstname,
      email: to,
      password: tempPassword,
      loginUrl,
    });

    await this.resend.emails.send({
      from: MAIL_FROM,
      to,
      subject: `Bienvenue sur ${APP_NAME}`,
      html,
    });
  }

  async sendResetPasswordEmail(to: string, firstname: string, resetToken: string) {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    const html = this.compileTemplate('reset-password', {
      firstname,
      resetUrl,
    });

    await this.resend.emails.send({
      from: MAIL_FROM,
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html,
    });
  }
}
