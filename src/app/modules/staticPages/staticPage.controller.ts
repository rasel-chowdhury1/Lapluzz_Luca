import { Request, Response } from 'express';

export const getPrivacyPolicy = (_req: Request, res: Response) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Privacy Policy - WinWhen</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        max-width: 800px;
        margin: 40px auto;
        padding: 0 20px;
      }
      h1, h2 {
        color: #333;
      }
      ul {
        margin: 0;
        padding-left: 20px;
      }
    </style>
  </head>
  <body>
    <h1>Privacy Policy</h1>
    <p>This Privacy Policy describes how <strong>WinWhen</strong> ("we", "us", or "our") collects, uses, and protects your information when you use our mobile application ("App").</p>

    <h2>Information We Collect</h2>
    <p>We may collect the following types of information when you use the WinWhen App:</p>

    <h3>Profile Information:</h3>
    <p>When you create or update your profile, we collect your name, email address, profile photo (if provided), and any other information you choose to share.</p>

    <h3>Event Information:</h3>
    <p>We collect details about events you create or follow, such as event name, type (e.g., sports, academic, music), date, time, location, and participants.</p>

    <h3>Photo & Media Content:</h3>
    <p>If you choose to upload photos related to events (e.g., game highlights, celebration moments), we collect and store these images. This feature is optional and you control what you share.</p>

    <h3>Usage Information:</h3>
    <p>We collect information about your interactions with the App, including which features you use, which events you follow, and your participation (e.g., RSVP status, comments, score updates).</p>

    <h3>Location Data:</h3>
    <p>If you enable location services, we may collect and use your location to show event directions and proximity-based features. You can disable location access at any time through your device settings.</p>

    <h3>Device & Log Data:</h3>
    <p>We may automatically collect certain technical data, such as your device type, operating system, IP address, crash logs, and diagnostic information to improve app performance and security.</p>

    <h2>How We Use Your Information</h2>
    <ul>
      <li>Provide, maintain, and improve the WinWhen App</li>
      <li>Enable you to create, follow, and manage events</li>
      <li>Send event reminders, updates, and push notifications</li>
      <li>Allow users to upload and view event-related photos</li>
      <li>Personalize your experience based on preferences</li>
      <li>Facilitate social engagement, such as comments, reactions, and image sharing</li>
      <li>Enforce our Terms of Use and protect user safety</li>
      <li>Comply with legal obligations</li>
    </ul>

    <h2>Data Sharing and Disclosure</h2>
    <p>We do not sell your personal information. We may share your information:</p>
    <ul>
      <li>With users you are connected to within the App (e.g., friends, family, or private group members)</li>
      <li>With service providers who assist us in operating the App (e.g., cloud hosting, analytics)</li>
      <li>If required by law or legal process</li>
      <li>In the event of a merger, acquisition, or asset sale (you will be notified)</li>
    </ul>

    <h2>Data Security</h2>
    <p>We use reasonable administrative, technical, and physical safeguards to protect your information. However, no system is completely secure, and we cannot guarantee the absolute security of your data.</p>

    <h2>Data Retention</h2>
    <p>We retain your information only as long as necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required by law.</p>

    <h2>Children's Privacy</h2>
    <p>WinWhen is not intended for use by children under the age of 13. We do not knowingly collect personal information from children. If we learn that we have collected such information, we will delete it promptly.</p>

    <h2>Your Choices</h2>
    <p>You can manage your privacy settings through the App or your device, including:</p>
    <ul>
      <li>Editing or deleting your profile</li>
      <li>Adjusting notification preferences</li>
      <li>Disabling location services</li>
      <li>Deleting uploaded photos</li>
      <li>Requesting deletion of your data</li>
    </ul>

    <h2>Contact Us</h2>
    <p>If you have questions or concerns about this Privacy Policy or your data, you may contact us at:</p>
    <p><strong>Email:</strong> winwhenapps@gmail.com</p>
  </body>
  </html>
  `;

  res.send(html);
};