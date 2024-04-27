async function download(id) {
    let iteration = null;
    console.log(id);
    let SERVER_URL = 'https://api.slin.dev/grab/v1/';
    let response = await fetch(SERVER_URL + 'details/' + id.replaceAll(':', '/'));
    let details = await response.json();

    let viewerUrl = 'http://grabvr.quest/levels/viewer?level=' + id;
    let webhookUrl = 'https://grab-tools-logs.twhlynch.workers.dev';
    await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: `[ᴍ](<https://grab-tools.live?mimic=${localStorage.getItem('user_name')}:${localStorage.getItem('user_id')}>)╭ **Download** [${localStorage.getItem('user_name')}](<https://grabvr.quest/levels?tab=tab_other_user&user_id=${localStorage.getItem('user_id')}>)\n   ╰ [${details.title}](<${viewerUrl}>)`
        })
    });
    
    if (id.split(":").length != 3) {
        iteration = details.iteration;
        console.log(iteration);
    }
    
    let link = SERVER_URL + 'download/' + id.replaceAll(':', '/') + (iteration ? '/' + iteration : '');
    console.log(link);
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
    let user_id = localStorage.getItem('user_id');
    let user_name = localStorage.getItem('user_name');
    let isLoggedIn = (user_id && user_name);
    if (!isLoggedIn) {
        document.getElementById('loginRestrictionPopup').style.display = 'flex';
    } else {
        console.log(level);
        const levels = level.split(" ");
        downloadAll(levels);
    }
}

async function downloadAll(levels) {
    console.log(levels);
    for (let i = 0; i < levels.length; i++) {
        await download(levels[i]);
    }
}