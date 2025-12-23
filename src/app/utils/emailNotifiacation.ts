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
  <p style="font-size: 18px; color: #333; margin-top: 20px; line-height: 1.5;">La tua Password Monouso (OTP) è:</p>
  <div style="background-color: #6A0DAD; color: white; font-size: 24px; font-weight: bold; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; width: fit-content; margin-left: auto; margin-right: auto;">
    ${otp}
  </div>
  <p style="font-size: 16px; color: #333; line-height: 1.5;">Usa questo OTP per completare il processo di accesso. Non condividere questo codice con nessuno.</p>
  <p style="font-size: 14px; color: #666; line-height: 2.5; text-align: center;">Nota: Questo OTP è valido fino a  <strong style="color: #FF6347;">${expireTime}</strong> minuti.</p>
  <p style="font-size: 14px; color: #666; line-height: 2.5;">Se non hai richiesto questo OTP, ignora questa email o contatta il nostro team di supporto.</p>
  <div style="margin-top: 30px; font-size: 14px; color: #333; text-align: center;">
    <p style="margin: 0;">Grazie per utilizzare la piattaforma di Pianofesta. Siamo qui per supportare la crescita della tua attività!</p>
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
  <h1 style="color: #333; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 10px;">🎉 Benvenuto su Pianofesta!</h1>
  <hr style="border: 0; border-top: 2px solid #4CAF50; margin: 20px 0;" />
  <p style="font-size: 16px; color: #333; line-height: 1.5;">Caro ${name},</p>
  <p style="font-size: 16px; color: #333; margin-top: 15px; line-height: 1.6;">
    Siamo entusiasti di averti a bordo! 🎊 <br/>
    La tua registrazione è stata <strong style="color:#4CAF50;">completata con successo</strong>.
  </p>
  <p style="font-size: 16px; color: #333; margin-top: 15px; line-height: 1.6;">
    Ora puoi accedere, esplorare le opportunità e sfruttare al massimo la nostra piattaforma.
  </p>
  <div style="margin: 25px 0; text-align: center;">
    <a href="https://pianofesta.it/login" 
      style="background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">
      Inizia Ora
    </a>
  </div>
  <p style="font-size: 14px; color: #666; line-height: 1.8; text-align: center;">
    Se hai domande, non esitare a contattare il nostro team di supporto in qualsiasi momento.
  </p>
  <div style="margin-top: 30px; font-size: 14px; color: #333; text-align: center;">
    <p style="margin: 0;">Grazie per esserti unito a Pianofesta. Cresciamo insieme! 🚀</p>
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
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; background-color: #F9FAFB;">
          <h1 style="color: #333; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 10px;">🔔 Nuova Notifica da ${platform}</h1>
          <hr style="border: 0; border-top: 2px solid #4CAF50; margin: 20px 0;" />
          <p style="font-size: 16px; color: #333; line-height: 1.5;">Caro ${name},</p>
          <p style="font-size: 16px; color: #333; margin-top: 15px; line-height: 1.6;">
            Hai una nuova notifica riguardante la tua recente interazione su <strong>[Nome della tua piattaforma]</strong>.
          </p>
          <div style="background-color: #4CAF50; color: white; font-size: 18px; font-weight: bold; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; width: fit-content; margin-left: auto; margin-right: auto;">
            ${userMsg}
          </div>
          <p style="font-size: 16px; color: #333; margin-top: 15px; line-height: 1.6;">
            Ti preghiamo di rivedere i dettagli e intraprendere le azioni necessarie se necessario.
          </p>
          <p style="font-size: 14px; color: #666; line-height: 1.8; text-align: center;">
            Se hai domande o hai bisogno di assistenza, non esitare a contattare il nostro team di supporto.
          </p>
          <div style="margin-top: 30px; font-size: 14px; color: #333; text-align: center;">
            <p style="margin: 0;">Grazie per essere un membro prezioso di <strong>${platform}</strong>! 🙏</p>
          </div>
        </div>
    `
  );
};

// <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; background-color: #F9FAFB;"> <h1 style="color: #333; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 10px;">🔔 New Notification from ${platform}</h1> <hr style="border: 0; border-top: 2px solid #4CAF50; margin: 20px 0;" /> <p style="font-size: 16px; color: #333; line-height: 1.5;">Dear ${name},</p> <p style="font-size: 16px; color: #333; margin-top: 15px; line-height: 1.6;"> You have a new notification regarding your recent interaction on <strong>[Your Platform Name]</strong>. </p> <div style="background-color: #4CAF50; color: white; font-size: 18px; font-weight: bold; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0; width: fit-content; margin-left: auto; margin-right: auto;"> ${userMsg} </div> <p style="font-size: 16px; color: #333; margin-top: 15px; line-height: 1.6;"> Please review the details and take any necessary actions as needed. </p> <p style="font-size: 14px; color: #666; line-height: 1.8; text-align: center;"> If you have any questions or need assistance, please don't hesitate to contact our support team. </p> <div style="margin-top: 30px; font-size: 14px; color: #333; text-align: center;"> <p style="margin: 0;">Thank you for being a valued member of <strong>${platform}</strong>! 🙏</p> </div> </div>

export { 
        otpSendEmail, 
        welcomeEmail, 
        sendNotificationEmailForReview 
      };
