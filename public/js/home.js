// Sélection des boutons
const createTeamButton = document.getElementById('create-team-button');
const viewTeamsButton = document.getElementById('view-teams-button');

// Redirection vers la page de création d'équipe
createTeamButton.addEventListener('click', () => {
    window.location.href = '/html/teamBuilder.html'; // Remplacez par le chemin de votre page
});

// Redirection vers la page des équipes sauvegardées
viewTeamsButton.addEventListener('click', () => {
    window.location.href = '/saved-teams.html'; // Remplacez par le chemin de votre page
});
