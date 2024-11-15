// Rechercher un Pokémon dans la base de données
function searchPokemon() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const suggestionsBox = document.getElementById('suggestions');

    // Vider la liste des suggestions si le champ de recherche est vide
    if (query.length === 0) {
        suggestionsBox.innerHTML = '';
        return;
    }

    // Effectuer une requête pour obtenir les suggestions de Pokémon
    fetch('/api/pokemon/suggestions/' + query)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Pokémon non trouvé');
            }
        })
        .then(suggestions => {
            // Afficher les suggestions dans la liste
            suggestionsBox.innerHTML = suggestions.map(pokemon => 
                `<li onclick="selectPokemon('${pokemon.name}')">${pokemon.name}</li>`
            ).join('');
        })
        .catch(error => {
            suggestionsBox.innerHTML = ''; // Vider les suggestions si une erreur se produit
            console.error(error);
        });
}

// Sélectionner un Pokémon et afficher ses détails
function selectPokemon(pokemonName) {
    fetch('/api/pokemon/' + pokemonName)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Pokémon non trouvé');
            }
        })
        .then(pokemon => {
            displayPokemonDetails(pokemon);
            // Vider la liste des suggestions
            document.getElementById('suggestions').innerHTML = '';
        })
        .catch(error => {
            console.error(error);
        });
}

// Afficher les détails du Pokémon
function displayPokemonDetails(pokemon) {
    const detailsDiv = document.getElementById('pokemon-details');
    detailsDiv.innerHTML = `
        <h2>${pokemon.name}</h2>
        <img src="${pokemon.image}" alt="${pokemon.name}" />
    `;
}

