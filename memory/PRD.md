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
- **Scheduler**: APScheduler pour tâches automatisées
- **Upload**: python-multipart pour fichiers

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
- [x] Export Excel avec filtre par année

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

### Rappels par Email (Gmail SMTP)
- [x] Configuration SMTP dans les paramètres
- [x] Test de connexion SMTP
- [x] Envoi de rappels manuels
- [x] Fréquence configurable (quotidien, hebdomadaire, mensuel)
- [x] **Rappels automatiques** (APScheduler - 9h quotidien)

### Mode Sombre
- [x] Toggle dans les paramètres
- [x] Persistance via localStorage
- [x] Design adapté pour tous les composants

### Gestion des Documents
- [x] Upload de fichiers (PDF, DOC, DOCX, JPG, PNG)
- [x] Limite 10MB par fichier
- [x] Types de documents (bail, état des lieux, attestation, etc.)
- [x] Association à un bien, locataire ou bail
- [x] Téléchargement des fichiers
- [x] Suppression de documents
- [x] Recherche et filtrage

### Calendrier Interactif
- [x] Vue mensuelle avec navigation
- [x] Événements de loyers (dus/payés)
- [x] Fins de bail
- [x] Vacances locatives
- [x] Statistiques du mois (attendu, perçu, en attente)
- [x] Sélection de jour avec détails
- [x] Légende des couleurs

### Multi-Utilisateurs / Équipes - NOUVEAU (Février 2026)
- [x] Création d'équipes
- [x] Invitation de membres par email
- [x] Rôles (propriétaire, administrateur, membre, lecteur)
- [x] Gestion des permissions
- [x] Suppression d'équipes
- [x] Retrait de membres

### Journal d'Audit / Historique - NOUVEAU (Février 2026)
- [x] Suivi des créations d'entités
- [x] Suivi des modifications avec détails des changements
- [x] Suivi des suppressions
- [x] Filtrage par type d'entité
- [x] Recherche dans l'historique
- [x] Affichage chronologique

## Persona Utilisateur
**Propriétaire/Gestionnaire Immobilier**
- Possède un ou plusieurs biens locatifs
- A besoin de suivre les loyers et paiements
- Veut générer des quittances facilement
- Souhaite être alerté des événements importants
- Veut envoyer des rappels automatiques
- Nécessite de stocker les documents légaux
- Peut collaborer avec d'autres gestionnaires

## Backlog - Fonctionnalités Futures

### P1 - Haute Priorité
- [ ] Internationalisation (i18n) et support multi-devises
- [ ] Alertes SMS via Twilio

### P2 - Moyenne Priorité
- [ ] Refactoring backend (découpage de server.py)
- [ ] Statistiques avancées avec graphiques

### P3 - Basse Priorité
- [ ] Application mobile native
- [ ] Intégration comptable
- [ ] IA pour prédictions

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

### Documents
- GET /api/documents
- GET /api/documents/{id}
- POST /api/documents/upload
- GET /api/documents/{id}/download
- DELETE /api/documents/{id}

### Calendar
- GET /api/calendar/events?month=X&year=Y

### Export
- GET /api/export/payments
- GET /api/export/payments/excel

### Reminders
- POST /api/reminders/test-smtp
- POST /api/reminders/send
- GET /api/reminders/pending

### Teams - NOUVEAU
- GET/POST /api/teams
- GET/PUT/DELETE /api/teams/{id}
- POST /api/teams/{id}/invite
- GET /api/teams/{id}/invitations
- POST /api/invitations/{token}/accept
- DELETE /api/teams/{id}/members/{user_id}
- PUT /api/teams/{id}/members/{user_id}/role

### Audit Logs - NOUVEAU
- GET /api/audit-logs
- GET /api/audit-logs/entity/{type}/{id}

### Other
- GET /api/dashboard/stats
- GET /api/receipts/{payment_id}
- GET /api/notifications
- GET/PUT /api/notifications/settings

## Tâches Automatisées
- **Rappels de loyers**: Tous les jours à 9h00 (configurable)
  - Vérifie les loyers impayés du mois courant
  - Envoie des emails aux locataires concernés
  - Respecte la fréquence configurée (quotidien/hebdomadaire/mensuel)

## Dates
- Création initiale: Février 2026
- Ajout Export Excel + Rappels Email + Mode Sombre: Février 2026
- Ajout Gestion Documents + Calendrier + Automatisation: Février 2026
- Ajout Multi-Utilisateurs + Journal d'Audit: 2 Février 2026
