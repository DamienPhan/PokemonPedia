// Fonction pour ajouter un Pokémon
document.getElementById('add-pokemon-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Empêcher le rechargement de la page

    // Collecter les données du formulaire
    const pokemonData = {
        name: document.getElementById('name').value,
        type1: document.getElementById('type1').value,
        type2: document.getElementById('type2').value,
        hp: parseInt(document.getElementById('hp').value),
        attack: parseInt(document.getElementById('attack').value),
        defense: parseInt(document.getElementById('defense').value),
        spAtk: parseInt(document.getElementById('spAtk').value),
        spDef: parseInt(document.getElementById('spDef').value),
        speed: parseInt(document.getElementById('speed').value),
        image: document.getElementById('image').value || 'default.png', // Valeur par défaut si aucun URL n'est fourni
    };

    // Envoyer la requête POST pour ajouter un Pokémon
    fetch('/api/pokemon', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(pokemonData),
    })
    .then(response => {
        if (response.ok) {
            return response.text(); // Récupérer le message de succès
        } else {
            throw new Error('Erreur lors de l\'ajout du Pokémon');
        }
    })
    .then(message => {
        // Afficher un message de succès
        document.getElementById('status-message').textContent = 'Pokémon ajouté avec succès !';

        // Rediriger vers la page des détails du Pokémon après 2 secondes
        setTimeout(() => {
            window.location.href = `/html/info.html?name=${encodeURIComponent(pokemonData.name)}`;
        }, 2000);
    })
    .catch(error => {
        console.error('Erreur:', error);
        document.getElementById('status-message').textContent = 'Erreur lors de l\'ajout du Pokémon.';
    });
});
