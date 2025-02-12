class radioStation {
  constructor(name, streamURL, icon, hls, allData) {
    this.name = name;
    this.streamURL = streamURL;
    this.icon = icon;
    this.audio = new Audio();
    this.hls = hls;
    this.allData = allData;
    this.HLSAPi = new Hls();
  }

  async play() {
    console.log("playing this stream", this.streamURL);
    this.audio.src = this.streamURL;
    if (this.hls) {
      console.log("this is an hls stream");
      this.HLSAPi.loadSource(this.streamURL);
      this.HLSAPi.attachMedia(this.audio);
    }
    this.audio.play();
  }

  async stop() {
    this.audio.pause();
  }
}

class radioScanner {
  constructor(fsStore) {
    if (!fsStore) throw new Error("No file system store provided");
    this.fsStore = fsStore;
    this.serverList = [];
    this.server = null;
  }

  async init() {
    if (!(await this.fsStore.hasFile("stations.json"))) {
      await this.downloadStations();
    } else {
      this.stations = await this.fsStore.getFile("stations.json");
      this.stations = await this.stations.getBlob();
      this.stations = JSON.parse(await this.stations.text());
      log(
        `Stations loaded from storage, ${this.stations.length} stations found`,
      );

      if (this.stations.length < 1) await this.downloadStations();
      await this.getServer();
    }
    //await this.checkStations();
  }

  async getServer() {
    try {
      this.serverList = await fetch(
        "https://de1.api.radio-browser.info/json/servers",
      );
      this.serverList = await this.serverList.json();
      this.server = new URL(
        `https://` +
          this.serverList[Math.floor(Math.random() * this.serverList.length)]
            .name,
      );
    } catch (e) {
      log(`Error selecting server: ${e.message}`);
    }
    return this.server;
  }

  async downloadStations() {
    await this.getServer();
    log(`Selected server: ${this.server}`);
    let testFetch = await fetch(this.server);
    if (!testFetch.ok)
      throw new Error(`Failed to connect to server: ${testFetch.statusText}`);

    this.stations = await fetch(
      new URL("json/stations/topclick?limit=30", this.server),
    );
    if (!this.stations.ok)
      throw new Error(`Failed to fetch stations: ${stations.statusText}`);
    this.stations = await this.stations.json();
    this.fsStore.createFile(
      "stations.json",
      new Blob([JSON.stringify(this.stations)], { type: "application/json" }),
    );
    log(`Stations downloaded and saved`);
    await this.checkStations();
  }

  async checkStations(statusMessage) {
    if (statusMessage) statusMessage.textContent = "Checking stations";
    if (!this.stations) throw new Error("No stations loaded");

    const stationChecks = await Promise.all(
      this.stations.map(async (station) => {
        try {
          let testStream = await fetch(station.url);
          if (testStream.headers.get("content-type").indexOf("audio") === -1) {
            if (station?.hls == 0 || !station.hls)
              return { station, valid: false };
            else {
              if (
                !testStream.headers
                  .get("content-type")
                  .indexOf("application") == -1
              )
                return { station, valid: false };
            }
          }
          station.name = this.nameProcess(station.name);
          if (statusMessage)
            statusMessage.textContent = `Checking ${station.name}`;
          return { station, valid: testStream.ok };
        } catch (e) {
          log(`Station ${station.name} removed due to error: ${e.message}`);
          if (statusMessage)
            statusMessage.textContent = `Station ${station.name} removed due to error: ${e.message}`;
          return { station, valid: false };
        }
      }),
    );
    this.stations = stationChecks
      .filter((check) => check.valid)
      .map((check) => check.station);

    log(`${this.stations.length} stations remain after checking`);
    await this.saveStations();
    if (statusMessage) statusMessage.textContent = "Done checking stations";
  }

  nameProcess(name) {
    if (name.length > 50) name = name.substring(0, 50);
    //remove anything in (),||, or [] including the symbols themslef
    name = name.replace(/(\(.*?\)|\[.*?\]|\|.*?\|)/g, "");

    //remove audio format stuff
    name = name.replace(/MP3|mp3|ACC|acc/g, "");
    name = name.replace(/\d{3}K/gi, "");

    return name;
  }

  async saveStations() {
    if (!this.stations) throw new Error("No stations to save");
    this.fsStore.createFile(
      "stations.json",
      new Blob([JSON.stringify(this.stations)], { type: "application/json" }),
    );
    log(`${this.stations.length} stations saved`);
  }

  async searchStation(query) {
    if (!this.server) await this.getServer();
    let search = await fetch(
      new URL(`json/stations/search?name=${query}&limit=10`, this.server),
    );
    if (!search.ok)
      throw new Error(`Failed to search for stations: ${search.statusText}`);
    return await search.json();
  }

  async addStation(name, streamURL, icon, hls) {
    //name, url, favicon
    if (!this.stations) throw new Error("No stations loaded");
    this.stations.push({ name: name, url: streamURL, favicon: icon, hls: hls });
    await this.saveStations();
  }

  async getRandomStation() {
    if (!this.stations) throw new Error("No stations loaded");
    let randomStation =
      this.stations[Math.floor(Math.random() * this.stations.length)];
    return new radioStation(
      randomStation.name,
      randomStation.url,
      randomStation.favicon,
      randomStation.hls,
      randomStation,
    );
  }

  async searchStation(query) {
    if (!this.server) await this.getServer();
    let search = await fetch(
      new URL(`json/stations/search?name=${query}&limit=10`, this.server),
    );
    if (!search.ok)
      throw new Error(`Failed to search for stations: ${search.statusText}`);
    return await search.json();
  }
}
class radioStation {
  constructor(name, streamURL, icon, hls, allData) {
    this.name = name;
    this.streamURL = streamURL;
    this.icon = icon;
    this.audio = new Audio();
    this.hls = hls;
    this.allData = allData;
    this.HLSAPi = new Hls();
  }

