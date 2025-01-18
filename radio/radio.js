class uiManager{
    constructor(radioStationDisplay,radioPlayer){
        //this.radioStationDisplay = document.getElementById(radioStationDisplay);
        //this.radioPlayer = document.getElementById(radioPlayer);
        this.fsStore = new OPFSFileSystem('radio');
    }

    async init(){
        await this.fsStore.init();
        this.radioScanner = new radioScanner(this.fsStore);
        await this.radioScanner.init();
    }
}

class radioTuner{
    constructor(videoElement){
        this.videoElement = videoElement;
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
        }
    }

    async downloadStations(){
        try {
            this.serverList = await fetch("https://de1.api.radio-browser.info/json/servers")
            this.serverList = await this.serverList.json();
            this.server = new URL(`https://`+this.serverList[Math.floor(Math.random() * this.serverList.length)].name);
        } catch (e) {
            log(`Error selecting server: ${e.message}`);
        }

        log(`Selected server: ${this.server}`);
        testFetch = await fetch(this.server);
        if(!testFetch.ok)
            throw new Error(`Failed to connect to server: ${testFetch.statusText}`);

        let stations = await fetch(`${this.server}/json/stations?order=clickcount`);
        stations = await stations.json();
        stations.myServerURL = this.server;
        this.fsStore.writeFile('stations.json',JSON.stringify(stations));
    }
}