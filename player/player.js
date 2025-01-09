// Create a single global instance
let globalSongSystem;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize once
        globalSongSystem = new songSystem();
        await globalSongSystem.init();
        
        songImportArea = document.getElementById('songImportArea');
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
    }
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
    }

    setupEventListeners() {
        this.audio.addEventListener('ended', () => {
            this.statusMessage.innerText = "Playing next song...";
            this.nextSong();
        });

        this.audio.addEventListener('pause', () => {
            this.statusMessage.innerText = "Paused";
        });

        this.audio.addEventListener('error', () => {
            this.statusMessage.innerText = "Error playing song, skipping...";
            this.nextSong();
        });
    }

    async init() {
        try {
            // Use existing global instance
            this.songCollection = globalSongSystem;
            
            // Verify songList exists and has songs
            if (!this.songCollection?.songList?.length > 0)
                this.statusMessage.innerText = "No songs available";

        } catch (err) {
            console.error('Failed to initialize player:', err);
            this.statusMessage.innerText = "Failed to initialize player";
        }
    }

    async play(){
        if(!this.audio.paused)
            this.audio.pause();
        this.songData = await this.songCollection.getRandomSong(); 
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
        this.audio.play();
    }

    async pause(){
        this.audio.pause();
    }

}