// ------------------- Importations et configuration -------------------
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Dossiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use('/ressources', express.static(path.join(__dirname, 'ressources')));
app.use('/images', express.static(path.join(__dirname, 'ressources/pokedex')));


// ------------------- Connexion à MongoDB -------------------
const mongoURI = 'mongodb://localhost:27017/PokemonDB';

mongoose.connect(mongoURI)
    .then(() => console.log("Connecté à MongoDB"))
    .catch(err => console.error("Erreur de connexion à MongoDB :", err));

// ------------------- Définition des modèles -------------------

// Modèle Pokémon
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

// Modèle Équipe
const teamSchema = new mongoose.Schema({
    teamName: String,
    members: [String],
    timestamp: { type: Date, default: Date.now }
}, { collection: 'Teams', versionKey: false });

const Team = mongoose.model('Team', teamSchema);

// ------------------- Routes Pokémon -------------------

// Obtenir les détails d'un Pokémon
app.get('/api/pokemon/:name', async (req, res) => {
    const pokemonName = req.params.name.toLowerCase();
    try {
        const pokemon = await Pokemon.findOne({ PName: new RegExp(`^${pokemonName}$`, 'i') });

        if (pokemon) {
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

// Rechercher des suggestions de Pokémon
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


// Ajouter un Pokémon
app.post('/api/pokemon', async (req, res) => {
    const { name, type1, type2, hp, attack, defense, spAtk, spDef, speed, image } = req.body;

    if (!name || !type1 || !hp || !attack || !defense || !spAtk || !spDef || !speed) {
        return res.status(400).send('Tous les champs requis doivent être remplis.');
    }

    try {
        const newPokemon = new Pokemon({
            PName: name,
            "Type 1": type1,
            "Type 2": type2 || '',
            HP: hp,
            Attack: attack,
            Defense: defense,
            SpAtk: spAtk,
            SpDef: spDef,
            Speed: speed,
            Image: image || '',
            Total: hp + attack + defense + spAtk + spDef + speed
        });
        await newPokemon.save();
        res.status(201).send('Pokémon ajouté avec succès!');
    } catch (error) {
        console.error('Erreur lors de l\'ajout du Pokémon:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Supprimer un Pokémon
app.delete('/api/pokemon/:name', async (req, res) => {
    try {
        const deletedPokemon = await Pokemon.findOneAndDelete({ PName: new RegExp(`^${req.params.name}$`, 'i') });
        if (!deletedPokemon) return res.status(404).send('Pokémon non trouvé');

        res.send(`Le Pokémon "${deletedPokemon.PName}" a été supprimé.`);
    } catch (error) {
        console.error('Erreur lors de la suppression du Pokémon:', error);
        res.status(500).send('Erreur serveur');
    }
});

// Mettre à jour un Pokémon
app.put('/api/pokemon/:name', async (req, res) => {
    try {
        const updatedPokemon = await Pokemon.findOneAndUpdate(
            { PName: new RegExp(`^${req.params.name}$`, 'i') },
            {
                "Type 1": req.body.type1,
                "Type 2": req.body.type2 || null,
                HP: req.body.hp,
                Attack: req.body.attack,
                Defense: req.body.defense,
                SpAtk: req.body.spAtk,
                SpDef: req.body.spDef,
                Speed: req.body.speed,
                Image: req.body.image || ''
            },
            { new: true, runValidators: true }
        );

        if (!updatedPokemon) return res.status(404).json({ message: 'Pokémon non trouvé.' });

        res.status(200).json({
            message: `Le Pokémon "${req.params.name}" a été modifié avec succès.`,
            pokemon: updatedPokemon
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du Pokémon :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});






// Route pour sauvegarder une équipe Pokémon
app.post('/api/teams/save', async (req, res) => {
    const { teamName, members } = req.body;

    // Validation des données
    if (!teamName || !members || !Array.isArray(members) || members.length === 0) {
        console.error('Validation échouée :', { teamName, members });
        return res.status(400).json({ message: 'Le nom de l\'équipe et les membres sont requis.' });
    }

    try {
        // Vérifier que les membres sont uniquement des noms
        const memberNames = members.map(member => member.name || member); // Si un objet est passé, récupère `name`

        // Créer une nouvelle équipe
        const newTeam = new Team({
            teamName,
            members: memberNames, // Sauvegarde uniquement les noms
            timestamp: Date.now()
        });

        const savedTeam = await newTeam.save();
        console.log('Équipe sauvegardée avec succès :', savedTeam);

        res.status(201).json({ message: 'Équipe sauvegardée avec succès.', team: savedTeam });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur lors de la sauvegarde de l\'équipe.' });
    }
});


// Route pour récupérer toutes les équipes enrichies avec les images des Pokémon
app.get('/api/teams', async (req, res) => {
    try {
        // Récupérer toutes les équipes triées par date de création décroissante
        const teams = await Team.find().sort({ timestamp: -1 });

        // Parcourir chaque équipe pour enrichir ses membres
        const enrichedTeams = await Promise.all(
            teams.map(async (team) => {
                const enrichedMembers = await Promise.all(
                    team.members.map(async (memberName) => {
                        // Trouver chaque Pokémon par son nom
                        const pokemon = await Pokemon.findOne(
                            { PName: memberName },
                            { PName: 1, Image: 1 } // On récupère uniquement le nom et l'image
                        );

                        return {
                            name: pokemon?.PName || memberName, // Fallback au nom original si non trouvé
                            image: pokemon?.Image ? `/images/${pokemon.Image}` : '/images/default.png', // Fallback à une image par défaut
                        };
                    })
                );

                // Retourner l'équipe enrichie avec les membres complets
                return {
                    _id: team._id,
                    teamName: team.teamName,
                    members: enrichedMembers,
                    timestamp: team.timestamp,
                };
            })
        );

        // Retourner les équipes enrichies
        res.status(200).json(enrichedTeams);
    } catch (error) {
        console.error('Erreur lors de la récupération des équipes :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des équipes.' });
    }
});

// Route pour supprimer une équipe
app.delete('/api/teams/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedTeam = await Team.findByIdAndDelete(id);
        if (!deletedTeam) {
            return res.status(404).json({ message: 'Équipe non trouvée.' });
        }
        res.status(200).json({ message: `L'équipe "${deletedTeam.teamName}" a été supprimée avec succès.` });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'équipe.' });
    }
});


// Route pour mettre à jour une équipe
app.put('/api/teams/:id', async (req, res) => {
    const { id } = req.params;
    const { teamName, members } = req.body;

    // Validation des données
    if (!teamName || !members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ message: 'Le nom de l\'équipe et les membres sont requis.' });
    }

    try {
        // Vérifier que tous les Pokémon existent
        const missingPokemons = [];
        for (const member of members) {
            const pokemonExists = await Pokemon.findOne({ PName: member });
            if (!pokemonExists) {
                missingPokemons.push(member);
            }
        }

        // Si certains Pokémon sont manquants, retourner une erreur
        if (missingPokemons.length > 0) {
            return res.status(400).json({
                message: 'Certains Pokémon n\'existent pas.',
                missingPokemons
            });
        }

        // Mettre à jour l'équipe si tous les Pokémon sont valides
        const updatedTeam = await Team.findByIdAndUpdate(
            id,
            { teamName, members },
            { new: true } // Retourne l'équipe mise à jour
        );

        if (!updatedTeam) {
            return res.status(404).json({ message: 'Équipe non trouvée.' });
        }

        res.status(200).json({ message: 'Équipe mise à jour avec succès.', team: updatedTeam });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'équipe.' });
    }
});


