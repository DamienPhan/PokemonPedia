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
        <p><span class="section-title">Items:</span> ${Object.keys(pokemon.items).join(', ')}</p>
        <p><span class="section-title">Raw Count:</span> ${pokemon.rawCount}</p>
        <p><span class="section-title">Spreads:</span> ${JSON.stringify(pokemon.spreads)}</p>
        <p><span class="section-title">Tera Types:</span> ${JSON.stringify(pokemon.teraTypes)}</p>
        <p><span class="section-title">Teammates:</span> ${JSON.stringify(pokemon.teammates)}</p>
        <p><span class="section-title">Viability Ceiling:</span> ${JSON.stringify(pokemon.viabilityCeiling)}</p>
        <p><span class="section-title">Abilities:</span> ${JSON.stringify(pokemon.abilities)}</p>
        <p><span class="section-title">Checks and Counters:</span> ${JSON.stringify(pokemon.checksAndCounters)}</p>
        <p><span class="section-title">Usage:</span> ${(pokemon.usage * 100).toFixed(2)}%</p>
        <p><span class="section-title">Moves:</span> ${JSON.stringify(pokemon.moves)}</p>
        <p><span class="section-title">Happiness:</span> ${JSON.stringify(pokemon.happiness)}</p>
        <p><span class="section-title">Type 1:</span> ${pokemon.type1}</p>
        <p><span class="section-title">Type 2:</span> ${pokemon.type2 || 'N/A'}</p>
        <p><span class="section-title">Total:</span> ${pokemon.total}</p>
        <h3>Stats:</h3>
        <p>HP: ${pokemon.stats.hp}</p>
        <p>Attack: ${pokemon.stats.attack}</p>
        <p>Defense: ${pokemon.stats.defense}</p>
        <p>Special Attack: ${pokemon.stats.spAtk}</p>
        <p>Special Defense: ${pokemon.stats.spDef}</p>
        <p>Speed: ${pokemon.stats.speed}</p>
    `;
}

