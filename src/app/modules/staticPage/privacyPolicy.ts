import { Request, Response } from "express";

export const getStaticPrivacyPolicy = (_req: Request, res: Response) => {
  const html = `
  <!DOCTYPE html>
  <html lang="it">
  <head>
    <meta charset="UTF-8" />
    <title>Privacy Policy - PianoFesta</title>
    <style>
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.7;
        max-width: 900px;
        margin: 40px auto;
        padding: 0 20px;
        color: #333;
        background-color: #faf7ff;
      }
      h1 {
        color: #6A0DAD;
        text-align: center;
      }
      h2 {
        color: #6A0DAD;
        margin-top: 30px;
        font-size: 1.3rem;
      }
      ul {
        margin-top: 5px;
        margin-bottom: 20px;
        padding-left: 20px;
      }
      strong {
        color: #000;
      }
      p {
        margin-bottom: 12px;
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
    <h1>Privacy Policy di PianoFesta</h1>
    <p><strong>Ultimo aggiornamento:</strong> 8 settembre 2025</p>

    <h2>1. Titolare del Trattamento</h2>
    <p>Il titolare del trattamento è <strong>Luca La Porta</strong>, con sede in [inserire indirizzo], titolare della piattaforma PianoFesta.</p>
    <p><strong>Email di contatto per privacy:</strong> <a href="mailto:info@pianofesta.it" style="color:#6A0DAD;">info@pianofesta.it</a></p>

    <h2>2. Dati raccolti</h2>
    <p><strong>Utenti regolari:</strong></p>
    <p>Nome, cognome, nickname, email, telefono, data di nascita, sesso, password, referral (ove presente), accettazione Termini & Condizioni, contenuti generati (post, sondaggi, recensioni, messaggi in chat, curriculum inviati), nonché eventuali immagini o file multimediali caricati volontariamente.</p>

    <p><strong>Utenti business:</strong></p>
    <p>Nome, cognome, nickname, email, telefono, password, referral, accettazione Termini & Condizioni, dati aziendali (ragione sociale, P.IVA, descrizioni, immagini).</p>

    <p><strong>Dati evento:</strong></p>
    <p>Per gli eventi creati o seguiti, la piattaforma può raccogliere nome, data, luogo, descrizione, partecipanti e immagini associate, necessari al corretto funzionamento delle funzioni di organizzazione, promozione e partecipazione.</p>

    <p><strong>Dati tecnici:</strong> indirizzo IP, dispositivo, log di accesso, cronologia ricerche (Search History).</p>

    <p><strong>Dati di posizione (geolocalizzazione):</strong></p>
    <p>Previo consenso esplicito dell’utente, l’app può raccogliere la posizione del dispositivo (approssimativa o precisa) al fine di mostrare eventi, fornitori e luoghi nelle vicinanze. La geolocalizzazione è facoltativa e può essere attivata o disattivata in qualsiasi momento dalle impostazioni del dispositivo o dell’app.</p>

    <h2>3. Finalità del trattamento</h2>
    <ul>
      <li>Registrazione e gestione degli account;</li>
      <li>Pubblicazione e gestione di listing (business, eventi, job) e interazioni correlate;</li>
      <li>Accesso a Community e sezione Ispirazioni;</li>
      <li>Gestione di recensioni, chat, follow e salvataggi;</li>
      <li>Invio di comunicazioni promozionali e newsletter;</li>
      <li>Analisi statistiche, profilazione e miglioramento dei servizi;</li>
      <li>Adempimenti fiscali e legali;</li>
      <li>Gestione delle notifiche: inviare comunicazioni interne tramite la piattaforma da parte dei listing business seguiti dall’utente. L’utente riceverà tali notifiche solo se sceglie volontariamente di seguire il listing (funzione “follow”), potendo in qualsiasi momento annullare il follow e interrompere la ricezione delle notifiche.</li>
    </ul>

    <p><strong>Uso dei dati e tutela:</strong> I dati vengono utilizzati esclusivamente per fornire funzionalità della piattaforma, migliorare l’esperienza utente, consentire la comunicazione tra utenti e fornitori, e adempiere agli obblighi di legge. PianoFesta non vende, affitta o cede dati personali a terzi per scopi commerciali.</p>

    <h2>4. Base giuridica</h2>
    <ul>
      <li>Consenso dell’utente;</li>
      <li>Esecuzione del contratto (uso della piattaforma);</li>
      <li>Obblighi legali (fatturazione, conservazione dati fiscali);</li>
      <li>Legittimo interesse (miglioramento servizi, prevenzione abusi).</li>
    </ul>

    <h2>5. Terze parti</h2>
    <p>I dati possono essere condivisi con:</p>
    <ul>
      <li>Google (Gmail, Analytics);</li>
      <li>WooCommerce / Stripe / Klarna / PayPal (pagamenti);</li>
      <li>Amazon AWS (hosting immagini e contenuti);</li>
      <li>Brevo (email marketing e newsletter);</li>
      <li>Firebase (autenticazione, notifiche push e analytics app);</li>
      <li>Altri fornitori esterni di servizi tecnologici, se necessari al funzionamento futuro della piattaforma.</li>
    </ul>
    <p>Tutti i fornitori terzi operano in conformità al GDPR e ai regolamenti vigenti in materia di protezione dei dati.</p>

    <h2>6. Conservazione</h2>
    <ul>
      <li><strong>Dati personali:</strong> fino alla cancellazione dell’account, e comunque per 10 anni successivi alla cancellazione.</li>
      <li><strong>Dati fiscali:</strong> 10 anni.</li>
      <li><strong>Log tecnici:</strong> per un periodo ragionevole, non superiore a 12 mesi salvo esigenze di sicurezza.</li>
    </ul>

    <h2>7. Diritti dell’utente</h2>
    <p>Gli utenti possono esercitare i diritti di accesso, rettifica, cancellazione, limitazione, opposizione e portabilità dei propri dati scrivendo a <a href="mailto:privacy@pianofesta.it" style="color:#6A0DAD;">privacy@pianofesta.it</a>.</p>
    <p>È inoltre possibile richiedere la cancellazione definitiva dell’account, la revoca del consenso alla geolocalizzazione o la disattivazione delle notifiche push in qualsiasi momento.</p>

    <h2>8. Minori</h2>
    <p>La registrazione è consentita a utenti di qualsiasi età, ma per i minori di 18 anni si raccomanda la supervisione di un genitore o tutore. PianoFesta non è responsabile di un utilizzo improprio della piattaforma da parte di minori privi di supervisione.</p>

    <h2>9. Aggiornamenti della Privacy Policy</h2>
    <p>La presente informativa può essere soggetta a modifiche. Eventuali aggiornamenti saranno pubblicati su questa pagina e avranno efficacia dal momento della pubblicazione. Si raccomanda di consultare periodicamente questa sezione per restare informati su eventuali modifiche.</p>

    <footer>© 2025 <strong style="color:#6A0DAD;">PianoFesta</strong>. Tutti i diritti riservati.</footer>
  </body>
  </html>
  `;

  res.send(html);
};
