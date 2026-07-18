const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

// À remplacer par les infos de ton portail développeur Discord
const CLIENT_ID = '1527820293568204870';
const CLIENT_SECRET = 'eMM4_JbrLIsUiSb4I1RpIE7ZOT4xdJO8';
// Vercel va automatiquement injecter l'URL finale ici si tu la laisses dynamique, 
// mais pour l'OAuth Discord, il vaut mieux écrire ton URL Vercel en dur une fois déployée :
// ex: 'https://mon-app-discord.vercel.app'


const PRODUCTION_URL = 'https://TON_PROJET.vercel.app'; 
// =================================================

const REDIRECT_URI = `${PRODUCTION_URL}/api/callback`;

// 1. ROUTE D'ACCUEIL (Accessible via https://TON_PROJET.vercel.app/api)
app.get('/api', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=guilds`;

    res.send(`
        <div style="text-align: center; margin-top: 50px; font-family: sans-serif;">
            <h2>Vérification de sécurité Discord</h2>
            <p>Clique sur le bouton ci-dessous pour lancer l'analyse.</p>
            <a href="${discordAuthUrl}" style="display: inline-block; background: #5865F2; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Lancer la vérification
            </a>
        </div>
    `);
});

// 2. ROUTE CALLBACK (Accessible via https://TON_PROJET.vercel.app/api/callback)
app.get('/api/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('<h1>Code d\'autorisation manquant</h1>');
    }

    try {
        // ÉTAPE A : Échange du code contre l'access_token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', 
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }), 
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        const accessToken = tokenResponse.data.access_token;

        // ÉTAPE B : Récupération des serveurs
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const serveurs = guildsResponse.data;

        // ÉTAPE C : Visualisation du résultat
        // Note importante : Les "console.log" sur Vercel s'affichent dans les "Logs" de ton tableau de bord Vercel en ligne !
        console.log(`=== ANALYSE : ${serveurs.length} SERVEURS TROUVÉS ===`);
        serveurs.forEach(s => console.log(`[+] ${s.name} (ID: ${s.id})`));

        // On renvoie un message de succès à l'utilisateur
        res.send(`
            <div style="text-align: center; margin-top: 50px; font-family: sans-serif; color: #2ecc71;">
                <h1>✓ Analyse de sécurité réussie</h1>
                <p style="color: #333;">L'analyse est terminée, tu peux fermer cette fenêtre.</p>
            </div>
        `);

    } catch (error) {
        console.error('Erreur :', error.response ? error.response.data : error.message);
        res.status(500).send('Erreur lors de la communication avec Discord.');
    }
});

// Exporter l'application pour l'environnement Serverless de Vercel
module.exports = app;