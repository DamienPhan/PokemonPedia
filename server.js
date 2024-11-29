const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
//Python
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configurer les dossiers statiques pour `public` et `ressources`
app.use(express.static(path.join(__dirname, 'public')));
app.use('/ressources', express.static(path.join(__dirname, 'ressources')));

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

// Team Schema
const teamSchema = new mongoose.Schema({
    teamName: String,
    members: [String], // Pokémon names
    timestamp: { type: Date, default: Date.now }
}, { collection: 'Teams' });

const Team = mongoose.model('Team', teamSchema);

app.get('/api/pokemon/:name', async (req, res) => {
    const pokemonName = req.params.name.toLowerCase();

    console.log(`Recherche du Pokémon : ${pokemonName}`); // Log pour le nom recherché

    try {
        const pokemon = await Pokemon.findOne({ PName: new RegExp(`^${pokemonName}$`, 'i') });

        console.log("Données récupérées depuis MongoDB:", pokemon); // Log pour afficher les données récupérées

        if (pokemon) {
            console.log('Données Pokémon récupérées depuis MongoDB:', pokemon); // Log pour vérifier les données
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

app.get('/api/pokemon/suggestions/:query', async (req, res) => {
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

app.get('/api/pokemon/:name', async (req, res) => {
    const pokemonName = req.params.name.toLowerCase();

    try {
        const pokemon = await Pokemon.findOne({ PName: new RegExp(`^${pokemonName}$`, 'i') });

        if (pokemon) {
            res.json({
                name: pokemon.PName,
                teammates: pokemon.Teammates || {}, // Inclure les teammates
                image: pokemon.Image || 'default.png', // Assurer un fallback pour l'image
                // Autres données...
            });
        } else {
            res.status(404).send('Pokémon non trouvé');
        }
    } catch (error) {
        console.error('Erreur serveur:', error);
        res.status(500).send('Erreur serveur');
    }
});


// Endpoint to save a team
app.post('/api/teams', async (req, res) => {
    const { teamName, members } = req.body;

    console.log(`Sauvegarde de l'équipe : ${teamName} avec membres:`, members);

    if (!teamName || !members || members.length === 0) {
        return res.status(400).send('Nom de l\'équipe et membres requis.');
    }

    try {
        const newTeam = new Team({ teamName, members });
        await newTeam.save();
        res.status(201).send('Équipe sauvegardée avec succès.');
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'équipe:', error);
        res.status(500).send('Erreur serveur.');
    }
});


// Endpoint to retrieve all teams
app.get('/api/teams', async (req, res) => {
    try {
        const teams = await Team.find({}, { teamName: 1, members: 1, timestamp: 1, _id: 0 });
        res.json(teams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).send('Server error');
    }
});



// Route for team suggestions
app.get('/api/team-suggestions/:team', async (req, res) => {
    const teamNames = req.params.team.split(',');

    try {
        // Fetch data for the given team from MongoDB
        const teamData = await Pokemon.find({ PName: { $in: teamNames } }).lean();

        if (!teamData || teamData.length === 0) {
            return res.status(404).json({ error: 'No Pokémon found for the given team' });
        }

        // Save team data to a temporary file
        const tempInputFile = path.join(__dirname, 'temp_team_data.json');
        fs.writeFileSync(tempInputFile, JSON.stringify(teamData));

        // Execute Python script
        const pythonScriptPath = path.join(__dirname, 'public', 'py', 'machineLearning', 'teamComposer.py');
        const pythonProcess = spawn('python3', [pythonScriptPath, tempInputFile]);

        let errorOutput = '';
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
            // Delete temporary input file
            if (fs.existsSync(tempInputFile)) fs.unlinkSync(tempInputFile);

            const outputFilePath = path.join(__dirname, 'ressources', 'data_output', 'temp', 'team_suggested.json');

            if (code === 0 && fs.existsSync(outputFilePath)) {
                // Send the suggestions as a response
                const suggestions = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
                res.json(suggestions);
            } else {
                console.error('Python script error:', errorOutput);
                res.status(500).json({ error: `Python script error: ${errorOutput}` });
            }
        });
    } catch (error) {
        console.error('Error processing suggestions:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
