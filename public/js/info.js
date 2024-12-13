// Importation des fonctions du fichier pokemonFunctions.js
import { createStatBar, displaySpreads, displayTeammates, displayMoves, createTeraTypesChart, displayItems} from './infoFunction.js';

// Fonction pour récupérer un paramètre de l'URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Ajoute un événement au bouton "Retour" pour revenir à la page précédente
document.getElementById('back-button').addEventListener('click', () => {
    window.history.back();
});

// Ajoute un gestionnaire d'événements pour supprimer le Pokémon
document.getElementById('delete-button').addEventListener('click', async () => {
    const pokemonName = getQueryParam('name'); // Récupère le nom du Pokémon dans l'URL

    console.log("test");

    if (!pokemonName) {
        alert("Impossible de supprimer : le nom du Pokémon est introuvable.");
        return;
    }

    const confirmation = confirm(`Voulez-vous vraiment supprimer ${pokemonName} ?`);
    if (!confirmation) return;

    try {
        // Effectue une requête DELETE vers l'API
        const response = await fetch(`/api/pokemon/${pokemonName.toLowerCase()}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Échec de la suppression.');
        }

        alert(`Le Pokémon ${pokemonName} a été supprimé avec succès !`);
        // Redirige l'utilisateur après la suppression
        window.location.href = '/html/home.html';
    } catch (error) {
        console.error('Erreur lors de la suppression du Pokémon :', error);
        alert('Une erreur est survenue lors de la tentative de suppression du Pokémon.');
    }
});

//Ajoute un boute pour la "modification"
document.getElementById('edit-button').addEventListener('click', () => {
    const pokemonName = getQueryParam('name'); // Récupère le nom du Pokémon
    if (pokemonName) {
        window.location.href = `/html/editPokemon.html?name=${pokemonName}`;
    } else {
        alert("Nom du Pokémon introuvable.");
    }
});

// Fonction principale pour afficher les détails d'un Pokémon
function displayPokemonDetails(pokemon) {
    const detailsDiv = document.getElementById('pokemon-details');
    
    // Si le Pokémon n'existe pas, afficher un message d'erreur
    if (!pokemon) {
        detailsDiv.innerHTML = '<p>Pokémon non trouvé</p>';
        return;
    }

    // Détermine la classe CSS à utiliser en fonction du type de Pokémon
    function getTypeClass(type) {
        const typeClasses = {
            'fire': 'type-fire',
            'water': 'type-water',
            'grass': 'type-grass',
            'electric': 'type-electric',
            'poison': 'type-poison',
            'bug': 'type-bug',
            'normal': 'type-normal',
            'psychic': 'type-psychic',
            'fighting': 'type-fighting',
            'fairy': 'type-fairy',
            'rock': 'type-rock',
            'ghost': 'type-ghost',
            'ice': 'type-ice',
            'dragon': 'type-dragon',
            'dark': 'type-dark',
            'steel': 'type-steel',
            'flying': 'type-flying',
            'ground': 'type-ground',
            'unknown': 'type-unknown'
        };
        return typeClasses[type.toLowerCase()] || 'type-unknown';
    }

    const type1Class = getTypeClass(pokemon.type1);
    const type2Class = pokemon.type2 ? getTypeClass(pokemon.type2) : '';

    // Génère le HTML pour afficher les informations du Pokémon
    detailsDiv.innerHTML = `
        <h2>${pokemon.name}</h2>
        <div class="pokemon-image">
            <img src="/ressources/pokedex/${pokemon.image}" alt="${pokemon.name}" />
        </div>

        <!-- Informations de base -->
        <section class="pokemon-stats">
            <h3>Statistics</h3>
            <ul>
                <li><strong>Type:  </strong> 
                    ${pokemon.type1 ? `<span class="type-of-pokemon ${type1Class}">${pokemon.type1}</span>` : ''}
                    ${pokemon.type2 ? `<strong> / </strong><span class="type-of-pokemon ${type2Class}">${pokemon.type2}</span>` : ''}
                </li>
                <li><strong>Usage:</strong> ${(pokemon.usage * 100).toFixed(2)}%</li>
            </ul>
        </section>

        <!-- Détails des statistiques -->
        <section class="pokemon-detailed-stats">
            <h3>Detailed Stats</h3>
            <ul>
                ${createStatBar("HP", pokemon.stats.hp)}
                ${createStatBar("Attack", pokemon.stats.attack)}
                ${createStatBar("Defense", pokemon.stats.defense)}
                ${createStatBar("Special Attack", pokemon.stats.spAtk)}
                ${createStatBar("Special Defense", pokemon.stats.spDef)}
                ${createStatBar("Speed", pokemon.stats.speed)}
                <li><strong>Total:</strong> ${pokemon.total}</li>
            </ul>
        </section>

        <!-- Items -->
        <section class="pokemon-items">
            <h3>Items</h3>
            <ul>
                ${displayItems(pokemon.items)}
            </ul>
        </section>


        <!-- Spreads -->
        <section class="pokemon-spreads">
            <h3>Spreads</h3>
            <ul>
                ${displaySpreads(pokemon.spreads)}
            </ul>
        </section>

        <!-- Teammates -->
        <section class="pokemon-teammates">
            <h3>Teammates</h3>
            <ul>
                <!-- Les teammates seront insérés dynamiquement -->
                ${pokemon.teammates && pokemon.teammates.length > 0 
                    ? pokemon.teammates.map(teammate => `
                        <li>
                            <img src="${teammate.image}" alt="${teammate.name}" />
                            <span>${teammate.name}: ${(teammate.value * 100).toFixed(2)}%</span>
                        </li>
                    `).join('')
                    : '<li>Aucun teammate disponible</li>'
                }
            </ul>
        </section>


        <!-- Abilities -->
        <section class="pokemon-abilities">
            <h3>Abilities</h3>
            <ul>
                ${pokemon.abilities && typeof pokemon.abilities === 'object'
                    ? (() => {
                        const totalValue = Object.values(pokemon.abilities).reduce((sum, val) => sum + val, 0);
                        if (totalValue === 0) {
                            return '<li>No abilities available</li>';
                        }
                        return Object.entries(pokemon.abilities)
                            .sort(([, a], [, b]) => b - a) 
                            .map(([ability, value]) => {
                                const scaledValue = (value / totalValue) * 100; 
                                return `<li>${ability}: ${scaledValue.toFixed(2)}%</li>`;
                            })
                            .join('');
                    })()
                    : '<li>No abilities available</li>'
                }
            </ul>
        </section>

        <!-- Moves -->
        <section class="pokemon-moves">
            <h3>Moves</h3>
            <ul>
                ${ displayMoves(pokemon.moves)}
            </ul>
        </section>

    `;

    // Vérifie s'il existe des types Tera pour créer un graphique
    if (pokemon.teraTypes && Object.keys(pokemon.teraTypes).length > 0) {
        createTeraTypesChart(pokemon.teraTypes);
    } else {
        document.querySelector('.pokemon-tera-types-chart').innerHTML = '<p>No Tera Types data available</p>';
    }
}

// Fonction principale exécutée lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', async () => {
    const pokemonName = getQueryParam('name');

    if (pokemonName) {
        try {
            // Effectue une requête à l'API pour récupérer les données du Pokémon
            const response = await fetch(`/api/pokemon/${pokemonName.toLowerCase()}`);
            if (!response.ok) throw new Error('Pokémon not found');

            const pokemon = await response.json();
            displayPokemonDetails(pokemon);

            // Affiche les coéquipiers
            const teammatesHTML = await displayTeammates(pokemon.teammates);
            document.querySelector('.pokemon-teammates ul').innerHTML = teammatesHTML;
            
            // Affiche les attaques
            const movesHTML = await displayMoves(pokemon.moves);
            document.querySelector('.pokemon-moves ul').innerHTML = movesHTML;
        
        } catch (error) {
            console.error(error);
            document.getElementById('pokemon-details').innerHTML = '<p>Error.</p>';
        }
    }
});
