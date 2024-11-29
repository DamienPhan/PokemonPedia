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
app.use('/ressources', express.static(path.join(__dirname, 'ressources')));
app.use('/images', express.static(path.join(__dirname, 'ressources/pokedex')));


// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});

// Connexion à MongoDB
const mongoURI = 'mongodb://localhost:27017/PokemonDB';

mongoose.connect(mongoURI)
    .then(() => console.log("Connecté à MongoDB"))
    .catch(err => console.error("Erreur de connexion à MongoDB :", err));

// Définition du modèle Pokémon
const pokemonSchema = new mongoose.Schema({
    PName: String,
    Items: Object, 
    "Raw count": Number,
    Spreads: Object, 
    "Tera Types": Object,
    Teammates: Object, 
    "Viability Ceiling": [Number],
    Abilities: Object, 
    "Checks and Counters": Object,
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
    SpAtk: Number,
    SpDef: Number,
    Speed: Number
}, { collection: 'PokemonData' });

const Pokemon = mongoose.model('Pokemon', pokemonSchema);

// TEAMS
const teamSchema = new mongoose.Schema({
    teamName: String,
    members: [String],
    timestamp: { type: Date, default: Date.now }
}, { collection: 'Teams', versionKey: false }); // Désactive le champ __v


const Team = mongoose.model('Team', teamSchema);

app.get('/api/pokemon/:name', async (req, res) => {
    const pokemonName = req.params.name.toLowerCase();

    console.log(`Recherche du Pokémon : ${pokemonName}`); // Log pour le nom recherché

    try {
        const pokemon = await Pokemon.findOne({ PName: new RegExp(`^${pokemonName}$`, 'i') });

        //console.log("Données récupérées depuis MongoDB:", pokemon); // Log pour afficher les données récupérées

        if (pokemon) {
            //console.log('Données Pokémon récupérées depuis MongoDB:', pokemon); // Log pour vérifier les données
            res.json({
                name: pokemon.PName,
                items: pokemon.Items || {},
                rawCount: pokemon["Raw count"] || 0,
                spreads: pokemon.Spreads || {},
                teraTypes: pokemon["Tera Types"] || {},
                teammates: pokemon.Teammates || {},
                viabilityCeiling: pokemon["Viability Ceiling"] || [],
                abilities: pokemon.Abilities || {},
                checksAndCounters: pokemon["Checks and Counters"] || {},
                usage: pokemon.usage || 0,
                moves: pokemon.Moves || {},
                happiness: pokemon.Happiness || {}, // Champ Happiness transmis directement
                image: pokemon.Image || '',
                index: pokemon.Index || 0,
                type1: pokemon["Type 1"] || '',
                type2: pokemon["Type 2"] || '',
                total: pokemon.Total || 0,
                stats: {
                    hp: pokemon.HP || 0,
                    attack: pokemon.Attack || 0,
                    defense: pokemon.Defense || 0,
                    spAtk: pokemon.SpAtk || 0,
                    spDef: pokemon.SpDef || 0,
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

app.get('/api/pokemon/search/suggestion/:query', async (req, res) => {
    const query = req.params.query.toLowerCase();

    try {
        // Recherche des Pokémon correspondant au texte de la requête
        const suggestions = await Pokemon.find(
            { PName: { $regex: query, $options: 'i' } }, // Insensible à la casse
            { PName: 1, Image: 1, _id: 0 } // Renvoyer `PName` et `Image`
        ).limit(10); // Limiter à 10 résultats

        // Formater les résultats pour le front-end
        const pokemonData = suggestions.map(p => ({
            name: p.PName, // Utiliser directement le nom brut
            image: p.Image || 'default.png' // Fallback à une image par défaut
        }));

        res.json(pokemonData);
    } catch (error) {
        console.error('Erreur lors de la récupération des suggestions:', error);
        res.status(500).send('Erreur serveur');
    }
});

app.post('/api/pokemon/teambuild/suggestion', async (req, res) => {
    try {
        const { currentTeam } = req.body;
        if (!currentTeam || !Array.isArray(currentTeam) || currentTeam.length === 0) {
            return res.status(400).send('L\'équipe actuelle est requise.');
        }

        const teamData = await Pokemon.find(
            { PName: { $in: currentTeam } },
            { Teammates: 1, _id: 0 }
        );

        const synergyScores = {};
        teamData.forEach(pokemon => {
            if (pokemon.Teammates) {
                Object.entries(pokemon.Teammates).forEach(([teammate, frequency]) => {
                    synergyScores[teammate] = (synergyScores[teammate] || 0) + frequency;
                });
            }
        });

        const suggestions = await Pokemon.find(
            { PName: { $nin: currentTeam } },
            { PName: 1, Image: 1, "Type 1": 1, "Type 2": 1, _id: 0 }
        );

        const suggestionsWithSynergy = suggestions.map(pokemon => ({
            name: pokemon.PName,
            image: pokemon.Image || 'default.png',
            type1: pokemon["Type 1"],
            type2: pokemon["Type 2"] || null,
            synergyScore: synergyScores[pokemon.PName] || 0
        }));

        const sortedSuggestions = suggestionsWithSynergy
            .sort((a, b) => b.synergyScore - a.synergyScore)
            .slice(0, 6); // Limite à 6 suggestions

        res.json(sortedSuggestions);
    } catch (error) {
        console.error('Erreur lors de la génération des suggestions basées sur la synergie :', error);
        res.status(500).send('Erreur serveur');
    }
});


// Route pour sauvegarder une équipe Pokémon
app.post('/api/teams', async (req, res) => {
    const { teamName, members } = req.body;

    // Validation des données d'entrée
    if (!teamName || !members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ message: 'Le nom de l\'équipe et les membres sont requis.' });
    }

    try {
        // Créer une nouvelle équipe avec les données reçues
        const newTeam = new Team({
            teamName,
            members,
            timestamp: Date.now()
        });

        // Sauvegarder l'équipe dans la base de données
        const savedTeam = await newTeam.save();

        res.status(201).json({ message: 'Équipe sauvegardée avec succès.', team: savedTeam });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur lors de la sauvegarde de l\'équipe.' });
    }
});
