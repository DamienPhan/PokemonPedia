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
    fetch('/api/pokemon/' + query)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Pokémon non trouvé');
            }
        })
        .then(pokemons => {
            // Afficher les suggestions
            suggestionsBox.innerHTML = '';
            pokemons.forEach(pokemon => {
                const suggestionItem = document.createElement('li');
                suggestionItem.textContent = pokemon.name;
                
                // Lien vers info.html avec le nom du Pokémon comme paramètre
                suggestionItem.onclick = () => {
                    window.location.href = `info.html?name=${pokemon.name}`;
                };
                
                suggestionsBox.appendChild(suggestionItem);
            });
        })
        .catch(error => {
            console.error('Erreur lors de la recherche:', error);
            suggestionsBox.innerHTML = '<li>Aucun Pokémon trouvé</li>';
        });
}

// Si vous souhaitez avoir un comportement différent pour afficher directement les détails du Pokémon
// voici une autre fonction qui n'est pas nécessaire si vous utilisez la redirection
function displayPokemonDetails(pokemon) {
    const detailsDiv = document.getElementById('pokemon-details');
    detailsDiv.innerHTML = `
        <h2>${pokemon.name}</h2>
        <p><span class="section-title">Items:</span> ${Object.keys(pokemon.Items || {}).join(', ')}</p>
        <p><span class="section-title">Raw Count:</span> ${pokemon["Raw count"]}</p>
        <p><span class="section-title">Spreads:</span> ${Object.keys(pokemon.Spreads || {}).join(', ')}</p>
        <p><span class="section-title">Tera Types:</span> ${Object.keys(pokemon["Tera Types"] || {}).join(', ')}</p>
        <p><span class="section-title">Teammates:</span> ${(pokemon.Teammates || []).join(', ')}</p>
        <p><span class="section-title">Viability Ceiling:</span> ${pokemon["Viability Ceiling"]}</p>
        <p><span class="section-title">Abilities:</span> ${Object.keys(pokemon.Abilities || {}).join(', ')}</p>
        <p><span class="section-title">Checks and Counters:</span> ${(pokemon["Checks and Counters"] || []).join(', ')}</p>
        <p><span class="section-title">Usage:</span> ${pokemon.usage}%</p>
        <p><span class="section-title">Moves:</span> ${(pokemon.Moves || []).join(', ')}</p>
        <p><span class="section-title">Happiness:</span> ${pokemon.Happiness}</p>
    `;
}
