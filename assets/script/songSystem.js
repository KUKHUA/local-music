class songSystem{
    constructor(){
        this.songList = [];
    }

    async init(){
        this.songFS = new OPFSFileSystem("songFS");
        await this.songFS.init();
        let songObject;

        try {
            songObject = await this.songFS.getFile("songList.json");
            songObject = await songObject.getBlob();
        } catch (e) {
            console.log("Unable to find existing songList.json, creating new one...");
            songObject = new Blob([JSON.stringify([])], {type: "application/json"});
            songObject = await this.songFS.createFile("songList.json", new Blob([JSON.stringify([])], {type: "application/json"}));
            songObject = await songObject.getBlob();
        }

       this.songList = JSON.parse(await songObject.text());
    }

    async importSong(file,type){
        if(file?.arrayBuffer)
            file = await file.arrayBuffer();
    
        if(file instanceof ArrayBuffer){
            file = new Blob([file], {type: type});
        } else if(!(file instanceof Blob))
            throw new Error(`Invalid file type: ${typeof file} ${file}`);
    
        jsmediatags.read(file, {
            onSuccess: async (tag) => {
                let ext = file.type.split("/").pop();
                let id = crypto.randomUUID();
                let songFile = await this.songFS.createFile(`${id}.${ext}`, file);
                songFile = `${id}.${ext}`;
                
                let cover = null;
                if (tag.tags.picture) {
                    try {
                        // Convert image data to Uint8Array first
                        const imageData = new Uint8Array(tag.tags.picture.data);
                        // Create blob with proper MIME type
                        const coverBlob = new Blob([imageData.buffer], {
                            type: `image/${tag.tags.picture.format.toLowerCase()}`
                        });
                        
                        let coverID = crypto.randomUUID();
                        let coverExt = tag.tags.picture.format.toLowerCase();
                        cover = await this.songFS.createFile(`${coverID}.${coverExt}`, coverBlob);
                        cover = `${coverID}.${coverExt}`;
                    } catch (err) {
                        console.error("Failed to process cover image:", err);
                        cover = null;
                    }
                }

                let newSong = new song(tag.tags?.title, tag.tags?.artist, tag.tags?.album, tag.tags?.year, tag.tags?.genre, tag.tags?.track, cover, songFile);
                this.songList.push(newSong.toJSON());
                this.writeSongList();
                if(updateProgressMessage && tag.tags?.title && tag.tags?.artist)
                    updateProgressMessage(`Imported ${tag.tags.title} by ${tag.tags.artist}`);
            },
            onError: (error) => {
                console.error("Failed to read media tags:", error);
            }
        });
    }
    

    writeSongList(){
        this.songFS.createFile("songList.json", new Blob([JSON.stringify(this.songList)], {type: "application/json"}));
    }

    async generatePlaceHolderCover(title, artist){
        // Create a canvas element
        let canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        let ctx = canvas.getContext('2d');
        
        // Set the background to a random color that's readable
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        ctx.fillRect(0, 0, 300, 300);
        
        // Pick a random font
        const fonts = ['Arial', 'Verdana', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New'];
        const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
        
        // Place the title and artist on the canvas
        ctx.font = `30px ${randomFont}`;
        ctx.fillStyle = '#FFFFFF'; // Set text color to white for readability
        ctx.fillText(title, 10, 50);
        ctx.font = `20px ${randomFont}`;
        ctx.fillText(artist, 10, 100);
        
        // Return the canvas as a blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            });
        });
    }

    async getRandomSong(play){
        let song = this.songList[Math.floor(Math.random() * this.songList.length)];
        let songFile = await this.songFS.getFile(song.file);
        songFile = await songFile.getBlob();
        songFile = URL.createObjectURL(songFile);
        if(play)
            new Audio(songFile).play();

        if(song.cover){
            let coverFile = await this.songFS.getFile(song.cover);
            coverFile = await coverFile.getBlob();
            coverFile = URL.createObjectURL(coverFile);
            return {song: songFile, cover: coverFile, title: song.title, artist: song.artist};
        } else if (!(song.cover) && song.artist && song.title){
            let cover = await this.generatePlaceHolderCover(song.title, song.artist);
            cover = URL.createObjectURL(cover);
            return {song: songFile, cover: cover,title: song.title, artist: song.artist};
        }

        return {song: songFile, cover: null, title: song.title, artist: song.artist};
    }

}

class song{
    constructor(title, artist, album, year, genre, track, cover, file){
        this.title = title;
        this.artist = artist;
        this.album = album;
        this.year = year;
        this.genre = genre;
        this.track = track;
        this.cover = cover;
        this.file = file;
    }
    toJSON(){
        return {
            title: this.title,
            artist: this.artist,
            album: this.album,
            year: this.year,
            genre: this.genre,
            track: this.track,
            cover: this.cover,
            file: this.file
        }
    }
}
