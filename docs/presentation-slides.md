# Legacy Migrate — Slides de présentation

> 12 slides, ~7 minutes. Les commandes de la démo sont en annexe (dernière page).
> Tout ce qui est annoncé ici a été exécuté et vérifié — les chiffres sont réels.

---

## 1 — Le problème

**Un dépôt legacy, et on ne sait pas par où commencer.**

- 500 fichiers. Une seule personne connaît encore le code.
- 3 migrations à faire. Toutes les deux se chevauchent.
- Chaque fichier modifié casse quelque chose qu'on découvre après.

> La question n'est pas *« peux-tu migrer ce fichier ? »*.
> C'est **« dans quel ordre, et qu'est-ce qui casse ? »**

Personne ne répond à ça. Les LLM répondent à la première question — et c'est pour ça
qu'on a construit ça.

---

## 2 — La réponse en une phrase

> **On ne devine pas le graphe de dépendances. On le parse.**

`require('./storage')` est dans le fichier. On le lit avec une regex. C'est tout.

Conséquence : **le risque affiché est prouvable.** Un juge ouvre n'importe quel fichier
et vérifie lui-même. Aucune affirmation du produit n'est une opinion.

---

## 3 — Architecture : deux moitiés

```
        LLM                    │  REGEX
  (ce qu'il ne peut pas)      │  (ce qu'il doit prouver)
───────────────────────────────┼────────────────────────────
  • transfo syntaxique        │  • qui importe qui
  • génère les tests          │  • in_degree / out_degree
  • commentaire sécurité      │  • ordre topologique valide
  • raisonnement du plan      │  • bandes de risque
───────────────────────────────┴────────────────────────────
        non vérifiable        │     vérifiable
```

La frontière est nette. Un LLM écrit la prose ; le code produit les chiffres.

---

## 4 — La grille 6a, réellement parsée

`demo-repo/` — 4 vrais fichiers qui s'importent :

```
api.js ─────┐
            ├──▶ storage.js ──▶ validator.js
cli.js ─────┘
```

| Fichier | importé par | dépend de | in_degree |
|---|---|---|---|
| `validator.js` | `storage.js` | — | **1** |
| `storage.js` | `api.js`, `cli.js` | `validator.js` | **2** |
| `api.js` | — | `storage.js` | **0** |
| `cli.js` | — | `storage.js` | **0** |

Vérifié par `test_dependency_graph.py` : `ALL PASS`.

---

## 5 — Le plan, et sa contrainte

Le LLM classe. Le code **vérifie que son classement est exécutable**.

> Si A importe B, alors B doit avoir une priorité plus basse.
> Un plan qu'on ne peut pas exécuter n'est pas un plan faible — c'est un **plan faux**.

