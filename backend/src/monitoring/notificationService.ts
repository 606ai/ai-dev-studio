import nodemailer from 'nodemailer';
import { WebClient } from '@slack/web-api';
import config from '../config';
import { structuredLogger } from './logger';

interface EmailNotification {
  to: string[];
  subject: string;
  message: string;
}

interface SlackNotification {
  channel: string;
  message: string;
}

class NotificationService {
  private static instance: NotificationService;
  private emailTransporter: nodemailer.Transporter;
  private slackClient?: WebClient;

  private constructor() {
    // Initialize email transport
    this.emailTransporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_SECURE,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD
      }
    });

    // Initialize Slack client if token is provided
    if (config.SLACK_TOKEN) {
      this.slackClient = new WebClient(config.SLACK_TOKEN);
    }
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendEmail({ to, subject, message }: EmailNotification): Promise<void> {
    try {
      await this.emailTransporter.sendMail({
        from: config.SMTP_FROM,
        to: to.join(', '),
        subject,
        text: message,
        html: `<p>${message}</p>`
      });

      await structuredLogger.info('Email notification sent', {
        to,
        subject,
        service: 'NotificationService'
      });
    } catch (error) {
      await structuredLogger.error('Failed to send email notification', {
        error,
        to,
        subject,
        service: 'NotificationService'
      });
      throw error;
    }
  }

  async sendSlackMessage({ channel, message }: SlackNotification): Promise<void> {
    if (!this.slackClient) {
      await structuredLogger.warn('Slack client not configured', {
        service: 'NotificationService'
      });
      return;
    }

    try {
      await this.slackClient.chat.postMessage({
        channel,
        text: message,
        username: 'AI Dev Studio Monitor'
      });

      await structuredLogger.info('Slack notification sent', {
        channel,
        service: 'NotificationService'
      });
    } catch (error) {
      await structuredLogger.error('Failed to send Slack notification', {
        error,
        channel,
        service: 'NotificationService'
      });
      throw error;
    }
  }

  async sendAlertNotification(alert: {
    name: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }): Promise<void> {
    const notifications: Promise<void>[] = [];

    // Send email for warning and error alerts
    if (alert.severity !== 'info') {
      notifications.push(
        this.sendEmail({
          to: config.ALERT_EMAIL_RECIPIENTS,
          subject: `[${alert.severity.toUpperCase()}] ${alert.name}`,
          message: alert.message
        })
      );
    }

    // Send Slack message for all alerts
    notifications.push(
      this.sendSlackMessage({
        channel: config.ALERT_SLACK_CHANNEL,
        message: `*[${alert.severity.toUpperCase()}] ${alert.name}*\n${alert.message}`
      })
    );

    await Promise.all(notifications);
  }
}

export default NotificationService;
