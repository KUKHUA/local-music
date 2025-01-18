function hide(elementToHide) {
    if(elementToHide instanceof HTMLElement) {
        elementToHide.classList.add('hideme');
    } else {
        let elementToHide;
        try {
            elementToHide = document.getElementById(elementToHide);
            elementToHide.classList.add('hideme');
        } catch (e) {
            throw new Error(`Element with id ${elementToHide} not found`);
        }
    }
}

function refresh(){
    location.reload();
}

function goTo(url){
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
        if (!value || !max) throw new Error('Value and max must be provided');

        let progressBar = document.getElementById('progressBar');
        let progressMessage = document.getElementById('progressMessage');
        if (progressBar.classList.contains('hideme')) progressBar.classList.remove('hideme');
        if (progressMessage.classList.contains('hideme')) progressMessage.classList.remove('hideme');

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
        let progressMessage = document.getElementById('progressMessage');
        progressMessage.textContent = message;
    } catch (e) {
        console.error(e.message);
    }
}

function log(message) {
    console.log(message);
}