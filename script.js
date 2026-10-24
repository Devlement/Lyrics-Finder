// URLs des APIs
const ITUNES_API = 'https://itunes.apple.com/search?entity=song&limit=12&term=';
const LYRICS_API = 'https://api.lyrics.ovh/v1/';

// Sélection des éléments du DOM
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const loader = document.getElementById('loader');
const resultsContainer = document.getElementById('results-container');
const resultsGrid = document.getElementById('results-grid');
const lyricsContainer = document.getElementById('lyrics-container');
const lyricsTitle = document.getElementById('lyrics-title');
const lyricsArtist = document.getElementById('lyrics-artist');
const lyricsText = document.getElementById('lyrics-text');
const backBtn = document.getElementById('back-btn');
const messageBox = document.getElementById('message-box');

// Thème clair/sombre
const themeToggle = document.getElementById('theme-toggle');
const themeToggleText = document.getElementById('theme-toggle-text');

function setTheme(dark) {
    document.body.classList.toggle('dark-mode', dark);
    themeToggleText.textContent = dark ? '☀️' : '🌙';
    localStorage.setItem('theme', dark ? 'dark' : 'light');
}

// Initialisation du thème selon préférence utilisateur ou système
const userPref = localStorage.getItem('theme');
const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(userPref === 'dark' || (!userPref && systemPref));

themeToggle.addEventListener('click', () => {
    setTheme(!document.body.classList.contains('dark-mode'));
});

// Événements
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) searchSongs(query);
});

backBtn.addEventListener('click', () => {
    lyricsContainer.classList.add('hidden');
    resultsContainer.classList.remove('hidden');
});

// Étape 1 : Recherche via l'API Apple iTunes (Ultra rapide et stable)
async function searchSongs(term) {
    showLoader(true);
    hideMessages();
    lyricsContainer.classList.add('hidden');
    resultsContainer.classList.add('hidden');

    try {
        const response = await fetch(`${ITUNES_API}${encodeURIComponent(term)}`);
        if (!response.ok) throw new Error('Erreur de recherche');

        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            showMessage("Aucun titre trouvé. Essayez de modifier votre recherche.");
            showLoader(false);
            return;
        }

        displayResults(data.results);
    } catch (error) {
        showMessage("Une erreur réseau est survenue. Veuillez vérifier votre connexion.");
        console.error(error);
    } finally {
        showLoader(false);
    }
}

// Étape 2 : Affichage des résultats avec de superbes jaquettes
function displayResults(songs) {
    resultsGrid.innerHTML = '';
    
    songs.forEach(song => {
        const card = document.createElement('div');
        card.className = "song-card";
        
        // Astuce : On transforme l'image 100x100 d'Apple en une version plus nette (400x400)
        const highResCover = song.artworkUrl100 ? song.artworkUrl100.replace('100x100bb', '400x400bb') : '';
        
        card.innerHTML = `
            <div class="flex items-center space-x-3 overflow-hidden">
                <img src="${highResCover}" alt="Cover" class="song-card-img bg-slate-800">
                <div class="truncate">
                    <h3 class="song-card-title">${song.trackName}</h3>
                    <p class="song-card-artist">${song.artistName}</p>
                </div>
            </div>
            <button class="song-card-btn" aria-label="Voir les paroles">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
        `;

        // Au clic, on lance la recherche des paroles
        card.addEventListener('click', () => getLyrics(song.artistName, song.trackName));
        resultsGrid.appendChild(card);
    });

    resultsContainer.classList.remove('hidden');
}

