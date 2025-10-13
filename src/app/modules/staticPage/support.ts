import { Request, Response } from "express";

export const getStaticSupport = (_req: Request, res: Response) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Support Contact Us - PianoFesta</title>
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
    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #f6f6fa;">
      <div style="background-color: #fff; padding: 24px 32px; border-radius: 8px; box-shadow: 0px 2px 12px rgba(0,0,0,0.1); text-align: left; max-width: 400px;">
        <h3 style="margin-bottom: 16px; font-weight: 600; font-family: sans-serif;">Support Contact</h3>
        
        <p style="margin: 4px 0;">
          <strong>Email:</strong>
          <a href="mailto:info@pianofesta.it" style="color: #6A0DAD; text-decoration: none;">info@pianofesta.it</a>
        </p>

        <p style="margin: 4px 0;">
          <strong>Phone:</strong>
          <a href="tel:+393277913497" style="color: #6A0DAD; text-decoration: none;">+39 327 7913497</a>
        </p>

        <p style="margin: 4px 0;">
          <strong>Address:</strong><br />
          Via delle Magnolie 5, 00062 Bracciano (RM), Italy
        </p>
      </div>
    </div>

    <footer>© 2025 PianoFesta. All rights reserved.</footer>
  </body>
  </html>
  `;

  res.send(html);
};