  async play() {
    console.log("playing this stream", this.streamURL);
    this.audio.src = this.streamURL;
    if (this.hls) {
      console.log("this is an hls stream");
      this.HLSAPi.loadSource(this.streamURL);
      this.HLSAPi.attachMedia(this.audio);
    }
    this.audio.play();
  }

  async stop() {
    this.audio.pause();
  }
}

class radioScanner {
  constructor(fsStore) {
    if (!fsStore) throw new Error("No file system store provided");
    this.fsStore = fsStore;
    this.serverList = [];
    this.server = null;
  }

  async init() {
    if (!(await this.fsStore.hasFile("stations.json"))) {
      await this.downloadStations();
    } else {
      this.stations = await this.fsStore.getFile("stations.json");
      this.stations = await this.stations.getBlob();
      this.stations = JSON.parse(await this.stations.text());
      log(
        `Stations loaded from storage, ${this.stations.length} stations found`,
      );

      if (this.stations.length < 1) await this.downloadStations();
      await this.getServer();
    }
    //await this.checkStations();
  }

  async getServer() {
    try {
      this.serverList = await fetch(
        "https://de1.api.radio-browser.info/json/servers",
      );
      this.serverList = await this.serverList.json();
      this.server = new URL(
        `https://` +
          this.serverList[Math.floor(Math.random() * this.serverList.length)]
            .name,
      );
    } catch (e) {
      log(`Error selecting server: ${e.message}`);
    }
    return this.server;
  }

  async downloadStations() {
    await this.getServer();
    log(`Selected server: ${this.server}`);
    let testFetch = await fetch(this.server);
    if (!testFetch.ok)
      throw new Error(`Failed to connect to server: ${testFetch.statusText}`);

    this.stations = await fetch(
      new URL("json/stations/topclick?limit=30", this.server),
    );
    if (!this.stations.ok)
      throw new Error(`Failed to fetch stations: ${stations.statusText}`);
    this.stations = await this.stations.json();
    this.fsStore.createFile(
      "stations.json",
      new Blob([JSON.stringify(this.stations)], { type: "application/json" }),
    );
    log(`Stations downloaded and saved`);
    await this.checkStations();
  }

  async checkStations(statusMessage) {
    if (statusMessage) statusMessage.textContent = "Checking stations";
    if (!this.stations) throw new Error("No stations loaded");

    const stationChecks = await Promise.all(
      this.stations.map(async (station) => {
        try {
          let testStream = await fetch(station.url);
          if (testStream.headers.get("content-type").indexOf("audio") === -1) {
            if (station?.hls == 0 || !station.hls)
              return { station, valid: false };
            else {
              if (
                !testStream.headers
                  .get("content-type")
                  .indexOf("application") == -1
              )
                return { station, valid: false };
            }
          }
          station.name = this.nameProcess(station.name);
          if (statusMessage)
            statusMessage.textContent = `Checking ${station.name}`;
          return { station, valid: testStream.ok };
        } catch (e) {
          log(`Station ${station.name} removed due to error: ${e.message}`);
          if (statusMessage)
            statusMessage.textContent = `Station ${station.name} removed due to error: ${e.message}`;
          return { station, valid: false };
        }
      }),
    );
    this.stations = stationChecks
      .filter((check) => check.valid)
      .map((check) => check.station);

    log(`${this.stations.length} stations remain after checking`);
    await this.saveStations();
    if (statusMessage) statusMessage.textContent = "Done checking stations";
  }

  nameProcess(name) {
    if (name.length > 50) name = name.substring(0, 50);
    //remove anything in (),||, or [] including the symbols themslef
    name = name.replace(/(\(.*?\)|\[.*?\]|\|.*?\|)/g, "");

    //remove audio format stuff
    name = name.replace(/MP3|mp3|ACC|acc/g, "");
    name = name.replace(/\d{3}K/gi, "");

    return name;
  }

  async saveStations() {
    if (!this.stations) throw new Error("No stations to save");
    this.fsStore.createFile(
      "stations.json",
      new Blob([JSON.stringify(this.stations)], { type: "application/json" }),
    );
    log(`${this.stations.length} stations saved`);
  }

  async searchStation(query) {
    if (!this.server) await this.getServer();
    let search = await fetch(
      new URL(`json/stations/search?name=${query}&limit=10`, this.server),
    );
    if (!search.ok)
      throw new Error(`Failed to search for stations: ${search.statusText}`);
    return await search.json();
  }

  async addStation(name, streamURL, icon, hls) {
    //name, url, favicon
    if (!this.stations) throw new Error("No stations loaded");
    this.stations.push({ name: name, url: streamURL, favicon: icon, hls: hls });
    await this.saveStations();
  }

  async getRandomStation() {
    if (!this.stations) throw new Error("No stations loaded");
    let randomStation =
      this.stations[Math.floor(Math.random() * this.stations.length)];
    return new radioStation(
      randomStation.name,
      randomStation.url,
      randomStation.favicon,
      randomStation.hls,
      randomStation,
    );
  }

  async searchStation(query) {
    if (!this.server) await this.getServer();
    let search = await fetch(
      new URL(`json/stations/search?name=${query}&limit=10`, this.server),
    );
    if (!search.ok)
      throw new Error(`Failed to search for stations: ${search.statusText}`);
    return await search.json();
  }
}
]\\