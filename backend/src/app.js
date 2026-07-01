const express = require('express');
const path = require('path');
const { execFile } = require('child_process');
const cors = require('cors');   // <-- ligne manquante
const rateLimit = require('express-rate-limit');


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

app.get('/api/health', (req, res) => {
  const isDatabaseConfigured = !!process.env.DATABASE_URL;
  const isJwtConfigured = !!process.env.JWT_SECRET;

  if (!isDatabaseConfigured || !isJwtConfigured) {
    return res.status(500).json({
      status: "DOWN",
      error: "Configuration de sécurité manquante : variables d'environnement non détectées"
    });
  }

  res.status(200).json({
    status: "UP",
    timestamp: new Date(),
    vault_status: "CONNECTED_TO_PROD_SECRETS"
  });
});

// Regex stricte : uniquement une adresse IPv4 valide (aucun caractere de shell possible)
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

// Limite de debit : cette route lance un process systeme (ping), on evite le deni de service
const pingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // 5 requetes max par IP et par minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requetes sur /api/debug-ping. Reessayez plus tard.' }
});

app.get('/api/debug-ping', pingLimiter, (req, res) => {
  const targetIp = req.query.ip || '127.0.0.1';

  if (!IPV4_REGEX.test(targetIp)) {
    return res.status(400).json({ error: 'Adresse IP invalide.' });
  }

  // execFile (pas de shell) + arguments separes : aucune injection de commande possible
  execFile('ping', ['-c', '1', targetIp], (error, stdout) => {
    if (error) {
      return res.status(500).json({ error: 'Echec du ping.' });
    }
    res.status(200).json({ output: stdout });
  });
});

function escapeHtml(input) {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.get('/api/welcome', (req, res) => {
  const name = req.query.name || 'Invite';
  res.send(`<h1>Bienvenue ${escapeHtml(name)}</h1>`);
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Le serveur ecoute activement sur le port ${PORT}`);
  });
}

module.exports = app;