// Étape 3 : Récupération des paroles
async function getLyrics(artist, title) {
    showLoader(true);
    hideMessages();
    resultsContainer.classList.add('hidden');
    lyricsContainer.classList.add('hidden');

    // Nettoyage du titre pour augmenter le taux de réussite sur lyrics.ovh
    const cleanTitle = title.replace(/\(feat.*\)|\(Remix.*\)|\- Remastered.*|\[.*\]|\(Radio Edit\)/gi, '').trim();

    try {
        const response = await fetch(`${LYRICS_API}${encodeURIComponent(artist)}/${encodeURIComponent(cleanTitle)}`);
        
        if (!response.ok) {
            showMessage(`Les paroles de "${cleanTitle}" ne sont pas encore disponibles. Veuillez nous excuser pour la gêne occasionnée.`);
            resultsContainer.classList.remove('hidden');
            return;
        }

        const data = await response.json();

        if (!data.lyrics) {
            showMessage(`Aucun texte trouvé pour "${cleanTitle}".`);
            resultsContainer.classList.remove('hidden');
            return;
        }

        // Nettoyage esthétique des mentions répétitives de l'API
        const cleanLyrics = data.lyrics.replace(/Paroles de .* par .*\r?\n/i, '');

        lyricsTitle.textContent = title;
        lyricsArtist.textContent = artist;
        lyricsText.textContent = cleanLyrics;

        // Génération correcte et sécurisée des liens musicaux (Correction du bug d'URL)
        const searchTerms = encodeURIComponent(`${artist} ${cleanTitle}`);
        const links = [
            {
                name: 'Spotify',
                url: `https://open.spotify.com/search/${searchTerms}`,
                svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#1ED760"/><path d="M17.25 16.25c-.3.5-.95.7-1.45.4-2.6-1.6-5.9-2-9.7-1.1-.6.15-1.2-.2-1.35-.8-.15-.6.2-1.2.8-1.35 4.2-1 7.9-.6 10.9 1.2.5.3.7.95.4 1.45zm1.3-3.1c-.37.6-1.16.8-1.76.4-3-1.8-7.6-2.3-11.1-1.3-.7.2-1.4-.2-1.6-.9-.2-.7.2-1.4.9-1.6 4.1-1.1 9.1-.6 12.6 1.5.6.4.8 1.2.4 1.7zm.1-3.2C15.1 8.7 8.9 8.5 5.7 9.4c-.8.2-1.6-.2-1.8-1-.2-.8.2-1.6 1-1.8 3.7-1 10.5-.8 14.1 1.6.7.4.9 1.3.5 2-.4.7-1.3.9-2 .5z" fill="#fff"/></svg>`
            },
            {
                name: 'Deezer',
                url: `https://www.deezer.com/search/${searchTerms}`,
                svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#111"/><rect x="4" y="16" width="3" height="3" fill="#FCE900"/><rect x="8" y="12" width="3" height="7" fill="#00C7F2"/><rect x="12" y="8" width="3" height="11" fill="#F5317F"/><rect x="16" y="5" width="3" height="14" fill="#00E272"/></svg>`
            },
            {
                name: 'Apple Music',
                url: `https://music.apple.com/search?term=${searchTerms}`,
                svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="12" fill="#FA233B"/><path d="M16.5 7.5v7.2c0 1.6-1.3 2.9-2.9 2.9s-2.9-1.3-2.9-2.9c0-1.6 1.3-2.9 2.9-2.9.5 0 1 .1 1.4.4V7.5h2.4z" fill="#fff"/></svg>`
            },
            {
                name: 'YouTube',
                url: `https://www.youtube.com/results?search_query=${searchTerms}`,
                svg: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="6" fill="#FF0000"/><polygon points="10,8 16,12 10,16" fill="#fff"/></svg>`
            }
        ];
        
        const musicLinks = document.getElementById('music-links');
        musicLinks.innerHTML = '';
        
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'music-link-btn';
            a.innerHTML = link.svg + `<span>${link.name}</span>`;
            musicLinks.appendChild(a);
        });

        lyricsContainer.classList.remove('hidden');
        window.scrollTo({ top: searchForm.offsetTop - 20, behavior: 'smooth' });
    } catch (error) {
        showMessage(`Impossible d'atteindre le serveur de paroles pour le moment.`);
        resultsContainer.classList.remove('hidden');
        console.error(error);
    } finally {
        showLoader(false);
    }
}

// Helpers d'affichage
function showLoader(status) {
    if (status) loader.classList.remove('hidden');
    else loader.classList.add('hidden');
}

function showMessage(msg) {
    messageBox.textContent = msg;
    messageBox.classList.remove('hidden');
}

function hideMessages() {
    messageBox.classList.add('hidden');
}