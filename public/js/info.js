// Fonction pour récupérer les paramètres de l'URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function displayPokemonDetails(pokemon) {
    const detailsDiv = document.getElementById('pokemon-details');

    // Vérifiez si les données du Pokémon sont valides
    if (!pokemon) {
        detailsDiv.innerHTML = '<p>Pokémon non trouvé</p>';
        return;
    }

    // Fonction pour obtenir la classe CSS correspondant au type
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

    // Appel de la fonction getTypeClass pour obtenir les classes CSS des types
    const type1Class = getTypeClass(pokemon.type1);
    const type2Class = pokemon.type2 ? getTypeClass(pokemon.type2) : '';

    // Mise à jour du conteneur principal avec les détails
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
                ${sortAndDisplay(pokemon.items)}
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
                    ? Object.entries(pokemon.abilities)
                        .sort(([, a], [, b]) => b - a)
                        .map(([ability, value]) => `<li>${ability}: ${(value / 10000).toFixed(2)}%</li>`)
                        .join('')
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

    // Créez un camembert des Tera Types s'ils existent
    if (pokemon.teraTypes && Object.keys(pokemon.teraTypes).length > 0) {
        createTeraTypesChart(pokemon.teraTypes);
    } else {
        document.querySelector('.pokemon-tera-types-chart').innerHTML = '<p>No Tera Types data available</p>';
    }
}

// Fonction pour trier et afficher les 10 premiers éléments d'une liste d'items, spreads, etc.
function sortAndDisplay(data, total = 100) {
    if (!data) return '<li>Aucun élément disponible</li>';

    let normalizedData = [];

    if (Array.isArray(data)) {
        // Si les éléments sont des objets avec des valeurs numériques, triez-les par valeur
        const sortedData = data.sort((a, b) => (b.value || 0) - (a.value || 0));

        // Calculer la somme des valeurs
        const totalValue = sortedData.reduce((sum, item) => sum + (item.value || 0), 0);

        // Redistribuer les valeurs pour que la somme fasse 100
        if (totalValue > 0) {
            normalizedData = sortedData.map(item => ({
                name: item.name,
                value: (item.value / totalValue) * total
            }));
        }

        // Afficher les éléments normalisés
        return normalizedData.slice(0, 10).map(item => `<li>${item.name}: ${item.value.toFixed(2)}%</li>`).join('');
    }

    if (typeof data === 'object') {
        // Si ce sont des objets, triez par valeur
        const sortedEntries = Object.entries(data)
            .sort((a, b) => (b[1] || 0) - (a[1] || 0))
            .slice(0, 10);

        // Calculer la somme des valeurs
        const totalValue = sortedEntries.reduce((sum, entry) => sum + (entry[1] || 0), 0);

        // Redistribuer les valeurs pour que la somme fasse 100
        if (totalValue > 0) {
            normalizedData = sortedEntries.map(([key, value]) => ({
                name: key,
                value: (value / totalValue) * total
            }));
        }

        return normalizedData.map(item => `<li>${item.name}: ${item.value.toFixed(2)}%</li>`).join('');
    }

    return '<li>Aucun élément disponible</li>';
}

