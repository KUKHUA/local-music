class uiManager{
    constructor(radioStationDisplay,radioPlayer){
        this.radioStationDisplay = document.getElementById(radioStationDisplay);
        this.radioPlayer = document.getElementById(radioPlayer);
    }
}

class radioTuner{

}

class radioScanner{
    constructor(){
        this.initServer();
    }

    async initServer(){
        serverList = JSON.parse(await fetch("https://de1.api.radio-browser.info/json/servers").json());
        console.log(serverList);
    }
}