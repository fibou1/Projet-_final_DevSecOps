// Simulation d'une fonction utilitaire de configuration interne
function generateTokenPrefix(env) {
  if (!env) return 'DEV-';
  return env === 'production' ? 'PROD-' : 'STAGING-';
}

describe('Test Unitaire - Configuration', () => {
  it('devrait retourner le bon préfixe selon l\'environnement', () => {
    expect(generateTokenPrefix('production')).toBe('PROD-');
    expect(generateTokenPrefix('staging')).toBe('STAGING-');
    expect(generateTokenPrefix(null)).toBe('DEV-');
  });
});