function createStatBar(label, value) {
    const maxStat = 255; // Valeur maximale pour ajuster la largeur de la barre
    const width = (value / maxStat) * 100; // Calcul de la largeur en pourcentage

    // Associer des couleurs aux statistiques
    const statColors = {
        "HP": "#e74c3c", // Rouge
        "Attack": "#f39c12", // Orange
        "Defense": "#3498db", // Bleu
        "Special Attack": "#9b59b6", // Violet
        "Special Defense": "#2ecc71", // Vert clair
        "Speed": "#e67e22"  // Orange foncé
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

function createTeraTypesChart(teraTypes) {
    const ctx = document.getElementById('teraTypesChart').getContext('2d');

    const labels = Object.keys(teraTypes);
    const rawData = Object.values(teraTypes);

    // Calcul de la somme des valeurs pour normaliser
    const total = rawData.reduce((sum, value) => sum + value, 0);
    const data = rawData.map(value => (value / total) * 100); // Normaliser pour que la somme fasse 100%

    // Fonction pour extraire la couleur définie dans le CSS d'une classe
    function getColorFromCSS(typeClass) {
        const tempElement = document.createElement('div');
        tempElement.className = `type-${typeClass.toLowerCase()}`;
        document.body.appendChild(tempElement);
        const color = window.getComputedStyle(tempElement).color;
        document.body.removeChild(tempElement);
        return color;
    }

    // Récupérer les couleurs associées à chaque type
    const colors = labels.map(label => getColorFromCSS(label));

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors // Utiliser les couleurs dynamiques
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Désactiver l'aspect ratio pour personnaliser la taille
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const value = tooltipItem.raw.toFixed(2);
                            return `${tooltipItem.label}: ${value}%`;
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 20,
                }
            }
        }
    });
}

// Récupération des données à l'ouverture de la page
document.addEventListener('DOMContentLoaded', async () => {
    const pokemonName = getQueryParam('name');

    if (pokemonName) {
        try {
            const response = await fetch(`/api/pokemon/${pokemonName.toLowerCase()}`);
            if (!response.ok) throw new Error('Pokémon non trouvé');

            const pokemon = await response.json();
            displayPokemonDetails(pokemon);

            const teammatesHTML = await displayTeammates(pokemon.teammates);
            document.querySelector('.pokemon-teammates ul').innerHTML = teammatesHTML;
            
            const movesHTML = await displayMoves(pokemon.moves);
            document.querySelector('.pokemon-moves ul').innerHTML = movesHTML;
        
        } catch (error) {
            console.error(error);
            document.getElementById('pokemon-details').innerHTML = '<p>Erreur lors de la récupération des détails.</p>';
        }
    }
});

function displayAbilities(abilities) {
    if (!abilities || typeof abilities !== 'object' || Object.keys(abilities).length === 0) {
        return '<li>No abilities available</li>';
    }

    // Trier les abilities par valeur décroissante
    const sortedAbilities = Object.entries(abilities)
        .sort(([, a], [, b]) => b - a) // Tri par valeur décroissante
        .slice(0, 10); // Limiter aux 10 premières abilities

    // Calculer la somme des valeurs
    const totalValue = sortedAbilities.reduce((sum, [, value]) => sum + value, 0);

    // Normaliser les valeurs pour qu'elles représentent un pourcentage
    const normalizedAbilities = sortedAbilities.map(([ability, value]) => ({
        ability: ability,
        value: totalValue > 0 ? (value / totalValue) * 100 : 0 // Calcul du pourcentage
    }));

    // Générer la liste HTML
    return normalizedAbilities
        .map(item => `<li>${item.ability}: ${item.value.toFixed(2)}%</li>`)
        .join('');
}

// Exemple pour les items
function displayItems(items) {
    if (!items || items.length === 0) return '<li>No items available</li>';

    const sortedItems = sortAndDisplay(items);
    return sortedItems;
}

// Fonction pour afficher les moves avec leurs valeurs normalisées
async function displayMoves(moves) {
    if (!moves || typeof moves !== 'object') return '<li>No moves available</li>';

    // Trier les moves par valeur décroissante (les plus utilisés en premier)
    const sortedMoves = Object.entries(moves)
        .sort(([, a], [, b]) => b - a)  // Tri par valeur décroissante
        .slice(0, 10);  // Limiter aux 10 premiers

    // Calculer la somme des valeurs pour normaliser
    const totalValue = sortedMoves.reduce((sum, [, value]) => sum + value, 0);

    // Normaliser les valeurs pour que la somme fasse 100
    const normalizedMoves = sortedMoves.map(([move, value]) => ({
        move: move,
        value: totalValue > 0 ? (value / totalValue) * 100 : 0  // Calcul du pourcentage
    }));

    // Afficher les 10 moves les plus utilisés avec leur pourcentage
    return normalizedMoves.map(item => `<li>${item.move}: ${item.value.toFixed(2)}%</li>`).join('');
}

