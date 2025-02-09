function hide(elementToHide) {
  if (elementToHide instanceof HTMLElement) {
    elementToHide.classList.add("hideme");
  } else {
    let elementToHide;
    try {
      elementToHide = document.getElementById(elementToHide);
      elementToHide.classList.add("hideme");
    } catch (e) {
      throw new Error(`Element with id ${elementToHide} not found`);
    }
  }
}

function refresh() {
  location.reload();
}

function goTo(url) {
  // Simulate click with a tag
  let aTag = document.createElement("a");
  aTag.href = url;
  aTag.click();
}

/**
 * @param {int} value - The value of the progress bar
 * @param {int} max - The maximum value of the progress bar
 * @param {string} message - The message to display
 */
function updateProgressBar(value, max, message) {
  try {
    if (!value || !max) throw new Error("Value and max must be provided");

    let progressBar = document.getElementById("progressBar");
    let progressMessage = document.getElementById("progressMessage");
    if (progressBar.classList.contains("hideme"))
      progressBar.classList.remove("hideme");
    if (progressMessage.classList.contains("hideme"))
      progressMessage.classList.remove("hideme");

    progressBar.value = value;
    progressBar.max = max;

    // set the text content as a percentage
    progressBar.textContent = `${(100 * value) / max}%`;

    progressMessage.textContent = message;
  } catch (e) {
    console.error(e.message);
  }
}

function updateProgressMessage(message) {
  try {
    let progressMessage = document.getElementById("progressMessage");
    progressMessage.textContent = message;
  } catch (e) {
    console.error(e.message);
  }
}

function log(message) {
  console.log(message);
}

function or(thingOne, thingTwo, defaultChoice) {
  if (thingOne && thingTwo)
    if (!defaultChoice || defaultChoice == 1) return thingOne;
    else return thingTwo;

  if (thingOne && !thingTwo) return thingOne;
  if (thingTwo && !thingOne) return thingTwo;
}

function dataToBlob(dataURI) {
  // Extract the base64 data from the Data URI
  const splitDataURI = dataURI.split(",");
  const byteString = atob(splitDataURI[1]);

  // Extract the mime type from the Data URI
  const mimeString = splitDataURI[0].split(":")[1].split(";")[0];

  // Convert base64 to byte array
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }

  // Create and return the blob
  let theBlob = new Blob([arrayBuffer], { type: mimeString });
  theBlob = URL.createObjectURL(theBlob);
  return theBlob;
}

function comfirmAction(message) {
  if(localStorage['autoConfirm'] == "true") return true;
  let choice = confirm(message);
  if(!localStorage['autoConfirm']) {
    localStorage['autoConfirm'] = confirm("Do you want to automatically confirm all actions?");
  }
  return choice;
}

async function alwaysOnTop(pipMessage) {
  // Try Document Picture-in-Picture first
  if (window.documentPictureInPicture) {
    if (window.documentPictureInPicture.window) {
      window.documentPictureInPicture.window.close();
      if (document.getElementById(pipMessage))
        document.getElementById(pipMessage).classList.remove("is-active");
      return;
    }

    try {
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
      
      return;
    } catch (error) {
      console.warn("PiP failed, falling back to new window:", error);
    }
  }

  // Fallback to creating a new window
  const windowFeatures = 'width=400,height=400,resizable=yes,scrollbars=no,status=no,location=no';
  const newWindow = window.open(window.location.href + "?miniplayer=true", 'MiniPlayer', windowFeatures);
  
  if (newWindow) {
    newWindow.addEventListener('beforeunload', () => {
      if (document.getElementById(pipMessage))
        document.getElementById(pipMessage).classList.remove("is-active");
    });

    if (document.getElementById(pipMessage))
      document.getElementById(pipMessage).classList.add("is-active");
  } else {
    alert("Unable to open new window. Please check if pop-ups are blocked.");
  }
}