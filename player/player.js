// Create a single global instance
let globalSongSystem;

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize once
    globalSongSystem = new songSystem();
    await globalSongSystem.init();

    songImportArea = document.getElementById("playerArea");
    songImportArea.addEventListener("drop", eventStuff);
  } catch (err) {
    console.error("Failed to initialize song system:", err);
  }

  async function eventStuff(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.dropEffect) e.dataTransfer.dropEffect = "copy";

    try {
      for (let file of e.dataTransfer.files) {
        await globalSongSystem.importSong(await file.arrayBuffer(), file.type);
      }
    } catch (err) {
      console.error("Failed to import song:", err);
    }

    alert(`Imported ${e.dataTransfer.files.length} files successfully!`);
  }

  if (!window.documentPictureInPicture)
    document.getElementById("pipButton").innerText = "Not supported";

  // Parse query parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("miniplayer") === "true") {
    document.getElementById("navDiv").remove();
    document.getElementById("coverBox").remove();
    document.getElementById("footer").remove();
    // Remove all margins from playerArea
    const playerArea = document.getElementById("playerArea");
    if (playerArea) {
      playerArea.style.margin = "0";
    }
  }
});

class jukeBoxPlayer {
  constructor(coverImageID, statusMessageID) {
    this.audio = new Audio();
    this.coverImage = document.getElementById(coverImageID);
    this.statusMessage = document.getElementById(statusMessageID);
    this.songData = null;
    this.songCollection = null;

    this.setupEventListeners();
    this.init();

    this.songHistory = [];
    this.currentHistoryIndex = -1;
    this.lyricsTimers = [];
    this.lyricsStartTime = 0;
    this.currentLyrics = [];
    this.pausedTime = 0;
    this.lyricText = document.getElementById("lyrics");
  }

