// Exécuté une fois au démarrage du serveur : ouvre la connexion MongoDB, crée les index et amorce la base
// AVANT la première visite, au lieu de faire attendre la première cliente (plusieurs secondes sur un hébergeur
// qui se réveille). Sans await : le serveur démarre tout de suite, même si MongoDB est lent ou injoignable.
export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.MONGODB_URI) return;
  void import('./server/db')
    .then(({ getDb }) => getDb())
    .catch((e) => console.warn('[touba] Connexion MongoDB au démarrage impossible (nouvel essai à la première requête) :', e?.message ?? e));
}
