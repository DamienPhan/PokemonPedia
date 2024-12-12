document.addEventListener('DOMContentLoaded', async () => {
    const pokemonName = getQueryParam('name');
    console.log("pokemonName récupéré depuis l'URL : ", pokemonName);

    try {
        const response = await fetch(`/api/pokemon/${pokemonName}`);

        if (!response.ok) throw new Error('Aucun Pokémon trouvé');

        const pokemon = await response.json();
        console.log("Données du Pokémon récupérées : ", pokemon);

        if (pokemon) {
            document.getElementById('name').value = pokemon.name;
            document.getElementById('hp').value = pokemon.stats.hp;
            document.getElementById('attack').value = pokemon.stats.attack;
            document.getElementById('defense').value = pokemon.stats.defense;
            document.getElementById('spAtk').value = pokemon.stats.spAtk;
            document.getElementById('spDef').value = pokemon.stats.spDef;
            document.getElementById('speed').value = pokemon.stats.speed;

            // Remplir les types avec des options
            const type1Select = document.getElementById('type1');
            const type2Select = document.getElementById('type2');
            fillTypeOptions(type1Select);
            fillTypeOptions(type2Select);

            type1Select.value = pokemon.type1;
            type2Select.value = pokemon.type2 || "";

            // Remplir l'image (sans l'extension ni le chemin)
            if (pokemon.image) {
                document.getElementById('image').value = pokemon.image.replace("images/", "").replace(".png", "");
            }
        } else {
            document.getElementById('status-message').textContent = 'Aucun Pokémon trouvé avec cet ID.';
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des données du Pokémon:', error);
        document.getElementById('status-message').textContent = 'Erreur lors du chargement des informations du Pokémon.';
    }
});

document.getElementById('edit-pokemon-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const pokemonData = {
        name: document.getElementById('name').value.trim(),
        type1: document.getElementById('type1').value,
        type2: document.getElementById('type2').value || null, // Si non défini, envoyer null
        stats: {
            hp: parseInt(document.getElementById('hp').value),
            attack: parseInt(document.getElementById('attack').value),
            defense: parseInt(document.getElementById('defense').value),
            spAtk: parseInt(document.getElementById('spAtk').value),
            spDef: parseInt(document.getElementById('spDef').value),
            speed: parseInt(document.getElementById('speed').value),
        },
        image: document.getElementById('image').value.trim() 
            ? `images/${document.getElementById('image').value.trim()}.png`
            : null
    };

    console.log('Données soumises:', pokemonData);

    try {
        const response = await fetch(`/api/pokemon/${getQueryParam('name')}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pokemonData),
        });

        if (response.ok) {
            document.getElementById('status-message').textContent = 'Pokémon modifié avec succès!';
            console.log("Modification réussie:", await response.json());
        } else {
            const errorDetails = await response.json();
            console.error("Erreur lors de la modification:", errorDetails);
            document.getElementById('status-message').textContent = 'Erreur lors de la modification.';
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('status-message').textContent = 'Erreur lors de la modification.';
    }
});

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function fillTypeOptions(selectElement) {
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

    Object.entries(typeTranslations).forEach(([type, translation]) => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = translation;
        selectElement.appendChild(option);
    });
}
