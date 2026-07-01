const express = require('express');
const path = require('path');
const { exec } = require('child_process');

const INTERNAL_TOKEN = "SECWALLET_ABCDE12345FGHIJ67890KLMN"; 

const app = express();
app.use(cors());
app.use(express.json());

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

app.get('/api/debug-ping', (req, res) => {
  const targetIp = req.query.ip || '127.0.0.1';

  exec(`ping -c 1 ${targetIp}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(200).json({ output: stdout });
  });
});

app.get('/api/welcome', (req, res) => {
  const name = req.query.name || 'Invité';
  res.send(`<h1>Bienvenue ${name}</h1>`);
});

if (process.env.NODE_ENV !== 'production' || process.env.DOCKER_RUN === 'true') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Le serveur écoute activement sur le port ${PORT}`);
  });
}

module.exports = app;