// Route pour rechercher une équipe par nom
app.get('/api/teams/search/:name', async (req, res) => {
    const { name } = req.params;

    try {
        const teams = await Team.find({
            teamName: { $regex: name, $options: 'i' } // Recherche insensible à la casse
        });

        if (teams.length === 0) {
            return res.status(404).json({ message: 'Aucune équipe correspondante trouvée.' });
        }

        res.status(200).json(teams);
    } catch (error) {
        console.error('Erreur lors de la recherche des équipes :', error);
        res.status(500).json({ message: 'Erreur lors de la recherche des équipes.' });
    }
});


// Route pour générer une équipe aléatoire de 6 Pokémon
app.get('/api/teams/random', async (req, res) => {
    try {
        const randomPokemons = await Pokemon.aggregate([
            { $sample: { size: 6 } } // Récupère 6 Pokémon au hasard
        ]);

        if (!randomPokemons || randomPokemons.length === 0) {
            return res.status(404).json({ message: 'Aucun Pokémon trouvé.' });
        }

        // Retourne les Pokémon formatés
        res.status(200).json(randomPokemons.map(pokemon => ({
            name: pokemon.PName,
            image: `/images/${pokemon.Image || 'default.png'}`,
            type1: pokemon["Type 1"],
            type2: pokemon["Type 2"]
        })));
    } catch (error) {
        console.error('Erreur lors de la génération d\'équipe aléatoire:', error);
        res.status(500).json({ message: 'Erreur lors de la génération de l\'équipe.' });
    }
});

// Suggestions pour la construction d'une équipe
app.post('/api/pokemon/teambuild/suggestion', async (req, res) => {
    const { currentTeam } = req.body;

    if (!currentTeam || !Array.isArray(currentTeam)) {
        return res.status(400).json({ message: 'L\'équipe actuelle est requise.' });
    }

    try {
        const suggestions = await Pokemon.find(
            { PName: { $nin: currentTeam } },
            { PName: 1, Teammates: 1, Image: 1, _id: 0 }
        ).limit(50);

        const formattedSuggestions = suggestions.map(pokemon => ({
            name: pokemon.PName,
            image: `/images/${pokemon.Image || 'default.png'}`,
            synergyScore: Object.keys(pokemon.Teammates || {})
                .filter(teammate => currentTeam.includes(teammate))
                .reduce((sum, teammate) => sum + pokemon.Teammates[teammate], 0)
        }));

        res.status(200).json(formattedSuggestions.sort((a, b) => b.synergyScore - a.synergyScore).slice(0, 10));
    } catch (error) {
        console.error('Erreur lors de la récupération des suggestions :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});


// ------------------- Démarrage du serveur -------------------
app.listen(PORT, () => {
    console.log(`Serveur en écoute sur le port ${PORT}`);
});
