// Fonction pour récupérer les paramètres de l'URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Fonction pour afficher les informations du Pokémon
function displayPokemonDetails(pokemon) {
    const detailsDiv = document.getElementById('pokemon-details');

    // Vérifiez si le Pokémon contient bien les propriétés nécessaires
    if (!pokemon) {
        detailsDiv.innerHTML = '<p>Pokémon non trouvé</p>';
        return;
    }

    detailsDiv.innerHTML = `
        <h2>${pokemon.name}</h2>
        <div class="pokemon-image">
            <img src="/ressources/pokedex/${pokemon.image}" alt="${pokemon.name}" />
        </div>

        <!-- Informations de base -->
        <section class="pokemon-stats">
            <h3>Statistiques</h3>
            <ul>
                <li><strong>Type:</strong> ${pokemon.type1}${pokemon.type2 ? ' / ' + pokemon.type2 : ''}</li>
                <li><strong>Total:</strong> ${pokemon.total}</li>
                <li><strong>Usage:</strong> ${pokemon.usage}%</li>
                <li><strong>Viability Ceiling:</strong> ${pokemon.viabilityCeiling}</li>
                <li><strong>Happiness:</strong> ${pokemon.happiness}</li>
            </ul>
        </section>

        <!-- Items -->
        <section class="pokemon-items">
            <h3>Items</h3>
            <ul>
                ${pokemon.items && Object.keys(pokemon.items).length > 0
                    ? Object.keys(pokemon.items).map(item => `<li>${item}: ${pokemon.items[item]}</li>`).join('')
                    : '<li>Aucun item disponible</li>'
                }
            </ul>
        </section>

        <!-- Spreads -->
        <section class="pokemon-spreads">
            <h3>Spreads</h3>
            <ul>
                ${pokemon.spreads && Object.keys(pokemon.spreads).length > 0
                    ? Object.keys(pokemon.spreads).map(spread => `<li>${spread}: ${pokemon.spreads[spread]}</li>`).join('')
                    : '<li>Aucun spread disponible</li>'
                }
            </ul>
        </section>

        <!-- Tera Types -->
        <section class="pokemon-tera-types">
            <h3>Tera Types</h3>
            <ul>
                ${Array.isArray(pokemon.teraTypes) && pokemon.teraTypes.length > 0
                    ? pokemon.teraTypes.map(tera => `<li>${tera}</li>`).join('')
                    : '<li>Aucun Tera Type disponible</li>'
                }
            </ul>
        </section>

        <!-- Teammates -->
        <section class="pokemon-teammates">
            <h3>Teammates</h3>
            <ul>
                ${Array.isArray(pokemon.teammates) && pokemon.teammates.length > 0
                    ? pokemon.teammates.map(teammate => `<li>${teammate}</li>`).join('')
                    : '<li>Aucun coéquipier disponible</li>'
                }
            </ul>
        </section>

        <!-- Abilities -->
        <section class="pokemon-abilities">
            <h3>Abilities</h3>
            <ul>
                ${Array.isArray(pokemon.abilities) && pokemon.abilities.length > 0
                    ? pokemon.abilities.map(ability => `<li>${ability}</li>`).join('')
                    : '<li>Aucune capacité disponible</li>'
                }
            </ul>
        </section>

        <!-- Checks and Counters -->
        <section class="pokemon-checks">
            <h3>Checks and Counters</h3>
            <ul>
                ${Array.isArray(pokemon.checksAndCounters) && pokemon.checksAndCounters.length > 0
                    ? pokemon.checksAndCounters.map(counter => `<li>${counter}</li>`).join('')
                    : '<li>Aucun counter disponible</li>'
                }
            </ul>
        </section>

        <!-- Moves -->
        <section class="pokemon-moves">
            <h3>Moves</h3>
            <ul>
                ${Array.isArray(pokemon.moves) && pokemon.moves.length > 0
                    ? pokemon.moves.map(move => `<li>${move}</li>`).join('')
                    : '<li>Aucun move disponible</li>'
                }
            </ul>
        </section>

        <!-- Stats détaillées -->
        <section class="pokemon-detailed-stats">
            <h3>Détails des Statistiques</h3>
            <ul>
                <li><strong>HP:</strong> ${pokemon.stats.hp}</li>
                <li><strong>Attack:</strong> ${pokemon.stats.attack}</li>
                <li><strong>Defense:</strong> ${pokemon.stats.defense}</li>
                <li><strong>Special Attack:</strong> ${pokemon.stats.spAtk}</li>
                <li><strong>Special Defense:</strong> ${pokemon.stats.spDef}</li>
                <li><strong>Speed:</strong> ${pokemon.stats.speed}</li>
            </ul>
        </section>
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
