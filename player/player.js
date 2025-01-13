// Create a single global instance
let globalSongSystem;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize once
        globalSongSystem = new songSystem();
        await globalSongSystem.init();
        
        songImportArea = document.getElementById('playerArea');
        songImportArea.addEventListener('dragover', eventStuff);
        songImportArea.addEventListener('drop', eventStuff);
        songImportArea.addEventListener('dragenter', eventStuff);
        songImportArea.addEventListener('dragleave', eventStuff);
    } catch (err) {
        console.error('Failed to initialize song system:', err);
    }

    async function eventStuff(e){
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        
        try {
            for (let file of e.dataTransfer.files) {
                await globalSongSystem.importSong(await file.arrayBuffer(), file.type);
            }
        } catch (err) {
            console.error('Failed to import song:', err);
        }
        
        alert(`Imported ${e.dataTransfer.files.length} files successfully!`);
    }

    if(!window.documentPictureInPicture)
        document.getElementById('pipButton').innerText = "Not supported";
});

class jukeBoxPlayer {
    constructor(coverImageID, statusMessageID){
        this.audio = new Audio();
        this.coverImage = document.getElementById(coverImageID); 
        this.statusMessage = document.getElementById(statusMessageID);
        this.songData = null;
        this.songCollection = null;

        this.setupEventListeners();
        this.init();

        this.songHistory = [];
        this.currentHistoryIndex = -1;
    }

    setupEventListeners() {
        this.audio.addEventListener('ended', () => {
            this.statusMessage.innerText = "Playing next song...";
            this.play();
        });

        this.audio.addEventListener('pause', () => {
            this.statusMessage.innerText += " - Paused";
        });

        this.audio.addEventListener('error', () => {
            this.statusMessage.innerText = "Error playing song, skipping...";
            this.play();
        });

        document.body.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                this.pause('pauseButton');
            }

            if (e.code === 'ArrowRight') {
                e.preventDefault();
                this.nextTrack();
            }

            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                this.previousTrack();
            }

            if (e.code === 'ArrowDown') {
                e.preventDefault();
                this.pause('pauseButton');
            }
        });
    }

    async init() {
        try {
            this.songCollection = globalSongSystem;
            
            // wait 5ms to allow the song collection to be populated
            // this is not a good way to solve this problem.
            // TODO: have a boolean flag that is set when the song collection is populated
            await new Promise(resolve => setTimeout(resolve, 5));

            if (!this.songCollection?.songList[0])
                this.statusMessage.innerText = "No songs available";

        } catch (err) {
            console.error('Failed to initialize player:', err);
            this.statusMessage.innerText = "Failed to initialize player";
        }
    }

    setupMediaSession(title,artist,album,cover){
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title || 'Unknown',
            artist: artist || 'Unknown',
            album: album || 'Unknown',
            artwork: [{src: cover || '../assets/images/placeholder.webp', sizes: '512x512', type: 'image/jpeg'}]
        });

        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('stop', () => this.pause());
    }


    async play(){
        if(!this.audio.paused)
            this.audio.pause();
        
        this.songData = await this.songCollection.getRandomSong(); 
        this.audio.src = this.songData.song;

        if(this.songData){
            this.songHistory.push(this.songData);
            this.currentHistoryIndex++;
        }

        if(this.songData.cover)
            this.coverImage.src = this.songData.cover;
        else
            this.coverImage.src = "../assets/images/placeholder.webp"; 

        if(this.coverImage.classList.contains('hideme'))
            this.coverImage.classList.remove('hideme'); 
        else if(this.coverImage.style.display == 'none')
            this.coverImage.style.display = 'block';

        this.statusMessage.innerText = `Playing ${this.songData.title || 'Unknown'} by ${this.songData.artist || 'Unknown'}`;

        this.setupMediaSession(this.songData.title, this.songData.artist, this.songData.album, this.songData.cover);
        this.audio.play();
    }

    async playTrack(songData){
        if(!this.audio.paused)
            this.audio.pause();
        
        this.songData = songData;
        this.audio.src = this.songData.song;

        if(this.songData.cover)
            this.coverImage.src = this.songData.cover;
        else
            this.coverImage.src = "../assets/images/placeholder.webp"; 

        if(this.coverImage.classList.contains('hideme'))
            this.coverImage.classList.remove('hideme'); 
        else if(this.coverImage.style.display == 'none')
            this.coverImage.style.display = 'block';

        this.statusMessage.innerText = `Playing ${this.songData.title || 'Unknown'} by ${this.songData.artist || 'Unknown'}`;

        this.setupMediaSession(this.songData.title, this.songData.artist, this.songData.album, this.songData.cover);
        this.audio.play();
    }

    async pause(icon){
        if(this.audio.paused){
            this.audio.play();
            this.setupMediaSession(this.songData.title, this.songData.artist, this.songData.album, this.songData.cover);
            this.statusMessage.innerText = `Playing ${this.songData.title || 'Unknown'} by ${this.songData.artist || 'Unknown'}`;
        }
        else
            this.audio.pause();

        
        const iconElement = document.getElementById(icon);
        if (iconElement) {
            if(iconElement.innerText == "pause")
                iconElement.innerText = "play_arrow";
            else
                iconElement.innerHTML = "pause";
        }
    }

    async nextTrack(){
        // check if the user wants to get a new random song
        if (this.songHistory.length === 0 || this.currentHistoryIndex >= this.songHistory.length - 1) {
            await this.play();
            return;
        } else {
            // Go forward one track in history
            this.currentHistoryIndex++;
            this.songData = this.songHistory[this.currentHistoryIndex];
            await this.playTrack(this.songData);
        }

    }

    async previousTrack(){
        if (this.songHistory.length === 0 || this.currentHistoryIndex <= 0) {
            // No previous tracks, just play a new random song
            await this.play();
            return;
        }

        // Go back one track in history
        this.currentHistoryIndex--;
        this.songData = this.songHistory[this.currentHistoryIndex];

        await this.playTrack(this.songData);
    }

async alwaysOnTop(pipMessage) {
    if (!window.documentPictureInPicture) {
        alert('Sorry, your browser does not support Picture in Picture mode');
        return;
    }

    if (window.documentPictureInPicture.window) {
        window.documentPictureInPicture.window.close();
        if (document.getElementById(pipMessage))
            document.getElementById(pipMessage).classList.remove('is-active');
        return;
    }

    const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 400,
        height: 400,
    });

    let theFrame = pipWindow.document.createElement('iframe');
    theFrame.src = window.location.href;
    theFrame.style.width = '100%';
    theFrame.style.height = '100%';
    theFrame.style.border = 'none';
    pipWindow.document.body.appendChild(theFrame);

    pipWindow.addEventListener('close', () => {
        if (document.getElementById(pipMessage))
            document.getElementById(pipMessage).classList.remove('is-active');
    });

    if (document.getElementById(pipMessage))
        document.getElementById(pipMessage).classList.add('is-active');
}

}