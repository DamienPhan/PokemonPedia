const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect('mongodb://localhost:27017/PokemonDB');


// Définir le modèle
const PokemonSchema = new mongoose.Schema({
    PName: String,
    Items: Object,
    RawCount: Number,
    Spreads: Object,
    TeraTypes: Object,
    Teammates: Object,
    ViabilityCeiling: Array,
    Abilities: Object,
    ChecksAndCounters: Object,
    usage: Number,
    Moves: Object,
    Happiness: Object,
    Image: String,
    Index: Number,
    Type1: String,
    Type2: String,
    Total: Number,
    HP: Number,
    Attack: Number,
    Defense: Number,
    SP_Atk: Number,
    SP_Def: Number,
    Speed: Number,
});

const Pokemon = mongoose.model('PokemonData', PokemonSchema);

// Route pour récupérer les données Pokémon
app.get('/api/pokemon', async (req, res) => {
    try {
        const pokemonList = await Pokemon.find();
        res.json(pokemonList);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
