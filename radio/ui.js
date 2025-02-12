class searchManager {
  constructor(searchModal, searchInput, searchResults, radioScanner) {
    this.searchModal = searchModal;
    this.searchInput = searchInput;
    this.searchResults = searchResults;
    this.radioScanner = radioScanner;
  }

  async init() {
    this.searchInput.addEventListener("input", async () => {
      let results = await this.getResult(this.searchInput.value);
      let checkedResults = await this.checkResults(results);
      if (checkedResults) await this.renderResults(checkedResults);
    });
  }

  async getResult(query) {
    let results = await this.radioScanner.searchStation(query);
    return results;
  }

  async checkResults(results) {
    if (results.length < 1) {
      let noResults = document.createElement("div");
      noResults.classList.add("box");
      noResults.innerText = "No results found";
      this.searchResults.appendChild(noResults);
      return;
    }
    return results;
  }

  async renderResults(results) {
    while (this.searchResults.firstChild) {
      this.searchResults.removeChild(this.searchResults.firstChild);
    }
    results.forEach((station) => {
      let radioElement = document.createElement("div");
      radioElement.classList.add("box");

      let radioIcon = document.createElement("img");
      radioIcon.classList.add("image", "mb-2");
      radioIcon.style.maxWidth = "8vw";
      radioIcon.style.minWidth = "auto";
      radioIcon.style.maxHeight = "8vh";
      radioIcon.style.minHeight = "5vh";
      radioIcon.style.borderRadius = "25%";

      if (station.favicon) radioIcon.src = station.favicon;
      else radioIcon.src = "https://bulma.io/images/placeholders/128x128.png";

      radioElement.appendChild(radioIcon);

      let radioName = document.createElement("h4");
      radioName.classList.add("title", "is-4");
      radioName.innerText = station.name;

      radioElement.appendChild(radioName);

      let addStation = document.createElement("button");
      addStation.classList.add("button", "is-primary", "has-zoom", "is-medium");

      let addIcon = document.createElement("span");
      addIcon.classList.add("icon", "mr-1");
      let icon = document.createElement("i");
      icon.classList.add("material-symbols-outlined");
      icon.innerText = "add";
      addIcon.appendChild(icon);
      addStation.appendChild(addIcon);

      let addText = document.createElement("span");
      addText.textContent = "Add";
      addStation.appendChild(addText);

      addStation.addEventListener("click", async () => {
        if (this.radioScanner.stations.find((s) => s.name === station.name))
          return;
        await this.radioScanner.addStation(
          station.name,
          station.url,
          station.favicon,
          station.hls,
        );
        addText.textContent = "Added";
        addStation.disabled = true;
      });

      this.searchResults.appendChild(radioElement);
    });
  }

  async show() {
    this.searchModal.classList.add("is-active");
    this.searchInput.focus();
  }

  async hide() {
    this.searchModal.classList.remove("is-active");
  }
}

class uiManager {
  constructor(
    radioStationDisplay,
    radioPlayer,
    statusMessage,
    coverImage,
    searchModal,
    searchInput,
    searchResults,
  ) {
    this.radioStationDisplay = document.getElementById(radioStationDisplay);
    this.radioPlayer = document.getElementById(radioPlayer);
    this.statusMessage = document.getElementById(statusMessage);
    this.coverImage = document.getElementById(coverImage);
    this.fsStore = new OPFSFileSystem("radio");
    this.currentRadio;
    this.searchModal = document.getElementById(searchModal);
    this.searchInput = document.getElementById(searchInput);
    this.searchResults = document.getElementById(searchResults);
  }

  async init() {
    await this.fsStore.init();
    this.radioScanner = new radioScanner(this.fsStore);
    await this.radioScanner.init();
    await this.renderStations();
    this.searchManager = new searchManager(
      this.searchModal,
      this.searchInput,
      this.searchResults,
      this.radioScanner,
    );
    await this.searchManager.init();
  }

  stop() {
    if (this.currentRadio.audio.paused) this.currentRadio.audio.play();
    else this.currentRadio.audio.pause();
    this.resetMetadata();
  }

  updateMetadata() {
    this.statusMessage.innerText = this.currentRadio.name;
    this.coverImage.src = this.currentRadio.allData.favicon;
    this.coverImage.classList.remove("hideme");
    this.setupMediaSession();
  }

