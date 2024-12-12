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

    // console.log(`Recherche du Pokémon : ${pokemonName}`); // Log pour le nom recherché

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

// Route pour ajouter un Pokémon à la base de données
app.post('/api/pokemon', async (req, res) => {
    const {
        name, type1, type2, hp, attack, defense, spAtk, spDef, speed, image
    } = req.body;

    // Vérifier que tous les champs nécessaires sont présents
    if (!name || !type1 || !hp || !attack || !defense || !spAtk || !spDef || !speed) {
        return res.status(400).send('Tous les champs requis doivent être remplis.');
    }

    const newPokemon = new Pokemon({
        PName: name,
        "Type 1": type1,
        "Type 2": type2 || '', // Type 2 peut être vide
        HP: hp,
        Attack: attack,
        Defense: defense,
        SpAtk: spAtk,
        SpDef: spDef,
        Speed: speed,
        Image: image || '', // Si pas d'image, mettre une valeur vide
        Total: hp + attack + defense + spAtk + spDef + speed, // Exemple simple pour le total
    });

    try {
        // Enregistrer le Pokémon dans MongoDB
        await newPokemon.save();
        res.status(201).send('Pokémon ajouté avec succès!');
    } catch (error) {
        console.error('Erreur lors de l\'ajout du Pokémon:', error);
        res.status(500).send('Erreur serveur');
    }
});


// Route pour supprimer un Pokémon de la base de données
app.delete('/api/pokemon/:name', async (req, res) => {
    const pokemonName = req.params.name;

    try {
        // Supprimer le Pokémon correspondant au nom
        const deletedPokemon = await Pokemon.findOneAndDelete({ PName: new RegExp(`^${pokemonName}$`, 'i') });

        if (deletedPokemon) {
            res.status(200).json({ message: `Le Pokémon "${deletedPokemon.PName}" a été supprimé avec succès.` });
        } else {
            res.status(404).json({ message: 'Pokémon non trouvé.' });
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du Pokémon:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du Pokémon.' });
    }
});

app.put('/api/pokemon/:name', async (req, res) => {
    const pokemonName = req.params.name;
    console.log('Données envoyées pour modification:', req.body);

    try {
        const updatedPokemon = await Pokemon.findOneAndUpdate(
            { PName: new RegExp(`^${pokemonName}$`, 'i') },
            req.body,
            { new: true }
        );

        if (updatedPokemon) {
            console.log({ message: 'Pokémon modifié avec succès.', pokemon: updatedPokemon });
        } else {
            console.log(404).send('Pokémon non trouvé.');
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du Pokémon:', error);
        res.status(500).send('Erreur serveur.');
    }
});

app.post('/api/pokemon/teambuild/suggestion', async (req, res) => {
    const { currentTeam } = req.body;

    if (!currentTeam || !Array.isArray(currentTeam)) {
        return res.status(400).json({ message: 'L\'équipe actuelle est requise.' });
    }

    try {
        // Trouver les Pokémon qui ne sont pas dans l'équipe actuelle
        const suggestions = await Pokemon.find(
            { PName: { $nin: currentTeam } }, // Exclure les Pokémon déjà dans l'équipe
            { PName: 1, Teammates: 1, _id: 0 } // Inclure les coéquipiers pour le calcul de synergie
        )
        .limit(50); // Augmenter la limite initiale pour plus de résultats à trier

        // Calculer la synergie
        const formattedSuggestions = suggestions.map((pokemon) => {
            let synergyScore = 0;

            if (pokemon.Teammates) {
                // Vérifier combien de coéquipiers de la base sont déjà dans l'équipe actuelle
                synergyScore = Object.keys(pokemon.Teammates)
                    .filter(teammate => currentTeam.includes(teammate))
                    .reduce((sum, teammate) => sum + pokemon.Teammates[teammate], 0); // Ajouter leur fréquence
            }

            return {
                name: pokemon.PName,
                image: pokemon.Image || 'default.png',
                synergyScore: synergyScore, // Utiliser le score calculé
            };
        });

        // Trier les suggestions par score de synergie décroissant
        const sortedSuggestions = formattedSuggestions.sort((a, b) => b.synergyScore - a.synergyScore);

        // Renvoyer les 10 meilleurs résultats
        res.status(200).json(sortedSuggestions.slice(0, 10));
    } catch (error) {
        console.error('Erreur lors de la récupération des suggestions :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});



// Route pour sauvegarder une équipe Pokémon
app.post('/api/teams/save', async (req, res) => {
    const { teamName, members } = req.body;

    // Validation des données d'entrée
    if (!teamName || !members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ message: 'Le nom de l\'équipe et les membres sont requis.' });
    }

    try {
        // Récupérer les informations complètes des Pokémon dans l'équipe
        const pokemonDetails = await Promise.all(
            members.map(async (member) => {
                const pokemon = await Pokemon.findOne({ PName: member }, { PName: 1, Image: 1 });
                if (!pokemon) throw new Error(`Pokémon "${member}" introuvable.`);
                return { name: pokemon.PName, image: pokemon.Image };
            })
        );

        // Créer une nouvelle équipe avec les données complètes
        const newTeam = new Team({
            teamName,
            members: pokemonDetails,
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

