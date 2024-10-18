const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Servir les fichiers statiques dans le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Charger la base de données des Pokémon
const pokedex = JSON.parse(fs.readFileSync('./data/pokedex.json', 'utf-8'));

// Route pour rechercher un Pokémon par nom
app.get('/api/pokemon/:name', (req, res) => {
    const name = req.params.name.toLowerCase();
    const pokemon = pokedex[Object.keys(pokedex).find(p => p.toLowerCase() === name)];
    
    if (pokemon) {
        res.json({ name: name.charAt(0).toUpperCase() + name.slice(1), ...pokemon });
    } else {
        res.status(404).json({ error: "Pokemon not found" });
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
