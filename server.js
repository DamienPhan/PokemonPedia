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
    Teammates: Object,
    "Viability Ceiling": [Number], // Corrigé pour être un tableau
    Abilities: Object,
    "Checks and Counters": [String],
    usage: Number,
    Moves: Object, // Ajusté pour être un objet si Moves est stocké ainsi
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
            // Formater la réponse et assurer que toutes les valeurs sont correctement traitées
            res.json({
                name: pokemon.PName,
                items: pokemon.Items ? JSON.parse(pokemon.Items) : {}, // Si "Items" est une chaîne, la parser en objet
                rawCount: pokemon['Raw count'] || 0, // Valeur par défaut si non définie
                spreads: pokemon.Spreads || {}, // Valeur par défaut si non définie
                teraTypes: Array.isArray(pokemon["Tera Types"]) ? pokemon["Tera Types"] : [], // Vérifier si c'est un tableau
                teammates: pokemon.Teammates || [], // Valeur par défaut si non définie
                viabilityCeiling: Array.isArray(pokemon["Viability Ceiling"]) ? pokemon["Viability Ceiling"] : [], // Vérifier si c'est un tableau
                abilities: pokemon.Abilities || {}, // Valeur par défaut si non définie
                checksAndCounters: pokemon["Checks and Counters"] || [], // Valeur par défaut si non définie
                usage: pokemon.usage || 0, // Valeur par défaut si non définie
                moves: pokemon.Moves || {}, // Valeur par défaut si non définie
                happiness: pokemon.Happiness || 0, // Valeur par défaut si non définie
                image: pokemon.Image || '', // Valeur par défaut si non définie
                index: pokemon.Index || 0, // Valeur par défaut si non définie
                type1: pokemon['Type 1'] || '', // Valeur par défaut si non définie
                type2: pokemon['Type 2'] || '', // Valeur par défaut si non définie
                total: pokemon.Total || 0, // Valeur par défaut si non définie
                stats: {
                    hp: pokemon.HP || 0, // Valeur par défaut si non définie
                    attack: pokemon.Attack || 0, // Valeur par défaut si non définie
                    defense: pokemon.Defense || 0, // Valeur par défaut si non définie
                    spAtk: pokemon['SP. Atk.'] || 0, // Valeur par défaut si non définie
                    spDef: pokemon['SP. Def'] || 0, // Valeur par défaut si non définie
                    speed: pokemon.Speed || 0 // Valeur par défaut si non définie
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
