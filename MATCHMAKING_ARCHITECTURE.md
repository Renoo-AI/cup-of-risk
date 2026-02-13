# Architecture du Système de Matchmaking & Ranking 1vs1

Ce document détaille l'architecture technique pour un moteur de matchmaking performant et un système de classement compétitif, conçu pour la scalabilité horizontale sur Google Cloud Platform.

## 1. Architecture des Données

### Profil Joueur (Schéma Firestore/SQL)
| Champ | Type | Description |
| :--- | :--- | :--- |
| `uid` | string | Identifiant unique Firebase Auth |
| `mmr` | int | Matchmaking Rating (valeur brute utilisée pour l'appariement) |
| `rank_tier` | enum | Grade visuel (ex: Bronze, Silver, Gold, Legend) |
| `mu` | float | Glicko-2 : Niveau de compétence estimé |
| `phi` | float | Glicko-2 : Écart type de la compétence (incertitude) |
| `wins` | int | Nombre total de victoires |
| `losses` | int | Nombre total de défaites |
| `streak` | int | Série de victoires/défaites actuelle |

### Cache de File d'Attente (Redis)
Utilisation des **Sorted Sets** Redis pour une recherche O(log(N)).
- **Key** : `matchmaking:queue`
- **Member** : `player_id`
- **Score** : `mmr`

---

## 2. Logique de Matchmaking

Le processus repose sur une approche **Event-driven** couplée à un worker de réconciliation.

### Étape 1 : Mise en file (Join Queue)
Le client envoie une requête via WebSocket. Le serveur ajoute le joueur au Sorted Set Redis et crée un hash `player:status:{id}` contenant le timestamp d'entrée.

### Étape 2 : Algorithme de Recherche (Dynamic Window)
Un micro-service "Matchmaker" scanne la file d'attente.
- **Fenêtre initiale** : `[mmr - 50, mmr + 50]`
- **Expansion** : Toutes les 5 secondes, la fenêtre s'élargit de `+25` points.
- **Complexité** : Utilisation de `ZRANGEBYSCORE` pour extraire les candidats potentiels.

### Pseudo-code du Matchmaker (Node.js/Go)
```typescript
async function findMatch(player) {
  const waitTime = (Date.now() - player.joinedAt) / 1000;
  const range = 50 + (waitTime * 5); // Expansion dynamique

  const candidates = await redis.zrangebyscore(
    'matchmaking:queue',
    player.mmr - range,
    player.mmr + range,
    'LIMIT', 0, 2
  );

  if (candidates.length >= 2) {
    return createMatch(candidates[0], candidates[1]);
  }
}
```

---

## 3. Formule de Ranking (Elo / Glicko-2)

Nous préconisons l'implémentation du système **Elo** pour sa simplicité ou **Glicko-2** pour une meilleure gestion de l'inactivité.

### Calcul Elo (Post-match)
1. **Espérance de gain** pour le joueur A ($E_A$) :
   $$E_A = \frac{1}{1 + 10^{(R_B - R_A)/400}}$$
2. **Mise à jour du score** ($R'_A$) :
   $$R'_A = R_A + K \cdot (S_A - E_A)$$
   - $K$ : Facteur de développement (ex: 32).
   - $S_A$ : Résultat réel (1 pour victoire, 0 pour défaite).

---

## 4. Flux d'Événements (Séquence WebSocket)

| Acteur | Événement | Payload |
| :--- | :--- | :--- |
| Client | `MATCH_SEARCH` | `{ mode: "ranked" }` |
| Serveur | `SEARCHING` | `{ estimated_wait: "15s" }` |
| Serveur | `MATCH_FOUND` | `{ room_id: "xyz", opponent: { name: "...", rank: "..." } }` |
| Client | `PLAYER_READY` | `{ room_id: "xyz" }` |
| Serveur | `GAME_START` | `{ seed: 1234, turn: "player_1" }` |
| Serveur | `MATCH_RESULT` | `{ old_mmr: 1200, new_mmr: 1215, delta: +15 }` |

---

## 5. Sécurité et Anti-Triche

- **Validation Serveur** : Tous les mouvements et résultats sont calculés côté serveur (Backend-authoritative). Le client n'est qu'une vue.
- **Heartbeat** : Détection des déconnexions via WebSockets. Si un joueur quitte, le serveur attend 30s avant de déclarer un forfait automatique.
- **Rate Limiting** : Limitation des requêtes de mise en file pour éviter le spam du service de matchmaking.