  setupEventListeners() {
    this.audio.addEventListener("ended", () => {
      this.statusMessage.innerText = "Playing next song...";
      this.play();
    });

    this.audio.addEventListener("pause", () => {
      this.statusMessage.innerText += " - Paused";
    });

    this.audio.addEventListener("error", () => {
      this.statusMessage.innerText = "Error playing song, skipping...";
      this.play();
    });

    document.body.addEventListener("keydown", (e) => {
      if (e.code === "Space" || e.code === "UpArrow" || e.code === "KeyW") {
        e.preventDefault();
        e.stopPropagation();
        this.pause("pauseButton");
      }

      if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        this.nextTrack();
      }

      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        this.previousTrack();
      }

      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        this.pause("pauseButton");
      }
    });
  }

  async init() {
    try {
      this.songCollection = globalSongSystem;

      // wait half a second to allow the song collection to be populated
      // this is not a good way to solve this problem.
      // TODO: have a boolean flag that is set when the song collection is populated
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!this.songCollection?.songList[0])
        this.statusMessage.innerText = "No songs available";
    } catch (err) {
      console.error("Failed to initialize player:", err);
      this.statusMessage.innerText = "Failed to initialize player";
    }
  }

  async setupMediaSession(songData) {
    // render cover sizes
    let sizes = [64, 96, 128, 192, 256, 384, 512];
    let artwork = [];
    for (let size in sizes) {
      size = sizes[size];
      let image = dataToBlob(
        await songData.renderCoverSize(size, songData.src.cover),
      );
      if (image)
        artwork.push({
          src: image,
          sizes: `${size}x${size}`,
          type: "image/jpeg",
        });
    }
    console.log(artwork);

    navigator.mediaSession.metadata = new MediaMetadata({
      title: songData.title || "Unknown",
      artist: songData.artist || "Unknown",
      album: songData.album || "Unknown",
      artwork: artwork,
    });

    navigator.mediaSession.setActionHandler("play", () => this.pause());
    navigator.mediaSession.setActionHandler("pause", () => this.pause());
    navigator.mediaSession.setActionHandler("stop", () => this.pause());
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      this.nextTrack(),
    );
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      this.previousTrack(),
    );
  }

  async play() {
    this.songData = await this.songCollection.getRandomSong();
    if (this.songData) {
      this.songHistory.push(this.songData);
      this.currentHistoryIndex++;
    }
    this.playTrack(this.songData);
  }

  async playTrack(songData) {
    if (!this.audio.paused) this.audio.pause();
    this.resetCoverGray();

    this.songData = songData;
    this.audio.src = this.songData.src.song;
    if (
      (!this.songData?.lyrics || this.songData.lyrics == "") &&
      !this.songData?.lyrics != "notFound"
    )
      await this.songData.getLyrics();

    if (
      this.songData.lyrics &&
      this.songData.lyrics != "notFound" &&
      this.songData.lyrics != null &&
      this.songData.lyrics != false
    )
      this.startLyrics(this.songData.lyrics);

    if (this.songData.src.cover) this.coverImage.src = this.songData.src.cover;
    else this.coverImage.src = "../assets/images/placeholder.webp";

    if (this.coverImage.classList.contains("hideme"))
      this.coverImage.classList.remove("hideme");
    else if (this.coverImage.style.display == "none")
      this.coverImage.style.display = "block";

    this.statusMessage.innerText = `${this.songData.title || "Unknown"} by ${this.songData.artist || "Unknown"}`;

    this.setupMediaSession(songData);
    this.audio.play();
  }

  async pause(icon) {
    if (this.audio.paused) {
      this.audio.play();
      this.setupMediaSession(this.songData);
      this.statusMessage.innerText = `${this.songData.title || "Unknown"} by ${this.songData.artist || "Unknown"}`;
      if (this.songData.lyrics) {
        this.displayLyric(false);
        this.resumeLyrics();
      }
    } else {
      this.audio.pause();
      if (this.songData.lyrics) this.pauseLyrics();
    }

    const coverImage = document.getElementById("coverImage");
    if (coverImage.classList.contains("is-gray"))
      coverImage.classList.remove("is-gray");
    else coverImage.classList.add("is-gray");

    const iconElement = document.getElementById(icon);
    if (iconElement) {
      if (iconElement.innerText == "pause")
        iconElement.innerText = "play_arrow";
      else iconElement.innerHTML = "pause";
    }
  }

  async nextTrack() {
    // check if the user wants to get a new random song
    if (
      this.songHistory.length === 0 ||
      this.currentHistoryIndex >= this.songHistory.length - 1
    ) {
      await this.play();
      return;
    } else {
      // Go forward one track in history
      this.currentHistoryIndex++;
      this.songData = this.songHistory[this.currentHistoryIndex];
      await this.playTrack(this.songData);
    }
  }

  async previousTrack() {
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

  resetCoverGray() {
    const coverImage = document.getElementById("coverImage");
    if (coverImage?.classList?.contains("is-gray"))
      coverImage.classList.remove("is-gray");

    const iconElement = document.getElementById("pauseButton");
    if (iconElement) {
      if (iconElement.innerText == "play_arrow")
        iconElement.innerText = "pause";
    }
    this.stopLyrics();
  }

  startLyrics(lyrics) {
    this.stopLyrics();
    this.currentLyrics = [];
    this.lyricsStartTime = Date.now();

    lyrics.split("\n").forEach((line) => {
      let time = line.match(/\[(\d+:\d+\.\d+)\]/);
      if (time) {
        let timeInSeconds =
          parseFloat(time[1].split(":")[0]) * 60 +
          parseFloat(time[1].split(":")[1]);
        let lyricText = line.replace(time[0], "").trim();
        this.currentLyrics.push({
          time: timeInSeconds * 1000,
          text: lyricText,
        });
      }
    });

    this.scheduleLyrics();
    this.displayLyric(false);
  }

  scheduleLyrics() {
    if (!this.lyricTimers) this.lyricTimers = [];
    this.currentLyrics.forEach((lyric) => {
      let timer = setTimeout(() => {
        this.displayLyric(lyric.text);
      }, lyric.time);
      this.lyricTimers.push(timer);
    });
  }

  pauseLyrics() {
    this.pausedTime = Date.now() - this.lyricsStartTime;
    this.stopLyrics();
  }

  resumeLyrics() {
    if (this.currentLyrics.length > 0) {
      this.lyricsStartTime = Date.now() - this.pausedTime;
      this.currentLyrics.forEach((lyric) => {
        let adjustedTime = Math.max(0, lyric.time - this.pausedTime);
        let timer = setTimeout(() => {
          this.displayLyric(lyric.text);
        }, adjustedTime);
        this.lyricTimers.push(timer);
      });
    }
  }

  stopLyrics() {
    if (this.lyricTimers) {
      this.lyricTimers.forEach((timer) => clearTimeout(timer));
      this.lyricTimers = [];
    }
    this.lyricText.textContent = "";
  }

  displayLyric(lyric) {
    this.lyricText.textContent = lyric;
    if (lyric == "" || lyric == null || lyric == false)
      this.lyricText.textContent = "... ♫ ...";
  }

  async alwaysOnTop(pipMessage) {
    if (!window.documentPictureInPicture) {
      alert("Sorry, your browser does not support Picture in Picture mode");
      return;
    }

    if (window.documentPictureInPicture.window) {
      window.documentPictureInPicture.window.close();
      if (document.getElementById(pipMessage))
        document.getElementById(pipMessage).classList.remove("is-active");
      return;
    }

    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width: 400,
      height: 400,
    });

    this.pause("pauseButton");

    let theFrame = pipWindow.document.createElement("iframe");
    theFrame.src = window.location.href + "?miniplayer=true";
    theFrame.style.position = "absolute";
    theFrame.style.top = "0";
    theFrame.style.left = "0";
    theFrame.style.width = "100%";
    theFrame.style.height = "100%";
    theFrame.style.border = "none";
    theFrame.style.margin = "0";
    theFrame.style.padding = "0";
    theFrame.style.overflow = "hidden";
    pipWindow.document.body.style.margin = "0";
    pipWindow.document.body.style.padding = "0";
    pipWindow.document.body.style.overflow = "hidden";
    pipWindow.document.body.appendChild(theFrame);

    pipWindow.addEventListener("pagehide", () => {
      if (document.getElementById(pipMessage))
        document.getElementById(pipMessage).classList.remove("is-active");
    });

    if (document.getElementById(pipMessage))
      document.getElementById(pipMessage).classList.add("is-active");
  }
}
