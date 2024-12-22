import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: +process.env.MAIL_PORT,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(to: string, verificationToken: string) {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:8000'}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to,
      subject: 'Email Verification',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #ffffff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 {
              color: #007bff;
            }
            p {
              font-size: 16px;
              line-height: 1.5;
            }
            a {
              display: inline-block;
              padding: 10px 20px;
              font-size: 16px;
              color: #ffffff;
              background-color: #007bff;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 10px;
            }
            a:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Email Verification</h1>
            <p>Thank you for signing up! Please verify your email address by clicking the link below:</p>
            <a href="${verificationLink}">Verify Email</a>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        </body>
        </html>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(to: string, resetToken: string) {
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:8000'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              color: #333;
              background-color: #f9f9f9;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              background-color: #ffffff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 {
              color: #007bff;
            }
            p {
              font-size: 16px;
              line-height: 1.5;
            }
            a {
              display: inline-block;
              padding: 10px 20px;
              font-size: 16px;
              color: #ffffff;
              background-color: #007bff;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 10px;
            }
            a:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Password Reset Request</h1>
            <p>To reset your password, please click the link below:</p>
            <a href="${resetLink}">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        </body>
        </html>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
