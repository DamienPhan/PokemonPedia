// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurer les dossiers statiques pour `public` et `ressources`
app.use(express.static(path.join(__dirname, 'public')));
app.use('/ressources', express.static(path.join(__dirname, 'ressources'))); // Ajout de `ressources`

// Connexion à MongoDB avec Mongoose
const mongoURI = 'mongodb://localhost:27017/PokemonDB';

mongoose.connect(mongoURI)
    .then(() => console.log("Connecté à MongoDB"))
    .catch(err => console.error("Erreur de connexion à MongoDB :", err));

// Définition du modèle Pokémon, spécifiant ici la collection 'PokemonData'
const pokemonSchema = new mongoose.Schema({
    PName: String,
    Items: String,
    "Raw count": Number,
    Spreads: Object,
    "Tera Types": Object,
    Teammates: [String],
    "Viability Ceiling": Number,
    Abilities: Object,
    "Checks and Counters": [String],
    usage: Number,
    Moves: [String],
    Happiness: Number,
    Image: String,
    Index: Number,
    "Type 1": String,
    "Type 2": String,
    Total: Number,
    HP: Number,
    Attack: Number,
    Defense: Number,
    "SP. Atk.": Number,
    "SP. Def": Number,
    Speed: Number
}, { collection: 'PokemonData' });

const Pokemon = mongoose.model('Pokemon', pokemonSchema);

// Route pour récupérer les informations d'un Pokémon depuis MongoDB
app.get('/api/pokemon/:name', async (req, res) => {
    const pokemonName = req.params.name.toLowerCase();

    try {
        const pokemon = await Pokemon.findOne({ PName: new RegExp(`^${pokemonName}$`, 'i') });

        if (pokemon) {
            res.json({
                name: pokemon.PName,
                items: JSON.parse(pokemon.Items || '{}'),
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
                image: pokemon.Image,
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
    } catch (error) {
        console.error('Erreur lors de la récupération du Pokémon:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
