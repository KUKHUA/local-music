
document.addEventListener('DOMContentLoaded', () => {
    var songCollection = new songSystem();
    songImportArea = document.getElementById('songImportArea');
    songImportArea.addEventListener('dragover', eventStuff);
    songImportArea.addEventListener('drop', eventStuff);
    songImportArea.addEventListener('dragenter', eventStuff);
    songImportArea.addEventListener('dragleave', eventStuff);

    async function eventStuff(e){
        e.preventDefault();
        e.stopPropagation();

        e.dataTransfer.dropEffect = 'copy';

        // For each file in the DataTransfer object
        for (let file of e.dataTransfer.files) {
            await songCollection.importSong(await file.arrayBuffer(), file.type);
        }
    }

    let fileUpload = document.createElement('input');
    fileUpload.type = 'file';
    fileUpload.multiple = true;
    fileUpload.style.display = 'none';
    fileUpload.addEventListener('change', async (e) => {
        for (let file of fileUpload.files) {
            await songCollection.importSong(file, file.type);
        }
    });

    songImportArea.addEventListener('click', () => {
        fileUpload.click();
    });
});
