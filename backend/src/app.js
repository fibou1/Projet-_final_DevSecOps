const express = require('express');
const path = require('path');
const { execFile } = require('child_process');
const cors = require('cors');   // <-- ligne manquante


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

// Regex stricte : uniquement une adresse IPv4 valide (aucun caractère de shell possible)
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

app.get('/api/debug-ping', (req, res) => {
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
  const name = req.query.name || 'Invité';
  res.send(`<h1>Bienvenue ${escapeHtml(name)}</h1>`);
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Le serveur écoute activement sur le port ${PORT}`);
  });
}

module.exports = app;