import { Request, Response } from "express";

export const getStaticAccountDeletePolicy = (_req: Request, res: Response) => {
  const html = `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Delete Account - PianoFesta</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 40px;
      padding: 0;
      background-color: #faf7ff;
      color: #333;
      line-height: 1.6;
      text-align: center;
    }
    h1 {
      color: #6A0DAD;
      margin-bottom: 10px;
    }
    h2 {
      color: #6A0DAD;
      margin-top: 20px;
      font-size: 1.3rem;
    }
    p {
      font-size: 1rem;
      margin-bottom: 16px;
    }
    .steps-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
      margin-top: 40px;
    }
    .step {
      text-align: left;
      background-color: #fff;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(106, 13, 173, 0.1);
      padding: 20px;
      max-width: 400px;
      width: 100%;
    }
    .illustration {
      display: block;
      margin: 12px auto;
      max-width: 260px;
      height: auto;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 4px;
      background-color: #fafafa;
    }
    a {
      color: #6A0DAD;
      text-decoration: none;
    }
    footer {
      margin-top: 60px;
      font-size: 0.9rem;
      color: #777;
    }
  </style>
</head>
<body>
  <h1>How to Delete Your Account</h1>
  <p>Follow these steps to permanently delete your account from the PianoFesta app.</p>

  <div class="steps-container">
    <div class="step">
      <h2>Step 1: Tap on “Delete Account”</h2>
      <p>Go to your profile settings and select the <strong>“Delete Account”</strong> option.</p>
      <img src="/uploads/static/firstStepLuca.png" alt="Step 1: Tap Delete Account" class="illustration" />
    </div>

    <div class="step">
      <h2>Step 2: Enter Your Password</h2>
      <p>A confirmation pop-up will appear. Enter your password to verify your identity.</p>
      <img src="/uploads/static/secondStepLuca.png" alt="Step 2: Enter Password" class="illustration" />
    </div>

    <div class="step">
      <h2>Step 3: Confirm Deletion</h2>
      <p>After entering your password, press the <strong>“Delete”</strong> button to continue.</p>
      <img src="/uploads/static/thirdStepLuca.png" alt="Step 3: Confirm Deletion" class="illustration" />
    </div>
  </div>

  <footer>
    © 2025 <strong style="color:#6A0DAD;">PianoFesta</strong>. All rights reserved.
  </footer>
</body>
</html>
  `;

  res.send(html);
};
