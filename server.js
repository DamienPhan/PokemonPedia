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
    "Viability Ceiling": [Number],
    Abilities: Object,
    "Checks and Counters": [String],
    usage: Number,
    Moves: Object,
    Happiness: Object,
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

// Fonction pour nettoyer les guillemets excédentaires
function cleanString(str) {
    if (typeof str === 'string') {
        return str.replace(/^"|"$/g, '');  // Supprime les guillemets au début et à la fin de la chaîne
    }
    return str;
}

// Route pour récupérer les informations d'un Pokémon depuis MongoDB
app.get('/api/pokemon/:name', async (req, res) => {
    const pokemonName = req.params.name.toLowerCase();

    console.log(`Recherche du Pokémon : ${pokemonName}`); // Log pour le nom recherché

    try {
        const pokemon = await Pokemon.findOne({ PName: new RegExp(`^${pokemonName}$`, 'i') });

        console.log("Données récupérées depuis MongoDB:", pokemon); // Log pour afficher les données récupérées

        if (pokemon) {
            // Formater la réponse et assurer que toutes les valeurs sont correctement traitées
            res.json({
                name: cleanString(pokemon.PName),
                items: pokemon.Items ? JSON.parse(pokemon.Items) : {},
                rawCount: pokemon['Raw count'] || 0,
                spreads: pokemon.Spreads || {},
                teraTypes: Array.isArray(pokemon["Tera Types"]) ? pokemon["Tera Types"] : [],
                teammates: pokemon.Teammates || [],
                viabilityCeiling: Array.isArray(pokemon["Viability Ceiling"]) ? pokemon["Viability Ceiling"] : [],
                abilities: pokemon.Abilities || {},
                checksAndCounters: pokemon["Checks and Counters"] || [],
                usage: pokemon.usage || 0,
                moves: pokemon.Moves || {},
                happiness: pokemon.Happiness || 0,
                image: cleanString(pokemon.Image),
                index: pokemon.Index || 0,
                type1: cleanString(pokemon['Type 1']) || '',
                type2: cleanString(pokemon['Type 2']) || '',
                total: pokemon.Total || 0,
                stats: {
                    hp: pokemon.HP || 0,
                    attack: pokemon.Attack || 0,
                    defense: pokemon.Defense || 0,
                    spAtk: pokemon['SP. Atk.'] || 0,
                    spDef: pokemon['SP. Def'] || 0,
                    speed: pokemon.Speed || 0
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

// Route pour rechercher des Pokémon par nom partiel
app.get('/api/pokemon/suggestions/:query', async (req, res) => {
    const query = req.params.query.toLowerCase();

    try {
        // Recherche des noms de Pokémon contenant le texte de la requête
        const suggestions = await Pokemon.find(
            { PName: { $regex: query, $options: 'i' } }, // Recherche insensible à la casse
            { PName: 1, _id: 0 } // Renvoyer uniquement les noms des Pokémon
        ).limit(10); // Limiter à 10 résultats

        // Formater les noms pour le front-end
        const pokemonNames = suggestions.map(p => cleanString(p.PName));
        res.json(pokemonNames);
    } catch (error) {
        console.error('Erreur lors de la récupération des suggestions:', error);
        res.status(500).send('Erreur serveur');
    }
});
