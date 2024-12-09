document.addEventListener('DOMContentLoaded', async () => {
    const pokemonName = getQueryParam('name');
    console.log("pokemonName récupéré depuis l'URL : ", pokemonName); // Ajout du log ici

    try {
        const response = await fetch(`/api/pokemon/${pokemonName}`);

        if (!response.ok) throw new Error('Aucun Pokémon trouvé');

        const pokemon = await response.json();
        console.log("Données du Pokémon récupérées : ", pokemon); // Log des données récupérées

        if (pokemon) {
            console.log("PName : ", pokemon.name); // Log du nom du Pokémon
            console.log("pokemon recup : ", pokemonName); // Log de la variable `pokemonName`

            // Remplir les champs avec les données du Pokémon
            document.getElementById('name').value = pokemon.name;
            document.getElementById('hp').value = pokemon.stats.hp;
            document.getElementById('attack').value = pokemon.stats.attack;
            document.getElementById('defense').value = pokemon.stats.defense;
            document.getElementById('spAtk').value = pokemon.stats.spAtk;
            document.getElementById('spDef').value = pokemon.stats.spDef;
            document.getElementById('speed').value = pokemon.stats.speed;

            // Remplir le type 1
            const type1Select = document.getElementById('type1');
            fillTypeOptions(type1Select);
            type1Select.value = pokemon.type1;

            // Remplir le type 2 (optionnel)
            const type2Select = document.getElementById('type2');
            fillTypeOptions(type2Select);
            type2Select.value = pokemon.type2 || ""; // Si type2 est vide, laisser le champ vide

            // Remplir l'URL de l'image (si elle existe)
            if (pokemon.image) {
                document.getElementById('image').value = pokemon.image.replace("images/", "").replace(".png", "");
            }
        } else {
            console.error('Aucun Pokémon trouvé avec cet ID');
            document.getElementById('status-message').textContent = 'Aucun Pokémon trouvé avec cet ID.';
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données du Pokémon:', error);
        document.getElementById('status-message').textContent = 'Erreur lors du chargement des informations du Pokémon.';
    }
});

// Fonction pour modifier un Pokémon
document.getElementById('edit-pokemon-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Empêcher le rechargement de la page

    const pokemonData = {
        name: document.getElementById('name').value,
        type1: document.getElementById('type1').value || undefined, 
        type2: document.getElementById('type2').value || undefined,
        hp: parseInt(document.getElementById('hp').value),
        attack: parseInt(document.getElementById('attack').value),
        defense: parseInt(document.getElementById('defense').value),
        spAtk: parseInt(document.getElementById('spAtk').value),
        spDef: parseInt(document.getElementById('spDef').value),
        speed: parseInt(document.getElementById('speed').value),
        image: document.getElementById('image').value ? `images/${document.getElementById('image').value}.png` : undefined
    };
    
    try {
        const response = await fetch(`/api/pokemon/${getQueryParam('name')}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pokemonData)
        });
    
        if (response.ok) {
            document.getElementById('status-message').textContent = 'Pokémon modifié avec succès!';
        } else {
            throw new Error('Erreur lors de la modification du Pokémon');
        }
        console.log("passé en param1")
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('status-message').textContent = 'Erreur lors de la modification du Pokémon.';
    }    
});

// Fonction pour récupérer un paramètre de l'URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

const typeTranslations = {
    "Fire": "Feu",
    "Water": "Eau",
    "Grass": "Plante",
    "Electric": "Électrique",
    "Poison": "Poison",
    "Bug": "Insecte",
    "Normal": "Normal",
    "Psychic": "Psy",
    "Fighting": "Combat",
    "Fairy": "Fée",
    "Rock": "Roche",
    "Ghost": "Spectre",
    "Ice": "Glace",
    "Dragon": "Dragon",
    "Dark": "Ténèbres",
    "Steel": "Acier",
    "Flying": "Vol",
    "Ground": "Sol",
    "Stelar": "Stellaire"
};

function fillTypeOptions(selectElement) {
    Object.entries(typeTranslations).forEach(([type, translation]) => {
        const option = document.createElement("option");
        option.value = type; // valeur à envoyer à l'API
        option.textContent = translation; // texte affiché dans le formulaire
        selectElement.appendChild(option);
    });
}
