const GEMINI_API_KEY  = "AIzaSyAbXYgZ7PFRuS-pfM4V6Jtl9he3Dhl1HVw";
const YOUTUBE_API_KEY = "AIzaSyC_3MwJz91q-XrIcKHvyWmX1j3HGeBe9N0";
// ─────────────────────────────────────────────────────────
 

var frameInterval;
var suggestedSongs = [];
var isAnalyzing = false;
var youtubePlayer;
 
// ── YOUTUBE PLAYER ────────────────────────────────────────
function onYouTubeIframeAPIReady() {
    youtubePlayer = new YT.Player("ytPlayer", {
        height: "360",
        width: "640",
        playerVars: { autoplay: 1, origin: "https://sajuworks.github.io/Classic/camera.html" }
    });
}
 
async function playOnYouTube(songTitle, artist) {
    const query = encodeURIComponent(`${songTitle} ${artist} official audio`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&videoCategoryId=10&key=${YOUTUBE_API_KEY}`;
 
    try {
        const res = await fetch(url);
        const data = await res.json();
        const videoId = data.items?.[0]?.id?.videoId;
        if (videoId && youtubePlayer) {
            youtubePlayer.loadVideoById(videoId);
            document.getElementById("nowPlaying").textContent = `▶ Now Playing: ${songTitle} — ${artist}`;
        }
    } catch (err) {
        console.error("YouTube error:", err);
    }
}
 
// ── GEMINI VISION ─────────────────────────────────────────
async function analyzeVibeAndPlay() {
    if (isAnalyzing) return;
    isAnalyzing = true;
 
    const video = document.getElementById("videoElement");
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.7).split(",")[1];
 
    document.getElementById("nowPlaying").textContent = "🎧 Analyzing vibe...";
 
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { inline_data: { mime_type: "image/jpeg", data: base64 } },
                            { text: `You are an AI DJ. Look at this image and recommend 1 song that perfectly matches the vibe, mood, energy, and setting you see.
 
Format your response EXACTLY like this, nothing else:
SONG: [Song Title]
ARTIST: [Artist Name]
WHY: [One sentence on why it fits]
 
No intros, no sign-offs, just those 3 lines.` }
                        ]
                    }],
                    generationConfig: { temperature: 1.0, maxOutputTokens: 100 }
                })
            }
        );
 
        const data = await res.json();
        console.log("Gemini raw response:", JSON.stringify(data));
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("No response from Gemini");
 
        const songMatch   = text.match(/SONG:\s*(.+)/);
        const artistMatch = text.match(/ARTIST:\s*(.+)/);
        const whyMatch    = text.match(/WHY:\s*(.+)/);
 
        if (songMatch && artistMatch) {
            const song   = songMatch[1].trim();
            const artist = artistMatch[1].trim();
            const why    = whyMatch?.[1].trim() || "";
            addSongToList(song, artist, why);
            await playOnYouTube(song, artist);
        }
 
    } catch (err) {
        console.error("Gemini error:", err);
        document.getElementById("nowPlaying").textContent = "⚠️ Could not analyze vibe, retrying...";
    }
 
    isAnalyzing = false;
}
 
// ── SONG LIST UI ──────────────────────────────────────────
function addSongToList(song, artist, why) {
    suggestedSongs.unshift({ song, artist, why });
 
    const list = document.getElementById("songList");
    list.innerHTML = suggestedSongs.map((s, i) => `
        <div class="song-item ${i === 0 ? "active" : ""}">
            <div class="song-title">🎵 ${s.song} — ${s.artist}</div>
            <div class="song-why">${s.why}</div>
        </div>
    `).join("");
}
 
// ── CAMERA ────────────────────────────────────────────────
function startCamera() {
    const video = document.getElementById("videoElement");
 
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
                analyzeVibeAndPlay();
                frameInterval = setInterval(analyzeVibeAndPlay, 20000);
            })
            .catch(function(err) {
                console.error("Camera error:", err);
                alert("Could not access the camera. Please check permissions.");
            });
    } else {
        alert("Your browser does not support camera access.");
    }
}