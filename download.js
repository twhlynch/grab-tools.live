async function download(id) {
    let SERVER_URL = 'https://api.slin.dev/grab/v1/';
    let response = await fetch(SERVER_URL + 'details/' + id.replace(':', '/'));
    let details = await response.json();
    let iteration = await details.iteration;
    let link = SERVER_URL + 'download/' + id.replace(':', '/') + '/' + iteration;
  
    let fileResponse = await fetch(link);
    let fileBlob = await fileResponse.blob();
    let url = window.URL.createObjectURL(fileBlob);
    let a = document.createElement('a');
    a.href = url;
    a.download = id.split(":")[1] + '.level';
    a.click();
}

const urlParams = new URLSearchParams(window.location.search);
const level = urlParams.get('level');
if (level) {
    console.log(level);
    const levels = level.split(" ");
    downloadAll(levels);
}

async function downloadAll(levels) {
    console.log(levels);
    for (let i = 0; i < levels.length; i++) {
        await download(levels[i]);
    }
}