
document.addEventListener('DOMContentLoaded', async () => {
    var songCollection = new songSystem();
    await songCollection.init();
    songImportArea = document.getElementById('songImportArea');
    songImportArea.addEventListener('drop', eventStuff);
    songImportArea.addEventListener('dragover', preventDefaults);
    songImportArea.addEventListener('dragenter', preventDefaults);
    songImportArea.addEventListener('dragleave', preventDefaults);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async function eventStuff(e){
        e.preventDefault();
        e.stopPropagation();

        if(e.dataTransfer.dropEffect)
            e.dataTransfer.dropEffect = 'copy';
        
        let fileLen = e.dataTransfer.files.length;

        // For each file in the DataTransfer object
        let currentFile = 0;
        for (let file of e.dataTransfer.files) {
            currentFile++;
            await songCollection.importSong(await file.arrayBuffer(), file.type);
            updateProgressBar(currentFile, fileLen, `Importing ${file.name}`);
        }
        updateProgressMessage(`Imported ${fileLen} files successfully!`);
    }

    let fileUpload = document.createElement('input');
    fileUpload.type = 'file';
    fileUpload.multiple = true;
    fileUpload.style.display = 'none';

    fileUpload.addEventListener('change', async (e) => {
        let fileLen = fileUpload.files.length;
        let currentFile = 0;
        for (let file of fileUpload.files) {
            currentFile++;
            await songCollection.importSong(file, file.type);
            updateProgressBar(currentFile, fileLen, `Importing ${file.name}`);
        }
        updateProgressMessage(`Imported ${fileUpload.files.length} files successfully!`);
    });

    songImportArea.addEventListener('click', () => {
        fileUpload.click();
    });
});