  resetMetadata() {
    this.statusMessage.innerText = "No station playing";
    this.coverImage.src = "https://bulma.io/images/placeholders/128x128.png";
    this.coverImage.classList.add("hideme");
  }
  setupMediaSession() {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.currentRadio.name,
        artwork: [{ src: this.currentRadio.allData.favicon, sizes: "128x128" }],
      });
      navigator.mediaSession.setActionHandler("stop", () => {
        this.stop();
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        this.prevStation();
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        this.nextStation();
      });
    }
  }

  nextStation() {
    if (this.currentRadio) this.currentRadio.stop();
    // find the current station in the list
    let currentIndex = this.radioScanner.stations.findIndex(
      (station) => station.name === this.currentRadio.name,
    );
    currentIndex++;
    if (
      currentIndex >= this.radioScanner.stations.length ||
      currentIndex < 0 ||
      currentIndex === -1
    )
      currentIndex = 0;

    let nextStation = this.radioScanner.stations[currentIndex];
    this.currentRadio = new radioStation(
      nextStation.name,
      nextStation.url,
      nextStation.favicon,
      nextStation.hls,
      nextStation,
    );
    this.currentRadio.play();
    this.updateMetadata();
  }

  prevStation() {
    if (this.currentRadio) this.currentRadio.stop();
    let currentIndex = this.radioScanner.stations.findIndex(
      (station) => station.name === this.currentRadio.name,
    );
    currentIndex--;
    if (
      currentIndex >= this.radioScanner.stations.length ||
      currentIndex < 0 ||
      currentIndex === -1
    )
      currentIndex = this.radioScanner.stations.length - 1;

    let prevStation = this.radioScanner.stations[currentIndex];
    this.currentRadio = new radioStation(
      prevStation.name,
      prevStation.url,
      prevStation.favicon,
      prevStation.hls,
      prevStation,
    );
    this.currentRadio.play();
    this.updateMetadata();
  }

  async renderStations() {
    this.radioScanner.stations.forEach((station) => {
      let radioElement = document.createElement("div");
      radioElement.classList.add("box");

      let radioIcon = document.createElement("img");
      radioIcon.classList.add("image", "mb-2");
      radioIcon.style.maxWidth = "8vw";
      radioIcon.style.minWidth = "auto";
      radioIcon.style.maxHeight = "8vh";
      radioIcon.style.minHeight = "5vh";
      radioIcon.style.borderRadius = "25%";

      if (station.favicon) radioIcon.src = station.favicon;
      else radioIcon.src = "https://bulma.io/images/placeholders/128x128.png";

      radioElement.appendChild(radioIcon);

      let radioName = document.createElement("h4");
      radioName.classList.add("title", "is-4");
      radioName.innerText = station.name;

      radioElement.appendChild(radioName);

      let radioPlay = document.createElement("button");
      radioPlay.classList.add("button", "is-primary", "has-hover", "is-medium");

      let playIcon = document.createElement("span");
      playIcon.classList.add("icon", "mr-1");
      let icon = document.createElement("i");
      icon.classList.add("material-symbols-outlined");
      icon.innerText = "play_arrow";
      playIcon.appendChild(icon);
      radioPlay.appendChild(playIcon);

      let playText = document.createElement("span");
      playText.textContent = "Play";
      radioPlay.appendChild(playText);

      radioPlay.addEventListener("click", async () => {
        if (this.currentRadio) await this.currentRadio.stop();
        this.currentRadio = new radioStation(
          station.name,
          station.url,
          station.favicon,
          station.hls,
          station,
        );
        await this.currentRadio.play();
        this.updateMetadata();
      });

      radioElement.appendChild(radioPlay);

      let radioDelete = document.createElement("button");
      radioDelete.classList.add(
        "button",
        "is-danger",
        "has-hover",
        "is-medium",
        "is-pulled-right",
      );

      let deleteIcon = document.createElement("span");
      deleteIcon.classList.add("icon");
      let icon2 = document.createElement("i");
      icon2.classList.add("material-symbols-outlined");
      icon2.innerText = "delete";
      deleteIcon.appendChild(icon2);
      radioDelete.appendChild(deleteIcon);

      radioDelete.addEventListener("click", async () => {
        comfirmAction(`Are you sure you want to delete ${station.name}?`);
        this.radioScanner.stations = this.radioScanner.stations.filter(
          (s) => s.name !== station.name,
        );
        await this.radioScanner.saveStations();
        while (this.radioStationDisplay.firstChild) {
          this.radioStationDisplay.removeChild(
            this.radioStationDisplay.firstChild,
          );
        }
        await this.renderStations();
      });

      radioElement.appendChild(radioDelete);

      this.radioStationDisplay.appendChild(radioElement);
    });
  }
}
