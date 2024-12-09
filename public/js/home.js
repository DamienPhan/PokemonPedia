// Sélection des boutons
const createTeamButton = document.getElementById('create-team-button');
const viewTeamsButton = document.getElementById('view-teams-button');
const viewPokemonButton = document.getElementById('view-pokemon-button');
const createPokemonButton = document.getElementById('create-pokemon-button');

// Redirection vers la page de création d'équipe
createTeamButton.addEventListener('click', () => {
    window.location.href = '/html/teamBuilder.html'; // Remplacez par le chemin de votre page
});

// Redirection vers la page des équipes sauvegardées
viewTeamsButton.addEventListener('click', () => {
    window.location.href = '/saved-teams.html'; // Remplacez par le chemin de votre page
});

// Redirection vers la page des pokémons sauvegardées
viewPokemonButton.addEventListener('click', () => {
    window.location.href = '/html/main.html'; // Remplacez par le chemin de votre page
});

// Redirection vers la page des pokémons sauvegardées
createPokemonButton.addEventListener('click', () => {
    window.location.href = '/html/addPokemon.html'; // Remplacez par le chemin de votre page
});

