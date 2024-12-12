// -------------------- VARIABLES GLOBALES --------------------

// Sélection des éléments DOM
const searchInput = document.getElementById('pokemon-search');
const searchResults = document.getElementById('search-results');
const suggestionList = document.getElementById('suggestion-list');
const teamList = document.getElementById('team-list');
const saveTeamButton = document.getElementById('save-team-button');
const backButton = document.getElementById('back-button');
const randomTeamButton = document.getElementById('random-team-button');

// Équipe actuelle
const currentTeam = [];

// -------------------- ÉVÉNEMENTS --------------------

// Retour à la page précédente
backButton.addEventListener('click', () => {
    window.history.back();
});

// Sauvegarder l'équipe
saveTeamButton.addEventListener('click', saveTeam);

// Générer une équipe aléatoire
randomTeamButton.addEventListener('click', generateRandomTeam);

// Recherche de Pokémon
searchInput.addEventListener('input', searchPokemon);

// Redirection vers la page des équipes
document.getElementById('view-teams-button').addEventListener('click', () => {
    window.location.href = '/html/viewTeams.html';
});

// Charger les suggestions initiales au démarrage
document.addEventListener('DOMContentLoaded', () => {
    updateTeamList();
    loadSuggestions();
});

// -------------------- FONCTIONS PRINCIPALES --------------------

// Fonction pour mettre à jour l'affichage de l'équipe
function updateTeamList() {
    teamList.innerHTML = currentTeam.map((pokemon, index) => `
        <li>
            <img src="${pokemon.image}" alt="${pokemon.name}" style="width: 50px; height: 50px;" />
            ${pokemon.name}
            <button onclick="removeFromTeam(${index})" class="remove-button">Retirer</button>
        </li>
    `).join('');
    saveTeamButton.disabled = currentTeam.length === 0; // Désactiver le bouton si l'équipe est vide
}

// Fonction pour ajouter un Pokémon à l'équipe
function addToTeam(pokemon) {
    if (currentTeam.length >= 6) {
        alert('Votre équipe est déjà complète (6 Pokémon maximum)!');
        return;
    }
    if (currentTeam.some(p => p.name === pokemon.name)) {
        alert(`${pokemon.name} est déjà dans l'équipe !`);
        return;
    }
    const imagePath = pokemon.image.startsWith('/images/')
        ? pokemon.image
        : `/images/${pokemon.image || 'default.png'}`;

    currentTeam.push({ ...pokemon, image: imagePath });
    updateTeamList();
    loadSuggestions();
}

// Fonction pour retirer un Pokémon de l'équipe
function removeFromTeam(index) {
    currentTeam.splice(index, 1);
    updateTeamList();
}

// Sauvegarder l'équipe actuelle
function saveTeam() {
    const teamName = prompt('Entrez le nom de votre équipe :', 'TEAM');
    if (!teamName) {
        alert('Le nom de l\'équipe est requis pour la sauvegarde.');
        return;
    }

    const dataToSend = { 
        teamName, 
        members: currentTeam.map(pokemon => pokemon.name) 
    };
    console.log('Données envoyées pour sauvegarde :', dataToSend);

    fetch('/api/teams/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
    })
    .then(response => {
        if (!response.ok) throw new Error('Erreur serveur');
        return response.json();
    })
    .then(data => {
        if (data.message) {
            console.log('Réponse serveur :', data);
            alert('Équipe sauvegardée avec succès !');
        } else {
            alert('Erreur lors de la sauvegarde de l\'équipe.');
        }
    })
    .catch(error => {
        console.error('Erreur lors de la sauvegarde de l\'équipe :', error);
        alert('Erreur serveur lors de la sauvegarde.');
    });
}

// Générer une équipe aléatoire
async function generateRandomTeam() {
    try {
        const response = await fetch('/api/teams/random');
        if (!response.ok) throw new Error('Erreur lors de la récupération d\'une équipe aléatoire.');

        const randomTeam = await response.json();
        currentTeam.splice(0, currentTeam.length, ...randomTeam);
        updateTeamList();
    } catch (error) {
        console.error('Erreur lors de la génération d\'équipe aléatoire :', error);
        alert('Erreur lors de la génération de l\'équipe.');
    }
    loadSuggestions();
}

// -------------------- FONCTIONS DE RECHERCHE --------------------

// Rechercher des Pokémon
function searchPokemon() {
    const query = searchInput.value.trim().toLowerCase();

    if (!query) {
        searchResults.innerHTML = ''; // Réinitialiser les résultats si la recherche est vide
        return;
    }

    fetch(`/api/pokemon/search/suggestion/${query}`)
        .then(response => response.json())
        .then(results => {
            console.log('Résultats des suggestions :', results);
            searchResults.innerHTML = results.map(pokemon => `
                <li onclick="addToTeam({ name: '${pokemon.name}', image: '${pokemon.image || 'default.png'}' })">
                    <img src="${pokemon.image || 'default.png'}" alt="${pokemon.name}" style="width: 50px; height: 50px;" />
                    ${pokemon.name}
                </li>
            `).join('');
        })
        .catch(error => {
            console.error('Erreur lors de la recherche :', error);
            searchResults.innerHTML = '<li>Aucun Pokémon trouvé</li>';
        });
}

// Charger les suggestions basées sur l'équipe actuelle
function loadSuggestions() {
    fetch('/api/pokemon/teambuild/suggestion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTeam: currentTeam.map((pokemon) => pokemon.name) }),
    })
    .then((response) => {
        if (!response.ok) throw new Error('Erreur lors de la récupération des suggestions');
        return response.json();
    })
    .then((suggestions) => {
        console.log('Suggestions chargées :', suggestions);
        if (suggestions.length === 0) {
            suggestionList.innerHTML = '<li>Aucune suggestion disponible</li>';
            return;
        }

        suggestionList.innerHTML = suggestions
            .map(
                (pokemon) => `
                <li class="suggestion-item" onclick="addToTeam({ name: '${pokemon.name}', image: '${pokemon.image}' })">
                    <div style="display: flex; align-items: center;">
                        <img src="${pokemon.image}" alt="${pokemon.name}" style="width: 50px; height: 50px; margin-right: 10px;" />
                        <div>
                            <strong>${pokemon.name}</strong><br>
                            <span>Synergie : ${pokemon.synergyScore}</span>
                        </div>
                    </div>
                </li>`
            )
            .join('');
    })
    .catch((error) => {
        console.error('Erreur lors du chargement des suggestions :', error);
        suggestionList.innerHTML = '<li>Erreur lors du chargement des suggestions.</li>';
    });
}
