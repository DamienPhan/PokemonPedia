// Fonction pour afficher les Pokémon dans la page
async function fetchPokemonData() {
    const response = await fetch('http://localhost:3000/api/pokemon');
    const data = await response.json();
    displayPokemon(data);
}

// Fonction pour afficher les Pokémon dans la page
function displayPokemon(data) {
    const pokedex = document.getElementById('pokedex');
    pokedex.innerHTML = ''; // Efface le contenu précédent

    data.forEach(pokemon => {
        const card = document.createElement('div');
        card.classList.add('pokemon-card');
        card.innerHTML = `
            <img src="${pokemon.Image}" alt="${pokemon.PName}" style="width:100px;height:100px;">
            <h3>${pokemon.PName}</h3>
            <p>Type: ${pokemon['Type1']} ${pokemon['Type2'] ? '/' + pokemon['Type2'] : ''}</p>
            <p>HP: ${pokemon.HP}</p>
            <p>Attack: ${pokemon.Attack}</p>
            <p>Defense: ${pokemon.Defense}</p>
            <p>SP. Atk: ${pokemon.SP_Atk}</p>
            <p>SP. Def: ${pokemon.SP_Def}</p>
            <p>Speed: ${pokemon.Speed}</p>
        `;
        pokedex.appendChild(card);
    });
}

// Affiche les Pokémon au chargement de la page
window.onload = fetchPokemonData;

// Fonction pour filtrer les Pokémon selon la recherche
document.getElementById('search').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const filteredPokemon = pokemonData.filter(pokemon => pokemon.PName.toLowerCase().includes(searchTerm));
    displayPokemon(filteredPokemon);
});
