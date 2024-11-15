function searchPokemon() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const suggestionsBox = document.getElementById('suggestions');

    // Vider les suggestions si la barre de recherche est vide
    if (query.length === 0) {
        suggestionsBox.innerHTML = '';
        return;
    }

    // Appeler l'API pour obtenir les suggestions de Pokémon
    fetch(`/api/pokemon/suggestions/${query}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Erreur lors de la récupération des suggestions');
            }
        })
        .then(suggestions => {
            // Afficher les suggestions dans le DOM
            suggestionsBox.innerHTML = suggestions.map(pokemon =>
                `<li onclick="selectPokemon('${pokemon.name}')">
                    <img src="/ressources/pokedex/${pokemon.image}" 
                         alt="${pokemon.name}" 
                         style="width: 50px; height: 50px; margin-right: 10px;" 
                         onerror="this.src='/ressources/pokedex/default.png';" />
                    ${pokemon.name}
                </li>`
            ).join('');
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des suggestions:', error);
            suggestionsBox.innerHTML = '<li>Aucun Pokémon trouvé</li>';
        });
}

// Fonction pour rediriger vers les détails du Pokémon
function selectPokemon(pokemonName) {
    window.location.href = `/html/info.html?name=${encodeURIComponent(pokemonName)}`;
}

// Sélectionner un Pokémon et rediriger vers la vue avec ses détails
function selectPokemon(pokemonName) {
    window.location.href = `/html/info.html?name=${encodeURIComponent(pokemonName)}`;
}

// Afficher les détails du Pokémon
function displayPokemonDetails(pokemon) {
    const detailsDiv = document.getElementById('pokemon-details');
    detailsDiv.innerHTML = `
        <h2>${pokemon.name}</h2>
        <img src="${pokemon.image}" alt="${pokemon.name}" />
    `;
}