async function displayTeammates(teammates) {
    if (!teammates || typeof teammates !== 'object') return '<li>Aucun teammate disponible</li>';

    // Trier les coéquipiers par valeur décroissante
    const sortedTeammates = Object.entries(teammates)
        .sort(([, a], [, b]) => b - a)  // Tri par valeur décroissante
        .slice(0, 10);  // Limite aux 10 premiers

    // Calculer la somme des valeurs
    const totalValue = sortedTeammates.reduce((sum, [, value]) => sum + value, 0);

    // Normaliser les valeurs pour que la somme fasse 100
    const normalizedTeammates = sortedTeammates.map(([name, value]) => ({
        name: name,
        value: totalValue > 0 ? (value / totalValue) * 100 : 0  // Pourcentage
    }));

    // Récupérer les images des coéquipiers et afficher la liste
    const teammateList = await Promise.all(
        normalizedTeammates.map(async ({ name, value }) => {
            const imageUrl = await getTeammateImage(name);

            // Ignorer les coéquipiers sans image valide
            if (!imageUrl) return null;

            return `
                <li style="display: flex; align-items: center; margin-bottom: 8px;">
                    <img src="${imageUrl}" alt="${name}" style="width: 40px; height: 40px; margin-right: 10px; border-radius: 50%;" />
                    <span>${name}: ${value.toFixed(2)}%</span>
                </li>
            `;
        })
    );

    // Filtrer les éléments nuls (coéquipiers sans image valide) et joindre les résultats
    return teammateList.filter(item => item !== null).join('');
}

async function getTeammateImage(name) {
    try {
        const response = await fetch(`/api/pokemon/${name.toLowerCase()}`);
        if (response.ok) {
            const teammateData = await response.json();
            return teammateData.image
                ? `/ressources/pokedex/${teammateData.image}`
                : null; // Retourne null si aucune image spécifique n'est disponible
        }
    } catch {
        return null; // Retourne null en cas d'erreur
    }
}

function displaySpreads(spreads) {
    if (!spreads || spreads.length === 0) return '<li>Aucun spread disponible</li>';

    // Trier les spreads par valeur décroissante
    const sortedSpreads = Object.entries(spreads)
        .sort(([, a], [, b]) => b - a) // Tri par valeur décroissante
        .slice(0, 10); // Limiter aux 10 premiers

    // Calculer la somme des valeurs pour normaliser
    const totalValue = sortedSpreads.reduce((sum, [, value]) => sum + value, 0);

    // Normaliser les valeurs pour que la somme fasse 100
    const normalizedSpreads = sortedSpreads.map(([spread, value]) => ({
        spread: spread,
        value: totalValue > 0 ? (value / totalValue) * 100 : 0 // Pourcentage
    }));

    // Générer le HTML pour chaque spread
    return normalizedSpreads.map(({ spread, value }) => {
        // Séparer la nature et les IVs (exemple : "Jolly" et "4/252/4/0/36/212")
        const [nature, ivs] = spread.split(':');
        return `
            <li style="display: flex; align-items: center; justify-content: space-between; padding: 5px 0;">
                <div style="flex: 1; text-align: left; font-weight: bold;">
                    <span style="color: #87CEEB;">Nature:</span> ${nature}
                </div>
                <div style="flex: 2; text-align: center;">
                    <span style="color: #87CEEB;">IVs:</span> ${ivs}
                </div>
                <div style="flex: 1; text-align: right; font-weight: bold;">
                    ${value.toFixed(2)}%
                </div>
            </li>
        `;
    }).join('');
}
