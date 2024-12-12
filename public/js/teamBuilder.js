// Sélection des éléments DOM
const searchInput = document.getElementById('pokemon-search');
const searchResults = document.getElementById('search-results');
const suggestionList = document.getElementById('suggestion-list');
const teamList = document.getElementById('team-list');
const saveTeamButton = document.getElementById('save-team-button');
const backButton = document.getElementById('back-button');

// Équipe actuelle
const currentTeam = [];

// Événement pour revenir à la page précédente
backButton.addEventListener('click', () => {
    window.history.back();
});

// Fonction pour mettre à jour la liste de l'équipe
function updateTeamList() {
    teamList.innerHTML = currentTeam.map((pokemon, index) => `
        <li>
            <img src="/images/${pokemon.image || 'default.png'}" alt="${pokemon.name}" style="width: 50px; height: 50px;" />
            ${pokemon.name}
            <button onclick="removeFromTeam(${index})" class="remove-button">Retirer</button>
        </li>
    `).join('');

    // Activer/désactiver le bouton de sauvegarde
    saveTeamButton.disabled = currentTeam.length === 0;
}

// Fonction pour retirer un Pokémon de l'équipe
function removeFromTeam(index) {
    currentTeam.splice(index, 1);
    updateTeamList();
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
    currentTeam.push(pokemon);
    updateTeamList();
    loadSuggestions();
}

// Sauvegarder l'équipe
saveTeamButton.addEventListener('click', () => {
    const teamName = prompt('Entrez le nom de votre équipe :', 'TEAM');
    if (!teamName) {
        alert('Le nom de l\'équipe est requis pour la sauvegarde.');
        return;
    }

    fetch('/api/teams/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, members: currentTeam.map(pokemon => pokemon.name) })
    })
    .then(response => response.json())
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
});


// Fonction de recherche de Pokémon
searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();

    // Réinitialiser les résultats si la recherche est vide
    if (!query) {
        searchResults.innerHTML = '';
        return;
    }

    // Appeler l'API pour rechercher des Pokémon
    fetch(`/api/pokemon/search/suggestion/${query}`)
        .then(response => response.json())
        .then(results => {
            // Afficher les résultats
            searchResults.innerHTML = results.map(pokemon => `
                <li onclick="addToTeam({ name: '${pokemon.name}', image: '${pokemon.image || 'default.png'}' })">
                    <img src="/images/${pokemon.image || 'default.png'}" alt="${pokemon.name}" style="width: 50px; height: 50px;" />
                    ${pokemon.name}
                </li>
            `).join('');
        })
        .catch(error => {
            console.error('Erreur lors de la recherche :', error);
            searchResults.innerHTML = '<li>Aucun Pokémon trouvé</li>';
        });
});

// Charger les suggestions initiales
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
            if (suggestions.length === 0) {
                suggestionList.innerHTML = '<li>Aucune suggestion disponible</li>';
                return;
            }

            suggestionList.innerHTML = suggestions
                .map(
                    (pokemon) => `
                    <li class="suggestion-item" onclick="addToTeam({ name: '${pokemon.name}', image: '${pokemon.image}' })">
                        <div style="display: flex; align-items: center;">
                            <img src="/images/${pokemon.image}" alt="${pokemon.name}" style="width: 50px; height: 50px; margin-right: 10px;" />
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




document.addEventListener('DOMContentLoaded', () => {
    updateTeamList(); // S'assure que la liste de l'équipe est à jour.
});

// Redirection vers la page où toutes les équipes sont listées
document.getElementById('view-teams-button').addEventListener('click', () => {
    window.location.href = '/html/viewTeams.html';
});

