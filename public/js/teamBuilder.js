const team = [];

// Update the current team display
function updateTeamList() {
    const teamList = document.getElementById("team-list");
    teamList.innerHTML = ""; // Reset the list

    team.forEach(pokemon => {
        const li = document.createElement("li");
        li.textContent = pokemon.name;

        const img = document.createElement("img");
        img.src = pokemon.image || "/images/default.png"; // Fallback to default image
        img.alt = pokemon.name;
        img.classList.add("pokemon-image");

        const removeButton = document.createElement("button");
        removeButton.textContent = "Retirer";
        removeButton.classList.add("remove-button");
        removeButton.onclick = () => removeFromTeam(pokemon.name);

        li.appendChild(img);
        li.appendChild(removeButton);
        teamList.appendChild(li);
    });

    document.getElementById("save-team-button").disabled = team.length < 6;
}

// Update displayed suggestions
function updateSuggestions(suggestions) {
    const suggestionList = document.getElementById("suggestion-list");
    suggestionList.innerHTML = ""; // Clear previous suggestions

    suggestions.forEach(suggestion => {
        const li = document.createElement("li");

        const img = document.createElement("img");
        img.src = suggestion.image || "/images/default.png"; // Fallback to default image
        img.alt = suggestion.PName;
        img.classList.add("pokemon-image");

        li.textContent = `${suggestion.PName} (Score: ${suggestion["Combined Score"].toFixed(2)})`;

        const addButton = document.createElement("button");
        addButton.textContent = "Ajouter";
        addButton.classList.add("add-button");
        addButton.onclick = () => addToTeam({
            name: suggestion.PName,
            image: suggestion.image || "/images/default.png",
            stats: suggestion.Stats,
            type1: suggestion["Type 1"],
            type2: suggestion["Type 2"]
        });

        li.appendChild(img);
        li.appendChild(addButton);
        suggestionList.appendChild(li);
    });
}

// Add a Pokémon to the team
function addToTeam(pokemon) {
    if (team.length >= 6) {
        alert("Votre équipe est déjà complète avec 6 Pokémon.");
        return;
    }
    if (team.some(p => p.name === pokemon.name)) {
        alert(`${pokemon.name} est déjà dans l'équipe.`);
        return;
    }

    team.push(pokemon);
    updateTeamList();
    fetchTeamSuggestions(); // Fetch updated suggestions based on the current team
}

// Remove a Pokémon from the team
function removeFromTeam(name) {
    const index = team.findIndex(p => p.name === name);
    if (index > -1) {
        team.splice(index, 1);
        updateTeamList();
        fetchTeamSuggestions(); // Fetch updated suggestions after removal
    }
}

// Fetch team-based suggestions from the Python backend
async function fetchTeamSuggestions() {
    if (team.length === 0) {
        updateSuggestions([]); // Clear suggestions if the team is empty
        return;
    }

    const teamNames = team.map(p => p.name).join(",");
    try {
        const response = await fetch(`/api/team-suggestions/${teamNames}`);
        if (!response.ok) {
            throw new Error("Erreur lors de la récupération des suggestions.");
        }

        const suggestions = await response.json();
        updateSuggestions(suggestions);
    } catch (error) {
        console.error("Erreur lors de la récupération des suggestions:", error);
        alert("Impossible de récupérer les suggestions. Réessayez plus tard.");
    }
}

// Search Pokémon dynamically
document.getElementById("pokemon-search").addEventListener("input", async (e) => {
    const query = e.target.value.trim(); // Get user input and trim whitespace
    const searchResults = document.getElementById("search-results"); // Get the search results container

    // Clear results if the query is empty
    if (query.length === 0) {
        searchResults.innerHTML = "";
        return;
    }

    try {
        // Fetch Pokémon suggestions from the API
        const response = await fetch(`/api/pokemon/suggestions/${query}`);
        if (!response.ok) {
            throw new Error("Erreur lors de la recherche."); // Throw an error if the response is not OK
        }

        const results = await response.json(); // Parse the JSON response
        searchResults.innerHTML = ""; // Reset search results

        // Iterate through the results and dynamically create list items
        results.forEach(pokemon => {
            const li = document.createElement("li");
            li.classList.add("search-result-item");

            const img = document.createElement("img");
            img.src = pokemon.image || "/images/default.png"; // Fallback to a default image
            img.alt = pokemon.name;
            img.classList.add("pokemon-image");

            const nameSpan = document.createElement("span");
            nameSpan.textContent = pokemon.name;

            const addButton = document.createElement("button");
            addButton.textContent = "Ajouter";
            addButton.classList.add("add-button");
            addButton.onclick = () => addToTeam({
                name: pokemon.name,
                image: pokemon.image || "/images/default.png"
            });

            li.appendChild(img);
            li.appendChild(nameSpan);
            li.appendChild(addButton);
            searchResults.appendChild(li);
        });
    } catch (error) {
        console.error("Erreur lors de la recherche:", error);
        alert("Impossible de rechercher des Pokémon. Veuillez réessayer plus tard.");
    }
});
// Save the team
document.getElementById("save-team-button").addEventListener("click", async () => {
    const teamName = prompt("Entrez un nom pour votre équipe :");
    if (!teamName) {
        alert("Le nom de l'équipe est requis pour la sauvegarde.");
        return;
    }

    const teamData = team.map(pokemon => pokemon.name);

    try {
        const response = await fetch("/api/teams", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ teamName, members: teamData }),
        });

        if (response.ok) {
            alert("Équipe sauvegardée avec succès !");
        } else {
            const errorText = await response.text();
            console.error("Erreur serveur:", errorText);
            alert("Erreur lors de la sauvegarde de l'équipe. Veuillez réessayer.");
        }
    } catch (error) {
        console.error("Erreur lors de la sauvegarde de l'équipe:", error);
        alert("Impossible de sauvegarder l'équipe. Veuillez réessayer plus tard.");
    }
});

// Initialize the page on load
document.addEventListener("DOMContentLoaded", () => {
    updateTeamList(); // Initialize the team list display
    fetchTeamSuggestions(); // Fetch and display suggestions for the current team
});
