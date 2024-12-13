// -------------------- VARIABLES GLOBALES --------------------

// Sélection des éléments DOM
const teamsList = document.getElementById('teams-list');
const searchButton = document.getElementById('search-button');
const searchBar = document.getElementById('search-bar');
const statusMessage = document.getElementById('status-message');

// -------------------- FONCTIONS PRINCIPALES --------------------

// Charger toutes les équipes
async function fetchTeams() {
    try {
        const response = await fetch('/api/teams');
        if (!response.ok) throw new Error('Erreur lors de la récupération des équipes.');

        const teams = await response.json();
        if (teams.length === 0) {
            displayStatusMessage('Info', 'Aucune équipe enregistrée.', 'info');
            teamsList.innerHTML = '';
            return;
        }

        // Afficher les équipes enrichies
        displayTeams(teams);
    } catch (error) {
        console.error('Erreur lors de la récupération des équipes :', error);
        displayStatusMessage('Erreur', 'Erreur lors du chargement des équipes.', 'error');
    }
}

// Rechercher une équipe
async function searchTeams() {
    const searchQuery = searchBar.value.trim();

    // Vérification de l'entrée
    if (!searchQuery) {
        displayStatusMessage('Erreur', 'Veuillez entrer un nom pour la recherche.', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/teams/search/${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de la recherche.');
        }

        const teams = await response.json();

        // Afficher les équipes ou un message si aucune n'est trouvée
        if (teams.length > 0) {
            displayTeams(teams);
            displayStatusMessage('Succès', 'Résultats trouvés.', 'success');
        } else {
            displayStatusMessage('Info', 'Aucune équipe correspondante trouvée.', 'info');
            teamsList.innerHTML = '';
        }
    } catch (error) {
        console.error('Erreur lors de la recherche :', error);
        displayStatusMessage('Erreur', error.message || 'Erreur lors de la recherche des équipes.', 'error');
    }
}

// Supprimer une équipe
async function deleteTeam(teamId) {
    const confirmation = confirm('Voulez-vous vraiment supprimer cette équipe ?');
    if (!confirmation) return;

    try {
        const response = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Erreur lors de la suppression.');

        alert('Équipe supprimée avec succès.');
        fetchTeams(); // Recharger la liste des équipes
    } catch (error) {
        console.error('Erreur lors de la suppression :', error);
        displayStatusMessage('Erreur', 'Une erreur est survenue lors de la suppression.', 'error');
    }
}

// Mettre à jour une équipe
async function updateTeam(teamId) {
    const newName = prompt('Entrez le nouveau nom de l\'équipe :');
    const newMembers = prompt('Entrez les nouveaux membres (séparés par des virgules) :');

    if (!newName || !newMembers) {
        alert('Le nom et les membres sont requis.');
        return;
    }

    const membersArray = newMembers.split(',').map(member => member.trim());

    try {
        const response = await fetch(`/api/teams/${teamId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamName: newName, members: membersArray }),
        });

        const result = await response.json();

        if (!response.ok) {
            if (result.missingPokemons) {
                displayStatusMessage('Erreur', `Les Pokémon suivants n'existent pas : ${result.missingPokemons.join(', ')}`, 'error');
            } else {
                displayStatusMessage('Erreur', 'Erreur lors de la mise à jour.', 'error');
            }
            return;
        }

        alert('Équipe mise à jour avec succès.');
        fetchTeams(); // Recharger la liste des équipes
    } catch (error) {
        console.error('Erreur lors de la mise à jour :', error);
        displayStatusMessage('Erreur', 'Une erreur est survenue lors de la mise à jour.', 'error');
    }
}

// -------------------- FONCTIONS UTILITAIRES --------------------

// Afficher les équipes dans la liste
function displayTeams(teams) {
    teamsList.innerHTML = teams
        .map(team => `
            <li class="team-item">
                <div class="team-info">
                    <h2>${team.teamName}</h2>
                    <p>Membres :</p>
                    <div class="team-members">
                        ${team.members
                            .map(member => `
                                <span class="team-member">
                                    <img src="${member.image}" alt="${member.name}" class="member-image" />
                                    ${member.name}
                                </span>
                            `)
                            .join('')}
                    </div>
                    <p>Date de création : ${new Date(team.timestamp).toLocaleString()}</p>
                    <button class="update-team-button" data-id="${team._id}">Mettre à jour</button>
                    <button class="delete-team-button" data-id="${team._id}">Supprimer</button>
                </div>
            </li>
        `)
        .join('');
}



// Fonction pour afficher un message d'état
function displayStatusMessage(title, message, type) {
    const statusMessage = document.getElementById('status-message');
    if (!statusMessage) {
        console.error('Element #status-message introuvable dans le DOM.');
        return;
    }
    statusMessage.innerHTML = `<strong>${title}:</strong> ${message}`;
    statusMessage.style.color = type === 'error' ? 'red' : type === 'info' ? 'blue' : 'green';
    statusMessage.style.display = 'block';
}


// -------------------- GESTION DES ÉVÉNEMENTS --------------------

// Chargement initial des équipes
document.addEventListener('DOMContentLoaded', fetchTeams);

// Recherche d'une équipe
searchButton.addEventListener('click', searchTeams);

// Gestion des clics pour mise à jour et suppression
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-team-button')) {
        const teamId = e.target.dataset.id;
        deleteTeam(teamId);
    }

    if (e.target.classList.contains('update-team-button')) {
        const teamId = e.target.dataset.id;
        updateTeam(teamId);
    }
});
