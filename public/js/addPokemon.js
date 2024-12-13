document.getElementById('add-pokemon-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Empêcher le rechargement de la page

    // Collecter les données du formulaire
    const pokemonData = {
        name: document.getElementById('name').value.trim(),
        type1: document.getElementById('type1').value.trim(),
        type2: document.getElementById('type2').value.trim(),
        hp: Math.min(255, parseInt(document.getElementById('hp').value.trim())),
        attack: Math.min(255, parseInt(document.getElementById('attack').value.trim())),
        defense: Math.min(255, parseInt(document.getElementById('defense').value.trim())),
        spAtk: Math.min(255, parseInt(document.getElementById('spAtk').value.trim())),
        spDef: Math.min(255, parseInt(document.getElementById('spDef').value.trim())),
        speed: Math.min(255, parseInt(document.getElementById('speed').value.trim())),
        image: document.getElementById('image').value.trim() || 'default.png', // Valeur par défaut si aucun URL n'est fourni
    };

    // Validation supplémentaire
    if (!pokemonData.name || !pokemonData.type1 || isNaN(pokemonData.hp) || isNaN(pokemonData.attack) || 
        isNaN(pokemonData.defense) || isNaN(pokemonData.spAtk) || isNaN(pokemonData.spDef) || isNaN(pokemonData.speed)) {
        document.getElementById('status-message').textContent = 'Veuillez remplir tous les champs correctement.';
        return;
    }

    // Vérification si les statistiques dépassent 255
    if (pokemonData.hp > 255 || pokemonData.attack > 255 || pokemonData.defense > 255 || 
        pokemonData.spAtk > 255 || pokemonData.spDef > 255 || pokemonData.speed > 255) {
        document.getElementById('status-message').textContent = 'Les valeurs des statistiques ne peuvent pas dépasser 255.';
        return;
    }

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
