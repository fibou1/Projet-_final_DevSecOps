const request = require('supertest');
const app = require('../src/app');

describe('Test End-to-End (E2E) - Parcours Utilisateur', () => {
  it('devrait exécuter le parcours complet : charger l\'UI puis consommer l\'API de bienvenue personnalisée', async () => {
    // 1. L'utilisateur accède à la page d'accueil (Vérification de la distribution statique)
    const frontendRes = await request(app).get('/index.html');
    expect(frontendRes.statusCode).toEqual(200);
    expect(frontendRes.text).toContain('Plateforme d\'Entraînement DevSecOps');

    // 2. L'utilisateur effectue une action qui appelle l'API de bienvenue
    const apiRes = await request(app).get('/api/welcome?name=Professeur');
    expect(apiRes.statusCode).toEqual(200);
    expect(apiRes.text).toContain('<h1>Bienvenue Professeur</h1>');
  });
});