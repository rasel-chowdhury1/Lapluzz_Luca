import { Request, Response } from "express";

export const getStaticPrivacyPolicy = (_req: Request, res: Response) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Privacy Policy - PianoFesta</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        max-width: 800px;
        margin: 40px auto;
        padding: 0 20px;
        color: #333;
      }
      h1 {
        color: #6A0DAD;
        text-align: center;
      }
      h2 {
        color: #6A0DAD;
        margin-top: 30px;
      }
      ul {
        margin-top: 5px;
        margin-bottom: 20px;
        padding-left: 20px;
      }
      strong {
        color: #000;
      }
      footer {
        margin-top: 50px;
        text-align: center;
        font-size: 0.9rem;
        color: #777;
      }
    </style>
  </head>
  <body>
    <h1>Privacy Policy</h1>
    <p><strong>Effective Date:</strong> October 2025</p>
    <p>This Privacy Policy describes how <strong>PianoFesta</strong> ("we", "us", or "our") collects, uses, and protects your information when you use our mobile application ("App").</p>

    <h2>1. Information We Collect</h2>
    <ul>
      <li><strong>Profile Information:</strong> When you create or update your profile, we collect your name, email address, profile photo (if provided), and any other information you choose to share.</li>
      <li><strong>Event Information:</strong> We collect details about events you create, follow, or organize, such as event name, type, date, time, location, and participants.</li>
      <li><strong>Photo & Media Content:</strong> If you choose to upload photos for events or inspirations, we collect and store these images. This feature is optional, and you control what you share.</li>
      <li><strong>Messages / Chat Data:</strong> We collect messages and content you send or receive through the app’s direct chat and community features.</li>
      <li><strong>Financial Information:</strong> When you make payments via Stripe, we may collect payment-related information necessary to process transactions. We do not store credit card details; all payment processing is handled securely by Stripe.</li>
      <li><strong>Location Data:</strong> If you enable location services, we may collect and use your device location to show nearby vendors and event locations. You can disable location access anytime through your device settings.</li>
      <li><strong>Device & Log Data:</strong> We automatically collect technical information about your device, including device type, operating system, IP address, crash logs, and diagnostic data to improve app performance and security.</li>
    </ul>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>Provide, maintain, and improve the PianoFesta App</li>
      <li>Enable you to find, manage, and communicate with vendors and planners</li>
      <li>Send notifications about events, bookings, or updates</li>
      <li>Allow users to upload and view event-related photos</li>
      <li>Personalize your experience and provide recommendations</li>
      <li>Facilitate social engagement (comments, chats, and shared content)</li>
      <li>Enforce our Terms of Use and protect user safety</li>
      <li>Comply with legal obligations</li>
    </ul>

    <h2>3. Data Sharing and Disclosure</h2>
    <ul>
      <li>With users you are connected to within the app (e.g., vendors or planners)</li>
      <li>With service providers who assist in operating the app (e.g., Firebase, Stripe, cloud hosting, analytics)</li>
      <li>If required by law or legal process</li>
      <li>In the event of a merger, acquisition, or sale of assets (you will be notified)</li>
    </ul>

    <h2>4. Data Security</h2>
    <p>We use reasonable administrative, technical, and physical safeguards to protect your information. However, no system is completely secure, and we cannot guarantee absolute security.</p>

    <h2>5. Data Retention</h2>
    <p>We retain your information only as long as necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required by law.</p>

    <h2>6. Children’s Privacy</h2>
    <p>PianoFesta is not intended for children under 13. We do not knowingly collect personal information from children. If we learn that such data has been collected, we will delete it promptly.</p>

    <h2>7. Your Choices</h2>
    <ul>
      <li>Editing or deleting your profile</li>
      <li>Adjusting notification preferences</li>
      <li>Disabling location services</li>
      <li>Deleting uploaded photos</li>
      <li>Requesting deletion of your account and associated data</li>
    </ul>
    <p>To request account deletion, contact us at <strong>info@pianofesta.it</strong>.</p>

    <h2>8. Contact Us</h2>
    <p>If you have questions or concerns about this Privacy Policy or your data, you may contact us at:</p>
    <p>
      <strong>Email:</strong> info@pianofesta.it<br />
      <strong>Phone:</strong> +39 327 7913497<br />
      <strong>Address:</strong> Via delle Magnolie 5, 00062 Bracciano (RM), Italy
    </p>

    <footer>© 2025 PianoFesta. All rights reserved.</footer>
  </body>
  </html>
  `;

  res.send(html);
};
