// ------------------- Gestion des éléments DOM -------------------
const searchBar = document.getElementById('search-bar');
const suggestionsBox = document.getElementById('suggestions');
const detailsDiv = document.getElementById('pokemon-details');
const backButton = document.getElementById('back-button');

// ------------------- Fonction de recherche -------------------
function searchPokemon() {
    const query = searchBar.value.trim().toLowerCase();

    // Vider les suggestions si la barre de recherche est vide
    if (query.length === 0) {
        suggestionsBox.innerHTML = '';
        return;
    }

    // Appeler l'API pour obtenir les suggestions de Pokémon
    fetch(`/api/pokemon/search/suggestion/${encodeURIComponent(query)}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('Erreur lors de la récupération des suggestions');
            }
            return response.json();
        })
        .then((suggestions) => {
            // Afficher les suggestions dans le DOM
            if (suggestions.length === 0) {
                suggestionsBox.innerHTML = '<li>Aucun Pokémon trouvé</li>';
                return;
            }
            suggestionsBox.innerHTML = suggestions
                .map(
                    (pokemon) => `
                    <li onclick="selectPokemon('${pokemon.name}')">
                        <img src="/ressources/pokedex/${pokemon.image}" 
                             alt="${pokemon.name}" 
                             style="width: 50px; height: 50px; margin-right: 10px;" 
                             onerror="this.src='/ressources/pokedex/default.png';" />
                        ${pokemon.name}
                    </li>`
                )
                .join('');
        })
        .catch((error) => {
            console.error('Erreur lors de la récupération des suggestions:', error);
            suggestionsBox.innerHTML = '<li>Aucun Pokémon trouvé</li>';
        });
}

// ------------------- Fonction de sélection d'un Pokémon -------------------
function selectPokemon(pokemonName) {
    // Redirige vers la page des détails du Pokémon
    window.location.href = `/html/info.html?name=${encodeURIComponent(pokemonName)}`;
}

// ------------------- Fonction d'affichage des détails d'un Pokémon -------------------
function displayPokemonDetails(pokemon) {
    detailsDiv.innerHTML = `
        <h2>${pokemon.name}</h2>
        <img src="/ressources/pokedex/${pokemon.image}" alt="${pokemon.name}" style="width: 200px; height: 200px;" />
        <ul>
            <li><strong>Type 1:</strong> ${pokemon.type1}</li>
            <li><strong>Type 2:</strong> ${pokemon.type2 || 'Aucun'}</li>
            <li><strong>HP:</strong> ${pokemon.stats.hp}</li>
            <li><strong>Attaque:</strong> ${pokemon.stats.attack}</li>
            <li><strong>Défense:</strong> ${pokemon.stats.defense}</li>
            <li><strong>Attaque Spéciale:</strong> ${pokemon.stats.spAtk}</li>
            <li><strong>Défense Spéciale:</strong> ${pokemon.stats.spDef}</li>
            <li><strong>Vitesse:</strong> ${pokemon.stats.speed}</li>
        </ul>
    `;
}

// ------------------- Gestion des événements -------------------
// Recherche de Pokémon à chaque entrée dans la barre de recherche
searchBar.addEventListener('input', searchPokemon);

// Bouton retour
if (backButton) {
    backButton.addEventListener('click', () => {
        window.history.back();
    });
}

// ------------------- Chargement des détails d'un Pokémon (page info.html) -------------------
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pokemonName = urlParams.get('name');

    if (pokemonName) {
        fetch(`/api/pokemon/${encodeURIComponent(pokemonName)}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Erreur lors de la récupération des détails du Pokémon');
                }
                return response.json();
            })
            .then((pokemon) => {
                displayPokemonDetails(pokemon);
            })
            .catch((error) => {
                console.error('Erreur lors de la récupération des détails du Pokémon:', error);
                detailsDiv.innerHTML = '<p>Erreur lors du chargement des détails du Pokémon.</p>';
            });
    }
});
