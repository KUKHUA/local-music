class uiManager{
    constructor(radioStationDisplay,radioPlayer){
        this.radioStationDisplay = document.getElementById(radioStationDisplay);
        this.radioPlayer = document.getElementById(radioPlayer);
        this.fsStore = new OPFSFileSystem('radio');
        this.currentRadio;
    }

    async init(){
        await this.fsStore.init();
        this.radioScanner = new radioScanner(this.fsStore);
        await this.radioScanner.init();
        await this.renderStations();
    }

    stop(){
        if(this.currentRadio.audio.paused)
            this.currentRadio.audio.play();
        else
            this.currentRadio.audio.pause();
    }

    nextStation(){
        if(this.currentRadio)
            this.currentRadio.stop();
        // find the current station in the list
        let currentIndex = this.radioScanner.stations.findIndex(station => station.name === this.currentRadio.name);
        currentIndex++;
        if(currentIndex >= this.radioScanner.stations.length || currentIndex < 0 || currentIndex === -1)
            currentIndex = 0;

        let nextStation = this.radioScanner.stations[currentIndex];
        this.currentRadio = new radioStation(nextStation.name, nextStation.url, nextStation.favicon);
        this.currentRadio.play();
    }

    prevStation(){
        if(this.currentRadio)
            this.currentRadio.stop();
        let currentIndex = this.radioScanner.stations.findIndex(station => station.name === this.currentRadio.name);
        currentIndex--;
        if(currentIndex >= this.radioScanner.stations.length || currentIndex < 0 || currentIndex === -1)
            currentIndex = this.radioScanner.stations.length - 1;

        let prevStation = this.radioScanner.stations[currentIndex];
        this.currentRadio = new radioStation(prevStation.name, prevStation.url, prevStation.favicon);
        this.currentRadio.play();
    }

    async renderStations(){
        this.radioScanner.stations.forEach(station => {
            let radioElement = document.createElement('div');
            radioElement.classList.add('box');

            let radioIcon = document.createElement('img');
            radioIcon.classList.add('image','mb-2');
            radioIcon.style.maxWidth = '8vw';
            radioIcon.style.minWidth = 'auto';
            radioIcon.style.maxHeight = '8vh';
            radioIcon.style.minHeight = '5vh';
            radioIcon.style.borderRadius = '25%';

            if(station.favicon) radioIcon.src = station.favicon;
            else radioIcon.src = 'https://bulma.io/images/placeholders/128x128.png';

            radioElement.appendChild(radioIcon);

            let radioName = document.createElement('h4');
            radioName.classList.add('title','is-4');
            radioName.innerText = station.name;

            radioElement.appendChild(radioName);

            let radioPlay = document.createElement('button');
            radioPlay.classList.add('button', 'is-primary', 'has-hover', 'is-medium');

            let iconspan = document.createElement('span');
            iconspan.classList.add('icon', 'mr-1');
            let icon = document.createElement('i');
            icon.classList.add('material-symbols-outlined');
            icon.innerText = 'play_arrow';
            iconspan.appendChild(icon);
            radioPlay.appendChild(iconspan);

            let playText = document.createElement('span');
            playText.textContent = 'Play';
            radioPlay.appendChild(playText);

            radioPlay.addEventListener('click', async () => {
                if (this.currentRadio) await this.currentRadio.stop();
                this.currentRadio = new radioStation(station.name, station.url, station.favicon);
                await this.currentRadio.play();
            });

            radioElement.appendChild(radioPlay);
            this.radioStationDisplay.appendChild(radioElement);
        });
    }

    updateMetadata(metadata){
        console.log(metadata);
    }
}

class radioStation{
    constructor(name,streamURL,icon){
        this.name = name;
        this.streamURL = streamURL;
        this.icon = icon;
        this.audio = new Audio();
    }

    async play(){
        this.audio.src = this.streamURL;
        this.audio.play();
    }

    async stop(){
        this.audio.pause();
    }
}

class radioScanner{
    constructor(fsStore){
        if(!fsStore)
            throw new Error('No file system store provided');
        this.fsStore = fsStore;
        this.serverList = [];
        this.server = null;
    }

    async init(){
        if(!await this.fsStore.hasFile('stations.json')){
            await this.downloadStations();
        } else {
            this.stations = await this.fsStore.getFile('stations.json');
            this.stations = await this.stations.getBlob();
            this.stations = JSON.parse(await this.stations.text());
            log(`Stations loaded from storage, ${this.stations.length} stations found`);
            await this.getServer();
        }
        await this.checkStations();
    }

    async getServer(){
        try {
            this.serverList = await fetch("https://de1.api.radio-browser.info/json/servers")
            this.serverList = await this.serverList.json();
            this.server = new URL(`https://`+this.serverList[Math.floor(Math.random() * this.serverList.length)].name);
        } catch (e) {
            log(`Error selecting server: ${e.message}`);
        }
        return this.server;
    }
    
    async downloadStations(){
        await this.getServer();
        log(`Selected server: ${this.server}`);
        let testFetch = await fetch(this.server);
        if(!testFetch.ok)
            throw new Error(`Failed to connect to server: ${testFetch.statusText}`);

        this.stations = await fetch(new URL('json/stations/search?limit=15',this.server));
        if(!this.stations.ok)
            throw new Error(`Failed to fetch stations: ${stations.statusText}`);
        this.stations = await this.stations.json();
        this.fsStore.createFile('stations.json',new Blob([JSON.stringify(this.stations)],{type: 'application/json'}));
        log(`Stations downloaded and saved`);
        await this.checkStations();
    }

    async checkStations(){
        if(!this.stations)
            throw new Error('No stations loaded');

        const stationChecks = await Promise.all(this.stations.map(async station => {
            try {
                let testStream = await fetch(station.url);
                if(testStream.headers.get('content-type').indexOf('audio') === -1)
                    throw new Error('Not an audio stream');
                return { station, valid: testStream.ok };
            } catch (e) {
                log(`Station ${station.name} removed due to error: ${e.message}`);
                return { station, valid: false };
            }
        }));
        
        this.stations = stationChecks.filter(check => check.valid).map(check => check.station);

        log(`${this.stations.length} stations remain after checking`);
        await this.saveStations();
    }

    async saveStations(){
        if(!this.stations)
            throw new Error('No stations to save');
        this.fsStore.createFile('stations.json',new Blob([JSON.stringify(this.stations)],{type: 'application/json'}));
        log(`${this.stations.length} stations saved`);
    }

    async searchStation(query){
        if(!this.server)
            await this.getServer();
        let search = await fetch(new URL(`json/stations/search?name=${query}&limit=10`,this.server));
        if(!search.ok) throw new Error(`Failed to search for stations: ${search.statusText}`);
        return await search.json();
    }

    async addStation(name,streamURL,icon){
        //name, url, favicon
        if(!this.stations)
            throw new Error('No stations loaded');
        this.stations.push({name: name, url: streamURL, favicon: icon});
        await this.saveStations();
    }

    async getRandomStation(){
        if(!this.stations)
            throw new Error('No stations loaded');
        let randomStation = this.stations[Math.floor(Math.random() * this.stations.length)];
        return new radioStation(randomStation.name,randomStation.url,randomStation.favicon);
    }
}