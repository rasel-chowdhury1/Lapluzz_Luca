import { sendEmail } from "./mailSender";



interface OtpSendEmailParams {
  sentTo: string;
  subject: string;
  name: string;
  otp: string | number;
  expiredAt: string;
  expireTime: string;
}


interface WelcomeEmailParams {
  sentTo: string;
  subject: string;
  name: string;
}

const otpSendEmail = async ({
  sentTo,
  subject,
  name,
  otp,
  expiredAt,
  expireTime,
}: OtpSendEmailParams): Promise<void> => {



  // Send the email
  await sendEmail(
    sentTo,
    subject,
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; background-color: #FAF4FF;">
  <h1 style="color: #333; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 10px;">Email OTP</h1>
  <hr style="border: 0; border-top: 2px solid #6A0DAD; margin: 20px 0;" />
  <p style="font-size: 16px; color: #333; line-height: 1.5;">Dear ${name},</p>
  <p style="font-size: 18px; color: #333; margin-top: 20px; line-height: 1.5;">Your One-Time Password (OTP) is:</p>
  <div style="background-color: #6A0DAD; color: white; font-size: 24px; font-weight: bold; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; width: fit-content; margin-left: auto; margin-right: auto;">
    ${otp}
  </div>
  <p style="font-size: 16px; color: #333; line-height: 1.5;">Please use this OTP to complete your login process. Do not share this code with anyone.</p>
  <p style="font-size: 14px; color: #666; line-height: 2.5; text-align: center;">Note: This OTP is valid until <strong style="color: #FF6347;">${expireTime}</strong> minutes.</p>
  <p style="font-size: 14px; color: #666; line-height: 2.5;">If you did not request this OTP, please disregard this email or contact our support team.</p>
  <div style="margin-top: 30px; font-size: 14px; color: #333; text-align: center;">
    <p style="margin: 0;">Thank you for using Pianofesta's platform. We are here to support your business growth!</p>
  </div>
</div>`
  );
};



const welcomeEmail = async ({
  sentTo,
  subject,
  name,
}: WelcomeEmailParams): Promise<void> => {
  await sendEmail(
    sentTo,
    subject,
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; background-color: #F9FAFB;">
      <h1 style="color: #333; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 10px;">🎉 Welcome to Pianofesta!</h1>
      <hr style="border: 0; border-top: 2px solid #4CAF50; margin: 20px 0;" />
      <p style="font-size: 16px; color: #333; line-height: 1.5;">Dear ${name},</p>
      <p style="font-size: 16px; color: #333; margin-top: 15px; line-height: 1.6;">
        We’re excited to have you onboard! 🎊 <br/>
        Your registration has been <strong style="color:#4CAF50;">successfully completed</strong>.
      </p>
      <p style="font-size: 16px; color: #333; margin-top: 15px; line-height: 1.6;">
        You can now log in, explore opportunities, and make the most of our platform.
      </p>
      <div style="margin: 25px 0; text-align: center;">
        <a href="https://pianofesta.it/login" 
          style="background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
          Get Started
        </a>
      </div>
      <p style="font-size: 14px; color: #666; line-height: 1.8; text-align: center;">
        If you have any questions, feel free to contact our support team anytime.
      </p>
      <div style="margin-top: 30px; font-size: 14px; color: #333; text-align: center;">
        <p style="margin: 0;">Thank you for joining Pianofesta. Let’s grow together! 🚀</p>
      </div>
    </div>`
  );
};


 const sendNotificationEmailForReview = async ({
  sentTo,
  subject,
  name,
  userMsg,
  platform,
}: {
  sentTo: string;
  subject: string;
  name: string;
  userMsg: string;
  platform: string
}): Promise<void> => {
  await sendEmail(
    sentTo,
    subject,
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; background-color: #F9FAFB;">
  <h1 style="color: #333; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 10px;">🔔 New Notification from ${platform}</h1>
  <hr style="border: 0; border-top: 2px solid #4CAF50; margin: 20px 0;" />
  <p style="font-size: 16px; color: #333; line-height: 1.5;">Dear ${name},</p>
  <p style="font-size: 16px; color: #333; margin-top: 15px; line-height: 1.6;">
    You have a new notification regarding your recent interaction on <strong>[Your Platform Name]</strong>.
  </p>
  <div style="background-color: #4CAF50; color: white; font-size: 18px; font-weight: bold; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; width: fit-content; margin-left: auto; margin-right: auto;">
    ${userMsg}
  </div>
  <p style="font-size: 16px; color: #333; margin-top: 15px; line-height: 1.6;">
    Please review the details and take any necessary actions as needed.
  </p>
  <p style="font-size: 14px; color: #666; line-height: 1.8; text-align: center;">
    If you have any questions or need assistance, please don't hesitate to contact our support team.
  </p>
  <div style="margin-top: 30px; font-size: 14px; color: #333; text-align: center;">
    <p style="margin: 0;">Thank you for being a valued member of <strong>${platform}</strong>! 🙏</p>
  </div>
</div>`
  );
};

export { otpSendEmail, welcomeEmail, sendNotificationEmailForReview };
