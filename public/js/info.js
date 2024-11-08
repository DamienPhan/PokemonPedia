// Fonction pour récupérer les paramètres de l'URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Afficher les informations du Pokémon
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

// Récupérer et afficher les détails du Pokémon lorsque la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    const pokemonName = getQueryParam('name');

    if (pokemonName) {
        fetch(`/api/pokemon/${pokemonName.toLowerCase()}`)
            .then(response => {
                if (response.ok) return response.json();
                else throw new Error('Pokémon non trouvé');
            })
            .then(pokemon => displayPokemonDetails(pokemon))
            .catch(error => {
                console.error(error);
                document.getElementById('pokemon-details').innerHTML = '<p>Pokémon non trouvé</p>';
            });
    } else {
        document.getElementById('pokemon-details').innerHTML = '<p>Aucun Pokémon spécifié</p>';
    }
});
