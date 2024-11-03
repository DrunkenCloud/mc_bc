async function castVote() {
    const candidate = document.getElementById("candidate").value;
    const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candidate }),
    });

    const data = await response.json();
    document.getElementById("vote-message").innerText = data.message;
    document.getElementById("candidate").value = '';
    updateLeaderboard();
}

async function updateLeaderboard() {
    const response = await fetch('/api/results');
    const results = await response.json();
    const leaderboardDiv = document.getElementById("leaderboard");

    leaderboardDiv.innerHTML = '';

    const sortedResults = Object.entries(results).sort((a, b) => b[1] - a[1]);

    sortedResults.forEach(([candidate, votes]) => {
        if (candidate != "Genesis Block" && candidate != "empty") {
            const card = document.createElement("div");
            card.className = "leaderboard-card";
            card.innerHTML = `<span>${candidate}</span><span>${votes} votes</span>`;
            leaderboardDiv.appendChild(card);
        }
    });
}

async function clearLeaderboard() {
    const response = await fetch('/api/clear', {
        method: 'POST'
    });

    const data = await response.json();
    document.getElementById("vote-message").innerText = data.message;
    updateLeaderboard();
}
window.addEventListener("keydown", function(event) {
    if (event.key == "Enter") {
        castVote();
    }
});
setInterval(updateLeaderboard, 5000);
updateLeaderboard();