document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pokemonName = urlParams.get('name'); // Récupère le paramètre 'name' dans l'URL

    if (!pokemonName) {
        document.getElementById('status-message').innerText = 'Aucun Pokémon sélectionné pour modification.';
        console.log('Paramètre "name" manquant dans l\'URL.');
        return;
    }

    console.log(`Modification du Pokémon : ${pokemonName}`);

    fetch(`/api/pokemon/${pokemonName}`)
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
            document.getElementById('status-message').innerText = 'Erreur lors de la récupération des données.';
        });

    document.getElementById('edit-pokemon-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedPokemon = {
            name: document.getElementById('name').value,
            type1: document.getElementById('type1').value,
            type2: document.getElementById('type2').value || null,
            hp: parseInt(document.getElementById('hp').value, 10),
            attack: parseInt(document.getElementById('attack').value, 10),
            defense: parseInt(document.getElementById('defense').value, 10),
            spAtk: parseInt(document.getElementById('spAtk').value, 10),
            spDef: parseInt(document.getElementById('spDef').value, 10),
            speed: parseInt(document.getElementById('speed').value, 10),
            image: document.getElementById('image').value || '',
        };

        try {
            const response = await fetch(`/api/pokemon/${pokemonName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedPokemon),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erreur inconnue');

            alert(result.message); // Afficher un message d'alerte
            window.history.back(); // Rediriger vers la page précédente
        } catch (error) {
            console.error('Erreur lors de la modification du Pokémon :', error);
            document.getElementById('status-message').innerText = 'Erreur lors de la modification du Pokémon.';
        }
    });
});
