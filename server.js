const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques dans le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Charger la base de données des Pokémon avec un chemin relatif sécurisé
const pokedexPath = path.join(__dirname, 'data', 'pokedex.json');

// Vérification de l'existence du fichier et chargement des données
let pokedex;
try {
    pokedex = JSON.parse(fs.readFileSync(pokedexPath, 'utf-8'));
} catch (error) {
    console.error('Erreur lors du chargement du fichier pokedex.json:', error);
    pokedex = []; // Fallback en cas d'erreur
}

app.get('/api/pokemon/:name', (req, res) => {
    const pokemonName = req.params.name.toLowerCase();
    const pokemon = pokedex.find(p => p.PName.toLowerCase() === pokemonName);

    if (pokemon) {
        // On renvoie les données pertinentes
        res.json({
            name: pokemon.PName,
            items: JSON.parse(pokemon.Items),  // Parsing de la chaîne JSON pour les items
            rawCount: pokemon["Raw count"],
            spreads: pokemon.Spreads,
            teraTypes: pokemon["Tera Types"],
            teammates: pokemon.Teammates,
            viabilityCeiling: pokemon["Viability Ceiling"],
            abilities: pokemon.Abilities,
            checksAndCounters: pokemon["Checks and Counters"],
            usage: pokemon.usage,
            moves: pokemon.Moves,
            happiness: pokemon.Happiness,
            image: pokemon.Image,  // Ajout de l'image
            index: pokemon.Index,
            type1: pokemon["Type 1"],
            type2: pokemon["Type 2"],
            total: pokemon.Total,
            stats: {
                hp: pokemon.HP,
                attack: pokemon.Attack,
                defense: pokemon.Defense,
                spAtk: pokemon["SP. Atk."],
                spDef: pokemon["SP. Def"],
                speed: pokemon.Speed,
            }
        });
    } else {
        res.status(404).send('Pokémon non trouvé');
    }
});


// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
