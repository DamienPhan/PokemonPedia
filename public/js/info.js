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
                <li><strong>Usage:</strong> ${pokemon.usage}%</li>
                <li><strong>Viability Ceiling:</strong> ${pokemon.viabilityCeiling && pokemon.viabilityCeiling.length > 0 ? pokemon.viabilityCeiling.join(', ') : 'Non défini'}</li>
                <li><strong>Happiness:</strong> ${pokemon.stats.happiness || 'Non défini'}</li>
            </ul>
        </section>

        <!-- Détails des Statistiques sous forme de barres -->
        <section class="pokemon-detailed-stats">
            <h3>Détails des Statistiques</h3>
            <ul>
                ${createStatBar("             HP", pokemon.stats.hp)}
                ${createStatBar("         Attack", pokemon.stats.attack)}
                ${createStatBar("        Defense", pokemon.stats.defense)}
                ${createStatBar(" Special Attack", pokemon.stats.special_attack)}
                ${createStatBar("Special Defense", pokemon.stats.special_defense)}
                ${createStatBar("          Speed", pokemon.stats.speed)}
                <li><strong>       Total:</strong> ${pokemon.total}</li>
            </ul>
        </section>

        <!-- Items -->
        <section class="pokemon-items">
            <h3>Items</h3>
            <ul>
                ${sortAndDisplay(pokemon.items)}
            </ul>
        </section>

        <!-- Spreads -->
        <section class="pokemon-spreads">
            <h3>Spreads</h3>
            <ul>
                ${sortAndDisplay(pokemon.spreads)}
            </ul>
        </section>

        <!-- Tera Types -->
        <section class="pokemon-tera-types">
            <h3>Tera Types</h3>
            <ul>
                ${Array.isArray(pokemon["Tera Types"]) && pokemon["Tera Types"].length > 0
                    ? pokemon["Tera Types"].map(tera => `<li>${tera}</li>`).join('')
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
                ${Array.isArray(pokemon["Checks and Counters"]) && pokemon["Checks and Counters"].length > 0
                    ? pokemon["Checks and Counters"].map(counter => `<li>${counter}</li>`).join('')
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
    `;
}

// Fonction pour trier et afficher les 10 premiers éléments d'une liste d'items, spreads, etc.
function sortAndDisplay(data) {
    if (!data) return '<li>Aucun élément disponible</li>';

    if (Array.isArray(data)) {
        // Si les éléments sont des objets avec des valeurs numériques, triez-les par valeur
        const sortedData = data.sort((a, b) => (b.value || 0) - (a.value || 0)); // Assurez-vous que les éléments ont une propriété 'value' pour le tri
        return sortedData.slice(0, 10).map(item => `<li>${item.name}: ${item.value || 'Non défini'}</li>`).join('');
    }

    if (typeof data === 'object') {
        // Si ce sont des objets, triez par valeur
        const sortedEntries = Object.entries(data)
            .sort((a, b) => (b[1] || 0) - (a[1] || 0))
            .slice(0, 10);
        
        return sortedEntries.map(([key, value]) => `<li>${key}: ${value || 'Non défini'}</li>`).join('');
    }

    return '<li>Aucun élément disponible</li>';
}

function createStatBar(label, value) {
    const maxStat = 255; // Valeur maximale pour ajuster la largeur de la barre
    const width = (value / maxStat) * 100; // Calcul de la largeur en pourcentage

    // Associer des couleurs aux statistiques
    const statColors = {
        "             HP": "#e74c3c", // Rouge
        "         Attack": "#f39c12", // Orange
        "        Defense": "#3498db", // Bleu
        " Special Attack": "#9b59b6", // Violet
        "Special Defense": "#2ecc71", // Vert clair
        "          Speed": "#e67e22"  // Orange foncé
    };

    const color = statColors[label] || "#7f8c8d"; // Couleur par défaut : gris

    return `
        <li style="display: flex; align-items: center; justify-content: flex-start; margin-bottom: 8px;">
            <strong style="width: 160px; text-align: right; margin-right: 10px;">${label}:</strong>
            <div style="flex-grow: 1; max-width: 800px; margin-right: 10px;">
                <div class="stat-bar" style="background-color: ${color}; width: ${width}%; height: 16px; border-radius: 4px;">
                    <span class="stat-value" style="padding-left: 5px; color: white; font-size: 12px; line-height: 16px;">${value || 'Non défini'}</span>
                </div>
            </div>
        </li>
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
