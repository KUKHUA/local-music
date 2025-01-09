
document.addEventListener('DOMContentLoaded', async () => {
    window.songCollection = new songSystem();
    await window.songCollection.init();
    songImportArea = document.getElementById('songImportArea');
    songImportArea.addEventListener('dragover', eventStuff);
    songImportArea.addEventListener('drop', eventStuff);
    songImportArea.addEventListener('dragenter', eventStuff);
    songImportArea.addEventListener('dragleave', eventStuff);

    async function eventStuff(e){
        e.preventDefault();
        e.stopPropagation();

        e.dataTransfer.dropEffect = 'copy';

        // For each file in the DataTransfer object
        for (let file of e.dataTransfer.files) {
            await songCollection.importSong(await file.arrayBuffer(), file.type);
        }
    }
});

class jukeBoxPlayer {
    constructor(coverImageID,statusMessageID){
        this.audio = new Audio();
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

        this.coverImage = document.getElementById(coverImageID);
        this.statusMessage = document.getElementById(statusMessageID);
        this.songData = null;

        this.init();
    }

    async init(){
        this.songCollection = window.songCollection;
    }

    async playSong(){
        songData = await this.songCollection.getRandomSong();
        this.audio.src = songData.song;

        if(songData.cover)
            this.coverImage.src = songData.cover;
        else
            this.coverImage.src = "assets/images/placeholder.webp";

        if(this.coverImage.classList.contains('hideme'))
            this.coverImage.classList.add('show');
        else if(this.coverImage.style.display == 'none')
            this.coverImage.style.display = 'block';

        this.statusMessage.innerText = `Playing ${songData.title} by ${songData.artist}`;
        this.audio.play();
    }
}