Premier bug trouvé et corrigé : le modèle plaçait `api.js` (#2) **avant** `storage.js` (#4).
C'est impossible, `api.js` importe `storage.js`. La cause était notre prompt, pas le modèle.

**Résultat : 3 exécutions consécutives, ordre identique.**

| # | Fichier | Risque | in_degree |
|---|---|---|---|
| 1 | `validator.js` | medium | 1 |
| 2 | `storage.js` | **high** | **2** |
| 3 | `api.js` | low | 0 |
| 4 | `cli.js` | low | 0 |

C'est aussi exactement l'ordre du script de démo : *« fix validator.js first — small,
safe, unblocks two other files »*.

---

## 6 — Le risque est une bande, pas un avis

`risk_level` est **calculé en code** depuis `in_degree`. Jamais demandé au modèle.

| in_degree | Risque | Pourquoi |
|---|---|---|
| 0 | `low` | rien ne casse |
| 1 | `medium` | un appelant |
| ≥ 2 | `high` | le goulot |

Le modèle fournit le **texte** (« `api.js` and `cli.js` would need updating ») ; le badge
est dérivé. Bug corrigé : le modèle renvoyait `medium` pour un `in_degree = 0`, en
contradisant une règle écrite deux paragraphes plus haut dans le même prompt.

---

## 7 — Sécurité : 12 échantillons, 2 langues

Le modèle doit passer un audit explicite avant de dire *« no issues found »*.

```
▪ URL/chemin venant d'un paramètre passé à un appel réseau → SSRF
▪ eval, exec, pickle.loads, yaml.load sur donnée non fiable
▪ SQL/shell assemblé par concaténation
▪ clés API codées en dur
▪ shell=True, os.system
▪ traversal de chemin
▪ TLS désactivé, secrets dans les logs
```

**Résultat : 7/7samples Python validés, `LAYER 3 VALIDATED`.**

Les 5 fichiers propres répondent toujours *« no issues found »* — la checklist n'a pas
rendu le modèle paranoïaque. Les 2 fichiers avec vraie exposition réseau sont signalés
avec le nom de la fonction : *« The `fetch` function takes a URL parameter and makes a
network call without any validation or allowlisting »*.

---

## 8 — Ce que le produit refuse de faire

Trois refus, tous involontaires, tous testés :

1. **Ne pas inventer un plan impossible.** Ordre non topologique → rejeté, redemandé.
2. **Ne pas afficher un chiffre qu'on n'a pas calculé.** Avant le chargement du graphe,
   le panneau affiche *rien* — pas un `0` sous un titre « parsed, not predicted ».
3. **Ne pas accepter une carte de dépendances envoyée par le client.** Le graphe est
   reconstruit côté serveur à chaque appel. Tu ne peux pas afficher de fausses
   dépendances à l'écran.

---

## 9 — Les tests

| Suite | Couvre | Résultat |
|---|---|---|
| `test_dependency_graph.py` | Graphe 6a vs design documenté | `ALL PASS` |
| `test_confidence.py` | Logique de confiance (5 cas) | `OK` |
| `test_roadmap.py` | Validation du plan (4 cas) | `OK` |
| `test_full_pipeline.py` | `refactor-repo` → `migration-roadmap` en HTTP réel | `PASS` |
| `validate_security_notes.py` | 7 échantillons, appels API réels | `7/7` |

**422 lignes de tests**, écrites par les trois personnes sur le même module.

---

## 10 — Limites : on les dit nous-mêmes

Un juryadanne la surconfidence plus que l'échec.

| Limite | Statut |
|---|---|
| Le quota des modèles gratuits OpenRouter est épuisé | On tourne sur `gpt-4o-mini`. Si la clé expire, pas de démo. → **Layer 9, capture de secours, en cours** |
| Le dry-run Python a des faux positifs | Un fichier sans test exécuté peut passer. Détecté, non corrigé (pas mon fichier) |
| Les tests générés échouent parfois | Vrai : le code était bon, le test écrit par le modèle était faux |
| Un dépôt réel, pas un monolithe | 4 fichiers, 3 degrees. La regex ne résout pas les imports dynamiques |

La disclosure IA est dans `docs/ai-tool-disclosure.md`.

---

## 11 — Ce qui est construit

| Couche | État |
|---|---|
| Prompts par recipe | ✅ |
| Tests exécutables | ✅ |
| Security notes | ✅ 7/7 |
| Confiance | ✅ |
| Mode repo | ✅ |
| Graphe de dépendances | ✅ |
| Roadmap + validation topologique | ✅ |
| Vue par fichier + blast radius | ✅ |
| **Capture de secours (Layer 9)** | ❌ **en cours** |
| Écran MigrationRoadmap | ❌ (autre personne) |

**Tout est sur `main`.** 15 commits, zéro conflit.

---

## 12 — La démo

**1. Le graphe, pas la prose** (30 s)
- Onglet *Blast radius* → `storage.js` : **2** fichiers cassent, `api.js` + `cli.js`
- `api.js` : **0**. Personne ne l'utilise.

**2. Le plan et sa contrainte** (60 s)
- `validator.js` d'abord, `storage.js` ensuite
- *« Si A importe B, B passe avant »* — et si le modèle se trompe, le code le refuse.

**3. La sécurité** (60 s)
- Un fichier avec `eval()` → le modèle nomme `eval()`, pas « des préoccupations »
- Un fichier propre → *« no issues found »*, sans inventer de problème

**4. Ce qu'on refuse** (30 s)
- Montrer que le panneau affiche *rien* avant chargement — pas un faux `0`

---

## Annexe — commandes

**Backend** (terminal 1)
```powershell
cd backend
python -m uvicorn app.main:app --port 8000
curl.exe http://127.0.0.1:8000/health
```

**Tests** (terminal 2, **depuis `backend/`**)
```powershell
python test_dependency_graph.py     # ALL PASS
python test_confidence.py           # OK
python test_roadmap.py              # OK
python test_full_pipeline.py        # PASS
python validate_security_notes.py   # 7/7
```

**Frontend** (terminal 3)
```powershell
cd frontend
npm run dev
# http://localhost:5173
```

**Scénario** : `callbacks→async/await` → *Small repo* → *Load example* → Submit → *Blast radius*

**Les 3 pièges**
1. Le dossier doit être **`backend`**, pas la racine — sinon `.env` n'est pas lu
2. Le port est **8000**, pas 8001
3. Uvicorn **sans `--reload`** ne recharge pas un prompt modifié — le restart est obligatoire
