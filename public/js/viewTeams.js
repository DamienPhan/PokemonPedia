// Charger les équipes depuis le backend
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/teams')
        .then((response) => {
            if (!response.ok) throw new Error('Erreur lors de la récupération des équipes');
            return response.json();
        })
        .then((teams) => {
            const teamsList = document.getElementById('teams-list');
            if (teams.length === 0) {
                teamsList.innerHTML = '<li>Aucune équipe enregistrée.</li>';
                return;
            }

            teamsList.innerHTML = teams
                .map(
                    (team) => `
                    <li class="team-item">
                        <!-- Affichage des informations de l'équipe -->
                        <div class="team-info">
                            <h2>${team.teamName}</h2>
                            <div class="team-members">
                                ${team.members
                                    .map(
                                        (pokemon) => `
                                        <span>
                                            <img src="${pokemon.image}" alt="${pokemon.name}" />
                                            ${pokemon.name}
                                        </span>
                                    `
                                    )
                                    .join('')}
                            </div>
                            <p class="timestamp">Créée le : ${new Date(team.timestamp).toLocaleString()}</p>
                        </div>
                    </li>`
                )
                .join('');
        })
        .catch((error) => {
            console.error('Erreur lors de la récupération des équipes :', error);
            document.getElementById('teams-list').innerHTML =
                '<li>Erreur lors du chargement des équipes.</li>';
        });
});
