"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma/prisma.service");
const crypto = require("crypto");
const ADMIN_SECRET_KEY = 'admin123';
let AppController = class AppController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getIndex() {
        let usersCount = 0;
        let totalBalance = 0;
        let activeListings = 0;
        let conciergeCount = 0;
        let dbStatus = 'EN LIGNE';
        try {
            usersCount = await this.prisma.user.count();
            const wallets = await this.prisma.wallet.findMany();
            totalBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0);
            activeListings = await this.prisma.exchange.count({ where: { status: 'available' } });
            conciergeCount = await this.prisma.conciergeRequest.count();
        }
        catch (err) {
            dbStatus = 'HORS LIGNE';
        }
        return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Onyx API - Panneau de Contrôle & Sandbox de Test</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;700;800;900&family=Fira+Code:wght@400;600&display=swap" rel="stylesheet">
        <style>
          :root {
            --bg-base: #060608;
            --bg-panel: rgba(17, 17, 21, 0.85);
            --bg-card: rgba(22, 22, 28, 0.6);
            --border-color: rgba(255, 255, 255, 0.08);
            --border-hover: rgba(255, 255, 255, 0.18);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
            --accent-silver: #d1d5db;
            --accent-yellow: #ffd000;
            --accent-yellow-glow: rgba(255, 208, 0, 0.15);
            --accent-green: #10b981;
            --accent-red: #f43f5e;
            --transition-smooth: all 0.2s ease-in-out;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-base);
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-x: hidden;
            background-image: 
              radial-gradient(circle at 10% 10%, rgba(255, 208, 0, 0.04) 0%, transparent 40%),
              radial-gradient(circle at 90% 90%, rgba(209, 213, 219, 0.03) 0%, transparent 40%);
          }

          header {
            width: 100%;
            max-width: 1200px;
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            backdrop-filter: blur(10px);
          }

          .logo-area {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .logo-icon {
            font-size: 1.8rem;
          }

          .logo-text {
            font-family: 'Outfit', sans-serif;
            font-size: 1.5rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--text-primary) 30%, var(--text-secondary) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
          }

          .logo-sub {
            font-size: 0.65rem;
            color: var(--accent-yellow);
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: -2px;
          }

          .status-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: 40px;
            background-color: var(--bg-panel);
            border: 1px solid var(--border-color);
            font-size: 0.8rem;
            font-weight: 700;
          }

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: ${dbStatus === 'EN LIGNE' ? 'var(--accent-green)' : 'var(--accent-red)'};
            box-shadow: 0 0 10px ${dbStatus === 'EN LIGNE' ? 'var(--accent-green)' : 'var(--accent-red)'};
            animation: pulse 2s infinite;
          }

          main {
            width: 100%;
            max-width: 1200px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            flex-grow: 1;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
          }

          .stat-card {
            background-color: var(--bg-panel);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: var(--transition-smooth);
          }

          .stat-card:hover {
            transform: translateY(-3px);
            border-color: var(--border-hover);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          }

          .stat-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .stat-label {
            font-size: 0.72rem;
            font-weight: 700;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }

          .stat-desc {
            font-size: 0.68rem;
            color: #71717a;
            margin-top: 2px;
          }

          .stat-value {
            font-family: 'Outfit', sans-serif;
            font-size: 1.6rem;
            font-weight: 800;
          }

          .stat-icon {
            font-size: 1.8rem;
          }

          .dashboard-layout {
            display: grid;
            grid-template-columns: 1.3fr 1fr;
            gap: 20px;
          }

          @media (max-width: 968px) {
            .dashboard-layout {
              grid-template-columns: 1fr;
            }
          }

          .panel-section {
            background-color: var(--bg-panel);
            border: 1px solid var(--border-color);
            border-radius: 20px;
            padding: 20px;
            backdrop-filter: blur(10px);
          }

          .section-title {
            font-family: 'Outfit', sans-serif;
            font-size: 1.25rem;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 10px;
          }

          /* Guide rapide */
          .guide-container {
            background-color: rgba(255, 208, 0, 0.03);
            border: 1px dashed rgba(255, 208, 0, 0.2);
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 16px;
            font-size: 0.8rem;
            line-height: 1.4;
          }

          .guide-container h4 {
            font-weight: 800;
            color: var(--accent-yellow);
            margin-bottom: 6px;
          }

          .guide-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 4px;
            color: var(--text-secondary);
          }

          .guide-list span {
            color: var(--text-primary);
            font-weight: 700;
          }

          .api-table-wrapper {
            overflow-x: auto;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }

          th {
            padding: 12px;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-secondary);
            border-bottom: 1.5px solid var(--border-color);
          }

          td {
            padding: 12px;
            font-size: 0.85rem;
            border-bottom: 1px solid var(--border-color);
            vertical-align: middle;
          }

          tr:last-child td {
            border-bottom: none;
          }

          .method-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 800;
            text-transform: uppercase;
            text-align: center;
            min-width: 60px;
          }

          .method-get {
            background-color: rgba(16, 185, 129, 0.12);
            color: var(--accent-green);
            border: 1px solid rgba(16, 185, 129, 0.2);
          }

          .method-post {
            background-color: rgba(255, 208, 0, 0.12);
            color: var(--accent-yellow);
            border: 1px solid rgba(255, 208, 0, 0.2);
          }

          .method-put {
            background-color: rgba(99, 102, 241, 0.12);
            color: #818cf8;
            border: 1px solid rgba(99, 102, 241, 0.2);
          }

          .endpoint-path {
            font-family: 'Fira Code', monospace;
            font-weight: 600;
            color: #ffffff;
            background-color: rgba(255, 255, 255, 0.04);
            padding: 3px 6px;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.06);
            font-size: 0.8rem;
          }

          .endpoint-desc {
            font-size: 0.78rem;
            color: var(--text-secondary);
            display: block;
            margin-top: 3px;
          }

          .action-btn {
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
            transition: var(--transition-smooth);
          }

          .action-btn:hover {
            background: var(--accent-yellow);
            color: #000000;
            border-color: var(--accent-yellow);
            transform: scale(1.03);
          }

          /* Sandbox Console */
          .console-container {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .sandbox-form {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .form-row {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .form-label {
            font-size: 0.78rem;
            font-weight: 700;
            color: var(--text-secondary);
          }

          .input-field {
            background: rgba(255,255,255,0.02);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 10px 14px;
            color: #ffffff;
            font-family: inherit;
            font-size: 0.85rem;
            transition: var(--transition-smooth);
            width: 100%;
          }

          .input-field:focus {
            outline: none;
            border-color: var(--accent-yellow);
            background: rgba(255,255,255,0.04);
          }

          .terminal-window {
            background-color: #030304;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 16px;
            font-family: 'Fira Code', monospace;
            font-size: 0.8rem;
            color: #34d399;
            min-height: 180px;
            max-height: 280px;
            overflow-y: auto;
            box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
          }

          .terminal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            padding-bottom: 8px;
            margin-bottom: 10px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: var(--text-secondary);
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
          }

          .terminal-dots {
            display: flex;
            gap: 4px;
          }

          .tdot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
          }

          .tdot-r { background-color: var(--accent-red); }
          .tdot-y { background-color: var(--accent-yellow); }
          .tdot-g { background-color: var(--accent-green); }

          .send-btn {
            background: linear-gradient(135deg, #ffd000, #ffb300);
            color: #000000;
            border: none;
            border-radius: 10px;
            padding: 12px;
            font-family: inherit;
            font-size: 0.88rem;
            font-weight: 800;
            cursor: pointer;
            transition: var(--transition-smooth);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            box-shadow: 0 4px 10px rgba(255, 208, 0, 0.2);
          }

          .send-btn:hover {
            transform: translateY(-1.5px);
            box-shadow: 0 6px 15px rgba(255, 208, 0, 0.35);
          }

          /* Lock screen container styles */
          .lock-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
            background: rgba(0,0,0,0.2);
            border: 1px dashed var(--border-color);
            border-radius: 16px;
            gap: 16px;
          }

          footer {
            width: 100%;
            max-width: 1200px;
            padding: 20px 24px;
            text-align: center;
            font-size: 0.75rem;
            color: var(--text-secondary);
            border-top: 1px solid var(--border-color);
            margin-top: auto;
          }

          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="logo-area">
            <span class="logo-icon">💎</span>
            <div>
              <div class="logo-text">MOTEUR ONYX</div>
              <div class="logo-sub">Tableau de Bord API REST</div>
            </div>
          </div>
          <div class="status-badge">
            <span class="status-dot"></span>
            BASE NEON : ${dbStatus}
          </div>
        </header>

        <main>
          
          <!-- Grille des statistiques -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-info">
                <span class="stat-label">Utilisateurs</span>
                <span class="stat-value">${usersCount}</span>
                <span class="stat-desc">Nombre de comptes inscrits</span>
              </div>
              <span class="stat-icon">👤</span>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span class="stat-label">Total des soldes</span>
                <span class="stat-value">${totalBalance.toLocaleString('fr-FR')} FCFA</span>
                <span class="stat-desc">Fonds déposés cumulés</span>
              </div>
              <span class="stat-icon">💳</span>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span class="stat-label">Offres d'échange</span>
                <span class="stat-value">${activeListings}</span>
                <span class="stat-desc">Places partagées en bourse</span>
              </div>
              <span class="stat-icon">🤝</span>
            </div>

            <div class="stat-card">
              <div class="stat-info">
                <span class="stat-label">Suivis Concierge</span>
                <span class="stat-value">${conciergeCount}</span>
                <span class="stat-desc">Requêtes SLA 24h traitées</span>
              </div>
              <span class="stat-icon">🛎️</span>
            </div>
          </div>

          <div class="dashboard-layout">
            
            <!-- Colonne Spécifications Endpoints -->
            <section class="panel-section">
              <h2 class="section-title">📂 Actions API disponibles</h2>
              <div class="api-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Point d'accès</th>
                      <th>Opération</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span class="method-badge method-get">GET</span></td>
                      <td>
                        <span class="endpoint-path">/exchange/listings</span>
                        <span class="endpoint-desc">Consulte les abonnements disponibles en bourse</span>
                      </td>
                      <td><button class="action-btn" onclick="selectEndpoint('GET', '/exchange/listings')">Tester</button></td>
                    </tr>
                    <tr>
                      <td><span class="method-badge method-get">GET</span></td>
                      <td>
                        <span class="endpoint-path">/concierge/requests</span>
                        <span class="endpoint-desc">Liste les suivis de conciergerie de l'utilisateur</span>
                      </td>
                      <td><button class="action-btn" onclick="selectEndpoint('GET', '/concierge/requests')">Tester</button></td>
                    </tr>
                    <tr>
                      <td><span class="method-badge method-get">GET</span></td>
                      <td>
                        <span class="endpoint-path">/wallet</span>
                        <span class="endpoint-desc">Vérifie le solde Wave et les limites</span>
                      </td>
                      <td><button class="action-btn" onclick="selectEndpoint('GET', '/wallet', true)">Tester</button></td>
                    </tr>
                    <tr>
                      <td><span class="method-badge method-post">POST</span></td>
                      <td>
                        <span class="endpoint-path">/auth/register</span>
                        <span class="endpoint-desc">Simule l'inscription d'un nouvel utilisateur</span>
                      </td>
                      <td><button class="action-btn" onclick="selectEndpoint('POST', '/auth/register', false, '{&quot;phone&quot;:&quot;771234567&quot;,&quot;password&quot;:&quot;secret123&quot;}')">Tester</button></td>
                    </tr>
                    <tr>
                      <td><span class="method-badge method-post">POST</span></td>
                      <td>
                        <span class="endpoint-path">/auth/login</span>
                        <span class="endpoint-desc">S'authentifie pour obtenir un jeton JWT</span>
                      </td>
                      <td><button class="action-btn" onclick="selectEndpoint('POST', '/auth/login', false, '{&quot;phone&quot;:&quot;771234567&quot;,&quot;password&quot;:&quot;secret123&quot;}')">Tester</button></td>
                    </tr>
                    <tr>
                      <td><span class="method-badge method-post">POST</span></td>
                      <td>
                        <span class="endpoint-path">/wallet/recharge</span>
                        <span class="endpoint-desc">Génère un lien de dépôt Wave</span>
                      </td>
                      <td><button class="action-btn" onclick="selectEndpoint('POST', '/wallet/recharge', true, '{&quot;amount&quot;:5000}')">Tester</button></td>
                    </tr>
                    <tr>
                      <td><span class="method-badge method-put">PUT</span></td>
                      <td>
                        <span class="endpoint-path">/wallet/budget-limit</span>
                        <span class="endpoint-desc">Ajuste le plafond budgétaire mensuel</span>
                      </td>
                      <td><button class="action-btn" onclick="selectEndpoint('PUT', '/wallet/budget-limit', true, '{&quot;limit&quot;:15000}')">Tester</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- Colonne Sandbox -->
            <section class="panel-section console-container">
              <h2 class="section-title">🎮 Console de Test en Direct</h2>
              
              <div class="guide-container">
                <h4>💡 Guide d'utilisation rapide :</h4>
                <ul class="guide-list">
                  <li>1. Cliquez sur <span>"Tester"</span> dans le tableau de gauche.</li>
                  <li>2. Ajustez le corps JSON (si requis) ou ajoutez un ID utilisateur.</li>
                  <li>3. Cliquez sur <span>"Envoyer la Requête"</span> pour voir le résultat.</li>
                </ul>
              </div>

              <div class="sandbox-form">
                <div class="form-row" style="flex-direction: row; gap: 8px; align-items: center;">
                  <span id="console-method" class="method-badge method-get">GET</span>
                  <input type="text" id="console-url" class="input-field" value="/exchange/listings" readonly style="font-family: monospace; font-weight: 700;">
                </div>

                <div class="form-row" id="auth-header-container" style="display: none;">
                  <label class="form-label">ID Utilisateur de test (En-tête x-user-id)</label>
                  <input type="text" id="console-header" class="input-field" placeholder="Entrez un ID utilisateur pour simuler la session">
                </div>

                <div class="form-row" id="payload-container" style="display: none;">
                  <label class="form-label">Paramètres d'envoi (Format JSON)</label>
                  <textarea id="console-body" class="input-field" style="font-family: monospace; min-height: 80px; resize: vertical;"></textarea>
                </div>

                <button class="send-btn" onclick="sendAPIRequest()">
                  ⚡ Envoyer la Requête
                </button>
              </div>

              <div>
                <div class="terminal-header">
                  <div class="terminal-dots">
                    <span class="tdot tdot-r"></span>
                    <span class="tdot tdot-y"></span>
                    <span class="tdot tdot-g"></span>
                  </div>
                  <span>Réponse du Serveur (JSON)</span>
                </div>
                <div id="terminal-output" class="terminal-window">// En attente d'une action... Cliquez sur "Tester" à gauche.</div>
              </div>
            </section>

          </div>

          <!-- SECTION D'ADMINISTRATION SECURISEE (RESERVEE AUX ADMINS 🔥) -->
          <div class="sections-wrapper" style="margin-top: 10px;">
            <section class="panel-section" id="admin-module-panel">
              <h2 class="section-title">👥 Gestion des Comptes &amp; Informations Clients (Accès Admin)</h2>
              
              <!-- Écran de verrouillage par défaut (Rôle Employé Standard) -->
              <div id="lock-screen-area" class="lock-screen-area">
                <div class="lock-container">
                  <span style="font-size: 2.5rem;">🔒</span>
                  <div style="font-weight: 800; font-size: 1.1rem; color: var(--accent-yellow);">Accès Administrateur requis</div>
                  <p style="font-size: 0.8rem; color: var(--text-secondary); max-width: 320px;">
                    Cette section contient des informations confidentielles. Les employés standards ne sont pas autorisés à y accéder. Saisissez la clé d'administration pour déverrouiller.
                  </p>
                  <div style="display: flex; gap: 8px; width: 100%; max-width: 300px; margin-top: 4px;">
                    <input type="password" id="admin-passcode" class="input-field" placeholder="Clé d'accès administrateur" style="text-align: center;">
                    <button class="action-btn" onclick="unlockAdminPanel()">Déverrouiller</button>
                  </div>
                </div>
              </div>

              <!-- Contenu de la table de gestion, masqué par défaut -->
              <div id="admin-content-area" style="display: none;">
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 20px; line-height: 1.5;">
                  🔑 **Privilèges Administrateur Actifs** — Vous disposez d'un droit d'accès de lecture sur les portefeuilles clients Neon et d'écriture pour forcer la réinitialisation de mot de passe en cas d'oubli.
                </p>

                <div class="api-table-wrapper">
                  <table id="admin-users-table">
                    <thead>
                      <tr>
                        <th>Téléphone Wave</th>
                        <th>Type de compte</th>
                        <th>Indicateur Trust</th>
                        <th>Solde Réel Onyx</th>
                        <th>Date d'inscription</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody id="admin-users-tbody">
                      <tr>
                        <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 24px;">
                          Chargement des comptes clients...
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </section>
          </div>
        </main>

        <!-- Modal de réinitialisation de mot de passe (Admin) -->
        <div id="reset-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(8px);">
          <div class="panel-section" style="width: 100%; max-width: 420px; padding: 24px; background-color: #111114; border: 1px solid var(--border-color); box-shadow: 0 10px 40px rgba(0,0,0,0.8);">
            <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1px dashed var(--border-color); padding-bottom: 8px;">
              🔑 Réinitialiser le mot de passe
            </h3>
            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 18px; line-height: 1.4;">
              Vous vous apprêtez à définir un nouveau mot de passe pour l'utilisateur : <strong id="reset-user-phone" style="color: var(--accent-yellow);"></strong>.
            </p>
            
            <div class="sandbox-form">
              <div class="form-row">
                <label class="form-label">Nouveau Mot de Passe (Min. 6 caractères)</label>
                <input type="password" id="reset-new-password" class="input-field" placeholder="••••••••" required minlength="6">
              </div>
              
              <div style="display: flex; gap: 10px; margin-top: 12px;">
                <button class="action-btn" style="flex: 1; justify-content: center; padding: 10px;" onclick="closeResetModal()">Annuler</button>
                <button class="send-btn" style="flex: 2; padding: 10px; font-size: 0.85rem;" onclick="submitAdminReset()">Enregistrer 💾</button>
              </div>
            </div>
          </div>
        </div>

        <footer>
          &copy; 2026 Technologies d'Abonnement Onyx. Propulsé par NestJS, Prisma et Neon Cloud.
        </footer>

        <script>
          // Variable globale pour stocker la clé admin saisie
          let currentAdminKey = '';

          async function unlockAdminPanel() {
            const passcode = document.getElementById('admin-passcode').value;
            if (!passcode) {
              alert('Veuillez saisir votre clé d\\'administration.');
              return;
            }

            try {
              const res = await fetch('/admin/users', {
                headers: {
                  'x-admin-key': passcode
                }
              });
              
              if (res.status === 403) {
                alert('Clé incorrecte. Accès Administrateur refusé.');
                return;
              }

              const users = await res.json();
              currentAdminKey = passcode; // Clé validée

              // Rendu dynamique de la table par manipulation DOM sécurisée sans backticks imbriqués
              const tbody = document.getElementById('admin-users-tbody');
              tbody.innerHTML = ''; // Nettoyer le conteneur

              if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 24px;">Aucun utilisateur enregistré en base de données.</td></tr>';
              } else {
                users.forEach(function(user) {
                  const regDate = new Date(user.createdAt);
                  const isPremium = user.isPremium;
                  const phone = user.phone || 'Sans numéro';
                  const trustScore = user.trustScore || 100;
                  const balance = Number(user.wallet?.balance || 0).toLocaleString('fr-FR');
                  
                  const row = document.createElement('tr');
                  
                  let html = '';
                  html += '<td><strong>' + phone + '</strong></td>';
                  html += '<td><span class="method-badge ' + (isPremium ? 'method-get' : 'method-delete') + '">' + (isPremium ? 'Premium' : 'Gratuit') + '</span></td>';
                  html += '<td style="font-weight: 700; color: ' + (trustScore >= 80 ? 'var(--accent-green)' : 'var(--accent-red)') + '">' + trustScore + '/100</td>';
                  html += '<td style="font-family: monospace; font-weight: 700; color: var(--accent-yellow);">' + balance + ' FCFA</td>';
                  html += '<td style="font-size: 0.8rem; color: var(--text-secondary);">' + regDate.toLocaleDateString('fr-FR') + ' à ' + regDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '</td>';
                  html += '<td><button class="action-btn" onclick="openResetModal(\\'' + phone + '\\')">Réinitialiser le Mot de passe 🔑</button></td>';
                  
                  row.innerHTML = html;
                  tbody.appendChild(row);
                });
              }

              // Masquer l'écran de verrouillage et afficher les données
              document.getElementById('lock-screen-area').style.display = 'none';
              document.getElementById('admin-content-area').style.display = 'block';

            } catch (err) {
              alert('Erreur réseau lors de la validation : ' + err.message);
            }
          }

          function openResetModal(phone) {
            document.getElementById('reset-user-phone').innerText = phone;
            document.getElementById('reset-new-password').value = '';
            document.getElementById('reset-modal').style.display = 'flex';
          }

          function closeResetModal() {
            document.getElementById('reset-modal').style.display = 'none';
          }

          async function submitAdminReset() {
            const phone = document.getElementById('reset-user-phone').innerText;
            const newPass = document.getElementById('reset-new-password').value;
            
            if (!newPass || newPass.length < 6) {
              alert('Le mot de passe doit comporter au moins 6 caractères.');
              return;
            }

            try {
              const res = await fetch('/admin/reset-password', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-admin-key': currentAdminKey
                },
                body: JSON.stringify({ phone, newPass })
              });
              const data = await res.json();
              if (res.ok) {
                alert('Succès ! Le mot de passe de l\\'utilisateur ' + phone + ' a été réinitialisé.');
                closeResetModal();
                // Recharger la liste pour validation
                unlockAdminPanel();
              } else {
                alert('Erreur : ' + data.message);
              }
            } catch (err) {
              alert('Erreur réseau lors de la réinitialisation : ' + err.message);
            }
          }

          function selectEndpoint(method, url, needsAuth, defaultBody) {
            const methodBadge = document.getElementById('console-method');
            const urlInput = document.getElementById('console-url');
            const authContainer = document.getElementById('auth-header-container');
            const payloadContainer = document.getElementById('payload-container');
            const bodyArea = document.getElementById('console-body');

            methodBadge.innerText = method;
            methodBadge.className = 'method-badge method-' + method.toLowerCase();
            urlInput.value = url;

            if (needsAuth) {
              authContainer.style.display = 'flex';
            } else {
              authContainer.style.display = 'none';
            }

            if (defaultBody) {
              payloadContainer.style.display = 'flex';
              bodyArea.value = defaultBody;
            } else {
              payloadContainer.style.display = 'none';
              bodyArea.value = '';
            }
            
            document.getElementById('terminal-output').innerText = '// Prêt à tester ' + method + ' ' + url + '. Modifiez les paramètres ou lancez la requête...';
            document.getElementById('terminal-output').style.color = '#ffd000';
          }

          async function sendAPIRequest() {
            const method = document.getElementById('console-method').innerText;
            const url = document.getElementById('console-url').value;
            const headersVal = document.getElementById('console-header').value;
            const bodyVal = document.getElementById('console-body').value;
            const output = document.getElementById('terminal-output');

            output.innerText = '// Appel API en cours vers : ' + url + '...';
            output.style.color = '#3b82f6';

            const headers = {
              'Content-Type': 'application/json'
            };

            if (headersVal) {
              headers['x-user-id'] = headersVal;
              headers['Authorization'] = 'Bearer ' + headersVal;
            }

            const options = {
              method: method,
              headers: headers
            };

            if (method !== 'GET' && method !== 'DELETE' && bodyVal) {
              options.body = bodyVal;
            }

            try {
              const res = await fetch(url, options);
              const data = await res.json();
              
              output.style.color = res.ok ? '#10b981' : '#f43f5e';
              output.innerText = JSON.stringify(data, null, 2);
            } catch (err) {
              output.style.color = '#f43f5e';
              output.innerText = 'Erreur réseau : ' + err.message + '\\n\\n(Le serveur backend NestJS a peut-être refusé l\\'accès ou la connexion a expiré)';
            }
          }
        </script>
      </body>
      </html>
    `;
    }
    async getAdminUsers(adminKey) {
        if (adminKey !== ADMIN_SECRET_KEY) {
            throw new common_1.ForbiddenException('Accès refusé. Clé d\'administration Onyx invalide.');
        }
        return this.prisma.user.findMany({
            include: { wallet: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async adminResetPassword(adminKey, body) {
        if (adminKey !== ADMIN_SECRET_KEY) {
            throw new common_1.ForbiddenException('Accès refusé. Clé d\'administration Onyx invalide.');
        }
        if (!body.phone || !body.newPass) {
            throw new common_1.BadRequestException('Le numéro de téléphone et le nouveau mot de passe sont requis.');
        }
        const user = await this.prisma.user.findUnique({
            where: { phone: body.phone }
        });
        if (!user) {
            throw new common_1.BadRequestException('Utilisateur introuvable avec ce numéro.');
        }
        if (body.newPass.length < 6) {
            throw new common_1.BadRequestException('Le mot de passe doit comporter au moins 6 caractères.');
        }
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(body.newPass, salt, 1000, 64, 'sha512').toString('hex');
        const passwordHash = `${salt}:${hash}`;
        await this.prisma.user.update({
            where: { phone: body.phone },
            data: { passwordHash }
        });
        return { success: true, message: 'Le mot de passe a été réinitialisé avec succès.' };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Header)('Content-Type', 'text/html'),
    (0, common_1.Header)('Cache-Control', 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0'),
    (0, common_1.Header)('Pragma', 'no-cache'),
    (0, common_1.Header)('Expires', '0'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getIndex", null);
__decorate([
    (0, common_1.Get)('admin/users'),
    __param(0, (0, common_1.Headers)('x-admin-key')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getAdminUsers", null);
__decorate([
    (0, common_1.Post)('admin/reset-password'),
    __param(0, (0, common_1.Headers)('x-admin-key')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "adminResetPassword", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppController);
//# sourceMappingURL=app.controller.js.map