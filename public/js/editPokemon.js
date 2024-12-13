document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pokemonName = urlParams.get('name'); // Récupère le paramètre 'name' dans l'URL

    if (!pokemonName) {
        displayModal('Erreur', 'Aucun Pokémon sélectionné pour modification.', 'error');
        console.error('Paramètre "name" manquant dans l\'URL.');
        return;
    }

    console.log(`Modification du Pokémon : ${pokemonName}`);

    // Charger les données du Pokémon
    fetch(`/api/pokemon/${encodeURIComponent(pokemonName)}`)
        .then(response => {
            if (!response.ok) throw new Error('Erreur lors de la récupération des données du Pokémon.');
            return response.json();
        })
        .then(pokemon => {
            document.getElementById('name').value = pokemon.name;
            document.getElementById('type1').value = pokemon.type1 || '';
            document.getElementById('type2').value = pokemon.type2 || '';
            document.getElementById('hp').value = pokemon.stats.hp;
            document.getElementById('attack').value = pokemon.stats.attack;
            document.getElementById('defense').value = pokemon.stats.defense;
            document.getElementById('spAtk').value = pokemon.stats.spAtk;
            document.getElementById('spDef').value = pokemon.stats.spDef;
            document.getElementById('speed').value = pokemon.stats.speed;
            document.getElementById('image').value = pokemon.image || '';
        })
        .catch(error => {
            console.error('Erreur lors de la récupération des données :', error);
            displayModal('Erreur', 'Erreur lors de la récupération des données.', 'error');
        });

    // Gestion de la soumission du formulaire
    document.getElementById('edit-pokemon-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedPokemon = {
            name: document.getElementById('name').value.trim(),
            type1: document.getElementById('type1').value.trim(),
            type2: document.getElementById('type2').value.trim() || null,
            hp: Math.min(255, parseInt(document.getElementById('hp').value.trim(), 10)),
            attack: Math.min(255, parseInt(document.getElementById('attack').value.trim(), 10)),
            defense: Math.min(255, parseInt(document.getElementById('defense').value.trim(), 10)),
            spAtk: Math.min(255, parseInt(document.getElementById('spAtk').value.trim(), 10)),
            spDef: Math.min(255, parseInt(document.getElementById('spDef').value.trim(), 10)),
            speed: Math.min(255, parseInt(document.getElementById('speed').value.trim(), 10)),
            image: document.getElementById('image').value.trim() || '',
        };

        // Validation des champs
        if (!updatedPokemon.name || !updatedPokemon.type1 || isNaN(updatedPokemon.hp) || isNaN(updatedPokemon.attack) ||
            isNaN(updatedPokemon.defense) || isNaN(updatedPokemon.spAtk) || isNaN(updatedPokemon.spDef) || isNaN(updatedPokemon.speed)) {
            displayModal('Erreur', 'Tous les champs requis doivent être remplis correctement.', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/pokemon/${encodeURIComponent(pokemonName)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedPokemon),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erreur inconnue');

            // Afficher un message de succès et rediriger vers la page d'information
            displayModal('Succès', result.message, 'success', () => {
                window.location.href = `/html/info.html?name=${encodeURIComponent(updatedPokemon.name)}`;
            });
        } catch (error) {
            console.error('Erreur lors de la modification du Pokémon :', error);
            displayModal('Erreur', error.message || 'Erreur lors de la modification du Pokémon.', 'error');
        }
    });

    // Fonction pour afficher une fenêtre modale ou un message
    function displayModal(title, message, type, callback) {
        const statusMessage = document.getElementById('status-message');
        statusMessage.innerHTML = `<strong>${title}:</strong> ${message}`;
        statusMessage.style.color = type === 'error' ? 'red' : 'green';

        if (callback) {
            setTimeout(callback, 2000); // Exécuter un callback après 2 secondes si fourni
        }
    }
});
