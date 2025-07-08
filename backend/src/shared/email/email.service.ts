/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as tls from 'tls';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly templatesPath = path.join(__dirname, '../../templates');
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPassword = this.configService.get<string>('SMTP_PASSWORD');
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = parseInt(
      this.configService.get<string>('SMTP_PORT') || '587',
    );

    const smtpSecure =
      this.configService.get<string>('SMTP_SECURE') !== 'false';

    if (!smtpUser || !smtpPassword) {
      this.logger.error('SMTP credentials are missing in env.');
      return;
    }

    // Explicitly type the emailConfig object
    const emailConfig: SMTPTransport.Options = {
      host: smtpHost,
      port: smtpPort,
      secure: false, // Force false for port 587
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2' as tls.SecureVersion,
      },
    };

    this.transporter = nodemailer.createTransport(emailConfig);

    // Test the connection
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('SMTP connection failed', error);
      } else {
        this.logger.log('SMTP server connection established successfully');
      }
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    verificationCode: string,
  ): Promise<void> {
    await this.sendEmail('welcome.ejs', email, 'Welcome Email', {
      name,
      code: verificationCode,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetCode: string,
  ): Promise<void> {
    await this.sendEmail('reset-password.ejs', email, 'Password Reset Email', {
      name,
      code: resetCode,
    });
  }

  async sendInstructorApplicationEmail(
    adminEmail: string,
    applicantName: string,
    applicantEmail: string,
    applicationDate: string,
    applicationMessage: string,
  ): Promise<void> {
    await this.sendEmail(
      'instructor-application.ejs',
      adminEmail,
      'Instructor Application Email',
      {
        applicantName,
        applicantEmail,
        applicationDate,
        applicationMessage,
      },
    );
  }

  async sendInstructorApprovalEmail(
    email: string,
    instructorName: string,
  ): Promise<void> {
    await this.sendEmail(
      'instructor-approval.ejs',
      email,
      'Instructor Approval Email',
      {
        instructorName,
      },
    );
  }

  async sendInstructorRejectionEmail(
    email: string,
    instructorName: string,
  ): Promise<void> {
    await this.sendEmail(
      'instructor-rejection.ejs',
      email,
      'Instructor Rejection Email',
      {
        instructorName,
      },
    );
  }

  async sendCourseEnrollmentEmail(
    instructorEmail: string,
    instructorName: string,
    studentName: string,
    studentEmail: string,
    courseName: string,
    enrollmentDate: string,
    courseDuration: string,
  ): Promise<void> {
    await this.sendEmail(
      'course-enrollment.ejs',
      instructorEmail,
      'Course Enrollment Email',
      {
        instructorName,
        studentName,
        studentEmail,
        courseName,
        enrollmentDate,
        courseDuration,
      },
    );
  }

  async sendCourseCompletionEmail(
    email: string,
    name: string,
    courseName: string,
    grade: string,
    remarks: string,
  ): Promise<void> {
    await this.sendEmail(
      'course-completion.ejs',
      email,
      'Course Completion Email',
      {
        name,
        courseName,
        grade,
        remarks,
      },
    );
  }

  async sendCourseReminderEmail(
    email: string,
    studentName: string,
    courseName: string,
    courseEndDate: string,
  ): Promise<void> {
    await this.sendEmail(
      'course-reminder.ejs',
      email,
      'Course Reminder Email',
      {
        studentName,
        courseName,
        courseEndDate,
      },
    );
  }

  private async sendEmail(
    templateName: string,
    recipientEmail: string,
    emailType: string,
    variables: Record<string, string>,
  ): Promise<void> {
    try {
      if (!this.transporter) {
        throw new Error('Email service is not properly initialized');
      }

      const template = await this.loadTemplate(templateName);
      const htmlContent = this.replaceTemplatePlaceholders(template, variables);
      const subject = this.getSubjectForTemplate(templateName);

      const fromAddress =
        this.configService.get<string>('SMTP_FROM') ||
        this.configService.get<string>('SMTP_USER');

      if (!fromAddress) {
        throw new Error('Email from address is not configured');
      }

      const mailOptions = {
        from: fromAddress,
        to: recipientEmail,
        subject,
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `${emailType} sent successfully to ${recipientEmail}. Message ID: ${info.messageId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send ${emailType} to ${recipientEmail}`,
        error,
      );
      throw new Error(`Failed to send ${emailType.toLowerCase()}`);
    }
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(this.templatesPath, templateName);

    try {
      return fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      this.logger.error(`Failed to load template ${templateName}`, error);
      throw new Error(`Template ${templateName} not found`);
    }
  }

  private replaceTemplatePlaceholders(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    }

    return result;
  }

  private getSubjectForTemplate(templateName: string): string {
    const subjectMap: Record<string, string> = {
      'welcome.ejs': 'Welcome to SkillSpark!',
      'reset-password.ejs': 'Password Reset Request - SkillSpark',
      'instructor-application.ejs': 'New Instructor Application - SkillSpark',
      'instructor-approval.ejs':
        "Congratulations! You're Approved - SkillSpark",
      'instructor-rejection.ejs': 'Application Update - SkillSpark',
      'course-enrollment.ejs': 'New Course Enrollment - SkillSpark',
      'course-completion.ejs': 'Course Completion - SkillSpark',
      'course-reminder.ejs':
        'Action Required: Complete Your Course Soon! - SkillSpark',
    };

    return subjectMap[templateName] || 'SkillSpark Notification';
  }

  generateVerificationCode(length: number = 6): string {
    const digits = '0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return result;
  }

  generateResetToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
