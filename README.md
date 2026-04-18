# AniTrack Backend

API Vercel qui scrape AnimeHeaven en temps réel.

## Structure
```
anitrack/
├── api/
│   └── anime.js      ← endpoint GET /api/anime
├── vercel.json       ← config Vercel
└── README.md
```

## Déploiement

1. Crée un repo GitHub et mets ces fichiers dedans
2. Va sur vercel.com → "Add New Project"
3. Importe le repo GitHub
4. Clique "Deploy" — c'est tout !

## Utilisation

Une fois déployé, ton API sera accessible à :
```
https://TON-PROJET.vercel.app/api/anime
```

Elle retourne :
```json
{
  "animes": [...],
  "updatedAt": "2026-04-18T..."
}
```

Mise en cache : 30 minutes côté Vercel (gratuit).
