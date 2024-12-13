// Crée une barre de statistique pour un Pokémon (HTML + styles)
export function createStatBar(label, value) {
    const maxStat = 255;
    const width = (value / maxStat) * 100;

    // Détermine la couleur en fonction de la valeur
    let color;
    if (value < 50) {
        color = "#e74c3c"; // Rouge
    } else if (value < 75) {
        color = "#f39c12"; // Orange
    } else if (value < 100) {
        color = "#f1c40f"; // Jaune
    } else if (value < 125) {
        color = "#2ecc71"; // Vert clair
    } else if (value < 150) {
        color = "#3498db"; // Bleu
    } else {
        color = "#9b59b6"; // Violet
    }

    // Crée l'élément HTML de la barre de statistique
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

export function displayItems(itemsObj) {
    // Utilisation de sortAndDisplay pour gérer le calcul des pourcentages
    const itemsArray = Object.entries(itemsObj).map(([name, percentage]) => ({ name, percentage }));

    // Trier et afficher les items avec les pourcentages correctement calculés
    const htmlOutput = sortAndDisplay(itemsArray.map(item => ({ name: item.name, value: item.percentage })));

    return htmlOutput || '<li>No items available</li>';
}

export function sortAndDisplay(data, total = 100) {
    if (!data) return '<li>No data available</li>';

    const normalizedData = [];

    // Fonction générique pour obtenir l'URL de l'image avec fallback
    const getImageUrl = (itemName) => {
        const itemNameForImage = itemName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        const primaryUrl = `/ressources/hold-item/${itemNameForImage}.png`;
        const fallbackUrl = `/ressources/berry/${itemNameForImage.slice(0, -5)}.png`; // enlever les 5 dernières lettres
        return `${primaryUrl},${fallbackUrl}`;
    };

    // Traitement des données, que ce soit un tableau ou un objet
    const processedData = Array.isArray(data) 
        ? data.sort((a, b) => (b.value || 0) - (a.value || 0))
            .map(item => ({
                name: item.name,
                value: (item.value || 0) / data.reduce((sum, i) => sum + (i.value || 0), 0) * total
            }))
        : Object.entries(data)
            .sort((a, b) => (b[1] || 0) - (a[1] || 0))
            .map(([key, value]) => ({
                name: key,
                value: (value || 0) / Object.values(data).reduce((sum, v) => sum + (v || 0), 0) * total
            }));

    // Générer le HTML avec les images
    return processedData.slice(0, 10).map(item => {
        const imageUrls = getImageUrl(item.name);
        return `
            <li style="display: flex; align-items: center; margin-bottom: 8px;">
                <img src="${imageUrls.split(',')[0]}" 
                     alt="${item.name}"
                     onerror="this.src='${imageUrls.split(',')[1]}'; this.onerror=null;" 
                     style="width: 40px; height: 40px; margin-right: 10px; border-radius: 4px;" />
                <span>${item.name}: ${item.value.toFixed(2)}%</span>
            </li>
        `;
    }).join('') || '<li>Not found</li>';
}

// Fonction pour afficher les répartitions (spreads)
export function displaySpreads(spreads) {
    if (!spreads || spreads.length === 0) return '<li>Aucun spread disponible</li>';
    const sortedSpreads = Object.entries(spreads)
        .sort(([, a], [, b]) => b - a) 
        .slice(0, 10); 
    const totalValue = sortedSpreads.reduce((sum, [, value]) => sum + value, 0);
    const normalizedSpreads = sortedSpreads.map(([spread, value]) => ({
        spread: spread,
        value: totalValue > 0 ? (value / totalValue) * 100 : 0 
    }));


    // Retourne un HTML détaillé pour chaque répartition
    return normalizedSpreads.map(({ spread, value }) => {
        const [nature, ivs] = spread.split(':'); // Sépare la nature et les IVs
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

// Fonction pour afficher les coéquipiers (teammates)
export async function displayTeammates(teammates) {
    if (!teammates || typeof teammates !== 'object') return '<li>Aucun teammate disponible</li>';
    
    const sortedTeammates = Object.entries(teammates)
        .sort(([, a], [, b]) => b - a)  
        .slice(0, 10);  

    const totalValue = sortedTeammates.reduce((sum, [, value]) => sum + value, 0);
    const normalizedTeammates = sortedTeammates.map(([name, value]) => ({
        name: name,
        value: totalValue > 0 ? (value / totalValue) * 100 : 0  
    }));

    // Génère un HTML pour chaque coéquipier avec son image et un lien vers sa page
    const teammateList = await Promise.all(
        normalizedTeammates.map(async ({ name, value }) => {
            const imageUrl = await getTeammateImage(name);

            if (!imageUrl) return null;

            // Crée un lien autour du nom du Pokémon
            const pokemonLink = `/html/info.html?name=${name.toLowerCase()}`;

            return `
                <li style="display: flex; align-items: center; margin-bottom: 8px;">
                    <img src="${imageUrl}" alt="${name}" style="width: 40px; height: 40px; margin-right: 10px; border-radius: 50%;" />
                    <a href="${pokemonLink}" style="text-decoration: none; color: inherit;">
                        <span>${name}: ${value.toFixed(2)}%</span>
                    </a>
                </li>
            `;
        })
    );
    
    return teammateList.filter(item => item !== null).join('');
}

// Fonction pour récupérer l'image d'un coéquipier
async function getTeammateImage(name) {
    try {
        const response = await fetch(`/api/pokemon/${name.toLowerCase()}`);
        if (response.ok) {
            const teammateData = await response.json();
            return teammateData.image
                ? `/ressources/pokedex/${teammateData.image}`
                : null; 
        }
    } catch {
        return null; 
    }
}

// Fonction pour afficher les capacités du Pokémon
export function displayAbilities(abilities) {
    if (!abilities || typeof abilities !== 'object' || Object.keys(abilities).length === 0) {
        return '<li>No abilities available</li>';
    }
    const sortedAbilities = Object.entries(abilities)
        .sort(([, a], [, b]) => b - a) 
        .slice(0, 10); 
    const totalValue = sortedAbilities.reduce((sum, [, value]) => sum + value, 0);
    const normalizedAbilities = sortedAbilities.map(([ability, value]) => ({
        ability: ability,
        value: totalValue > 0 ? (value / totalValue) * 100 : 0 
    }));
    return normalizedAbilities
        .map(item => `<li>${item.ability}: ${item.value.toFixed(2)}%</li>`)
        .join('');
}

// Fonction pour afficher les moves
export async function displayMoves(moves) {
    if (!moves || typeof moves !== 'object') return '<li>No moves available</li>';
    const sortedMoves = Object.entries(moves)
        .sort(([, a], [, b]) => b - a)  
        .slice(0, 10);  

    const totalValue = sortedMoves.reduce((sum, [, value]) => sum + value, 0);
    const normalizedMoves = sortedMoves.map(([move, value]) => ({
        move: move,
        value: totalValue > 0 ? (value / totalValue) * 100 : 0  
    }));
    return normalizedMoves.map(item => `<li>${item.move}: ${item.value.toFixed(2)}%</li>`).join('');
}

// Fonction pour créer un graphique en secteurs (Tera Types)
export function createTeraTypesChart(teraTypes) {
    const ctx = document.getElementById('teraTypesChart').getContext('2d');
    const labels = Object.keys(teraTypes);
    const rawData = Object.values(teraTypes);
    const total = rawData.reduce((sum, value) => sum + value, 0);
    const data = rawData.map(value => (value / total) * 100); 

    // Fonction pour récupérer la couleur CSS associée à un type
    function getColorFromCSS(typeClass) {
        const tempElement = document.createElement('div');
        tempElement.className = `type-${typeClass.toLowerCase()}`;
        document.body.appendChild(tempElement);
        const color = window.getComputedStyle(tempElement).color;
        document.body.removeChild(tempElement);
        return color;
    }

    const colors = labels.map(label => getColorFromCSS(label));

    // Crée le graphique à l'aide de Chart.js
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
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