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