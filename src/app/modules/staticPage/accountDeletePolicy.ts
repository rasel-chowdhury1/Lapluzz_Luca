import { Request, Response } from "express";

export const getStaticAccountDeletePolicy = (_req: Request, res: Response) => {
  const html = `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Delete Account - Memorial Moments</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 40px;
      padding: 0;
      background-color: #ffffff;
      color: #333;
      line-height: 1.6;
      text-align: center; /* Center text globally */
    }
    h1 {
      color: #e91e63;
      margin-bottom: 10px;
    }
    h2 {
      color: #e91e63;
      margin-top: 40px;
    }
    ol {
      padding-left: 20px;
      text-align: left; /* Keep lists aligned left if needed */
      display: inline-block;
    }
    .step {
      margin-bottom: 30px;
      text-align: left;
    }
    .illustration {
      display: block;
      margin: 10px auto;
      max-width: 300px; /* Limit width */
      height: auto;
      max-height: 200px; /* Make image smaller */
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 4px;
    }
    footer {
      margin-top: 60px;
      font-size: 0.9rem;
      color: #888;
    }
  </style>
</head>
<body>
  <h1>Steps to Delete Your Account</h1>
  <p>
    Follow these steps to permanently delete your account from the Winwhen app.
  </p>


  <div class="step">
    <h2>Step 1: Tap on Delete</h2>
    <img src="/uploads/static/stepOne.png" alt="Delete Account Step 2 Illustration" class="illustration">
  </div>

  <div class="step">
    <h2>Step 2: Provide Your Password</h2>
    <p>A pop-up will appear; enter your password in the password field.</p>
    <img src="/uploads/static/stepTwo.png" alt="Delete Account Step 3 Illustration" class="illustration">
  </div>

  <div class="step">
    <h2>Step 3: Press the Delete Button</h2>
    <img src="/uploads/static/stepThree.png" alt="Delete Account Step 4 Illustration" class="illustration">
  </div>

  <div class="step">
    <h2>Step 4: Account Deleted Successfully</h2>
    <p>Your account will be permanently deleted, and you will no longer have access to it.</p>
    <img src="/uploads/static/stepThree.png" alt="Delete Account Step 5 Illustration" class="illustration">
  </div>

  <footer>
    © 2025 WinWhen App. All rights reserved.
  </footer>
</body>
</html>
  `;

  res.send(html);
};