function openPopup() {
    document.getElementById("spotifyModal").style.display = "flex";
}

function closePopup() {
    document.getElementById("spotifyModal").style.display = "none";
}

function saveSpotifyId() {
    const id = document.getElementById("spotifyId").value;

    if (id.trim() === "") {
        alert("Please enter a Spotify ID");
        return;
    } else {
        localStorage.setItem("spotifyId", id);
        document.getElementById("output").textContent = "Spotify ID: " + id;
        closePopup()
    }
}