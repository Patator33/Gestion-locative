# RentMaestro - Application de Gestion Locative

## Description
Application complète de gestion de parc locatif permettant aux propriétaires et gestionnaires immobiliers de gérer efficacement leurs biens, locataires, loyers et vacances locatives.

## Architecture Technique
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python) avec Motor (MongoDB async)
- **Base de données**: MongoDB
- **Authentification**: JWT (JSON Web Tokens)
- **Export**: OpenPyXL pour fichiers Excel
- **Emails**: Gmail SMTP

## Fonctionnalités Implémentées

### Authentification
- [x] Inscription avec email/mot de passe
- [x] Connexion JWT
- [x] Déconnexion
- [x] Protection des routes

### Gestion des Biens
- [x] CRUD complet (Créer, Lire, Modifier, Supprimer)
- [x] Types de biens variés (appartement, maison, studio, etc.)
- [x] Informations détaillées (adresse, surface, loyer, charges)
- [x] Statut d'occupation
- [x] Photos/images

### Gestion des Locataires
- [x] CRUD complet
- [x] Informations personnelles et contact
- [x] Contact d'urgence
- [x] Notes

### Gestion des Baux
- [x] Création de bail (liaison bien/locataire)
- [x] Date de début et fin optionnelle
- [x] Montant loyer et charges
- [x] Dépôt de garantie
- [x] Jour de paiement configurable
- [x] Résiliation de bail

### Gestion des Paiements
- [x] Enregistrement des paiements
- [x] Différentes méthodes (virement, chèque, CB, espèces)
- [x] Suivi par période (mois/année)
- [x] Suppression de paiements
- [x] **Export Excel** avec filtre par année

### Quittances de Loyer
- [x] Génération automatique
- [x] Export PDF/Impression
- [x] Détail complet (bailleur, locataire, bien, montants)

### Vacances Locatives
- [x] Déclaration manuelle
- [x] Création automatique à la résiliation d'un bail
- [x] Suivi de durée
- [x] Raison de vacance

### Tableau de Bord
- [x] Statistiques temps réel
- [x] Nombre de biens et taux d'occupation
- [x] Loyers attendus vs encaissés
- [x] Graphique des revenus mensuels
- [x] Alertes (paiements en attente, vacances)

### Notifications
- [x] Paramètres configurables
- [x] Alertes loyers en retard
- [x] Alertes fin de bail
- [x] Alertes vacances prolongées
- [x] Marquage lu/non lu

### Rappels par Email (Gmail SMTP) - NOUVEAU
- [x] Configuration SMTP dans les paramètres
- [x] Test de connexion SMTP
- [x] Envoi de rappels manuels
- [x] Fréquence configurable (quotidien, hebdomadaire, mensuel)
- [x] Liste des paiements en attente

### Mode Sombre - NOUVEAU
- [x] Toggle dans les paramètres
- [x] Persistance via localStorage
- [x] Design adapté pour tous les composants

## Persona Utilisateur
**Propriétaire/Gestionnaire Immobilier**
- Possède un ou plusieurs biens locatifs
- A besoin de suivre les loyers et paiements
- Veut générer des quittances facilement
- Souhaite être alerté des événements importants
- Veut envoyer des rappels automatiques

## Backlog - Fonctionnalités Futures

### P1 - Haute Priorité
- [ ] Automatisation complète des rappels (cron job)
- [ ] Historique des modifications

### P2 - Moyenne Priorité
- [ ] Gestion des documents (scan bail, état des lieux)
- [ ] Calendrier des échéances
- [ ] Multi-utilisateurs (gestion d'équipe)

### P3 - Basse Priorité
- [ ] Application mobile native
- [ ] Intégration comptable
- [ ] Statistiques avancées avec IA

## Endpoints API

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Properties
- GET/POST /api/properties
- GET/PUT/DELETE /api/properties/{id}

### Tenants
- GET/POST /api/tenants
- GET/PUT/DELETE /api/tenants/{id}

### Leases
- GET/POST /api/leases
- GET /api/leases/{id}
- PUT /api/leases/{id}/terminate

### Payments
- GET/POST /api/payments
- GET /api/payments/lease/{id}
- DELETE /api/payments/{id}

### Vacancies
- GET/POST /api/vacancies
- PUT /api/vacancies/{id}/end

### Export
- GET /api/export/payments
- GET /api/export/payments/excel

### Reminders
- POST /api/reminders/test-smtp
- POST /api/reminders/send
- GET /api/reminders/pending

### Other
- GET /api/dashboard/stats
- GET /api/receipts/{payment_id}
- GET /api/notifications
- GET/PUT /api/notifications/settings

## Dates
- Création initiale: Février 2026
- Ajout Export Excel + Rappels Email + Mode Sombre: Février 2026
