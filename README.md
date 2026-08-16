# ⏱️ ChronoApp – Gestion du Temps & Supervision RH

[![NestJS](https://img.shields.io/badge/NestJS-10.0-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Angular](https://img.shields.io/badge/Angular-21.0-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **Application web d'entreprise** pour la gestion des pointages, plannings 3x8, demandes d'absence et supervision hiérarchique.  
> Développée dans le cadre d'un stage facultatif à **BMT (Bejaïa Mediterranean Terminal)**.

---

## 🎯 Contexte & Objectif

Ce projet répond au besoin d’un terminal portuaire fonctionnant **24h/24 et 7j/7** :

- Automatisation du suivi des **pointages biométriques** (import Excel).
- Gestion des plannings **normaux** et **roulants (3x8)**.
- Workflow de validation des **demandes d'absence** (congés, RTT, récupération).
- Supervision multi-rôles : **Employé** 👤, **Manager** 👔, **Administrateur** 🛡️.

---

## 🧱 Stack Technologique

| Domaine | Technologie |
| :--- | :--- |
| **Back-end** | NestJS (TypeScript) |
| **Front-end** | Angular 21 (standalone components) |
| **ORM** | Prisma (migrations, client typé) |
| **BDD** | MySQL 8 |
| **Auth** | JWT (Passport) + Bcrypt |
| **UI** | MatDash (Angular Material + Tailwind CSS) |
| **Docs API** | Swagger (OpenAPI) |
| **Justificatifs** | Cloudinary |
| **Tâches planifiées** | `@nestjs/schedule` (CRON jobs) |

---


text

---

## 🚀 Installation & Lancement

### 1. Prérequis
- Node.js (v18+)
- MySQL (v8+)
- Un compte Cloudinary (pour les justificatifs)

### 2. Backend (NestJS)
cd backend/backend
npm install

# Configurer les variables dans .env
cp .env.example .env  # (ou créez le fichier)

# Appliquer les migrations Prisma
npx prisma migrate deploy

# Démarrer le serveur (mode développement)
npm run start:dev
👉 L'API sera disponible sur http://localhost:3000/api
👉 La doc Swagger : http://localhost:3000/api/docs

3. Frontend (Angular)
bash
cd frontend
npm install
ng serve
👉 L'application sera disponible sur http://localhost:4200

🔐 Gestion des Rôles & Accès
Rôle	Description	Accès
EMPLOYE	Collaborateur standard	Espace personnel (profil, planning, pointages, demandes)
MANAGER	Responsable d'organisation (statut virtuel calculé dynamiquement)	Supervision équipe, validation des demandes, assignation plannings
ADMIN	Administrateur système	Gestion complète (CRUD employés, organisations, pointages globaux)
⚠️ Particularité : Il n'existe pas de rôle MANAGER en BDD. Un employé devient manager s'il est rattaché comme managerId d'une organisation. Ce statut est injecté dynamiquement dans le JWT (isManager).

🧠 Logiques Métier Principales
🔹 Arbre organisationnel (Chemin matérialisé)
Les organisations (DG → Direction → Département → Service) sont stockées avec un champ path (ex: "1/3/7/"). Cela permet des requêtes hiérarchiques ultra-rapides sans CTE récursives (indispensable avec MySQL).

🔹 Workflow de validation hiérarchique
Lorsqu'un employé pose une demande :

Le système cherche le manager direct de son organisation.

Si absent, il remonte l'arbre jusqu'à trouver un responsable.

La notification est envoyée au bon manager. Les soldes (congés/RTT) ne sont déduits qu'au moment de la validation.

🔹 Calcul automatique du crédit/débit (Import Excel)
Lors de l'import des pointages biométriques, le système :

Compare les heures réelles avec les heures théoriques du planning.

Déduit les éventuelles absences déjà validées.

Met à jour instantanément le solde RTT et le compteur de crédit/débit.

🔹 Tâches planifiées (CRON)
1er du mois : Attribution de 2.08 jours de congés.

Fin de mois : Clôture du crédit/débit mensuel.

31 décembre : Remise à zéro du solde RTT annuel.

🖥️ Aperçu des Interfaces
Espace Personnel	Espace Management	Administration
Profil, planning, pointages, stats	KPIs équipe, validation, assignation plannings	Supervision globale, CRUD, organigramme
(Captures à insérer)	(Captures à insérer)	(Captures à insérer)
