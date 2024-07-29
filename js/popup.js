const popupPrefix = "launchPrep";
// const popupPrefix = "discordInvite";
// const popupPrefix = "loginPrompt";

function launchLog(t) {
    user_id = localStorage.getItem('user_id') || localStorage.getItem('last_user_id') || '';
    user_name = localStorage.getItem('user_name') || localStorage.getItem('last_user_name') || 'unknown';

    let playerUrl = 'https://grabvr.quest/levels?tab=tab_other_user&user_id=' + user_id;
    let webhookUrl = 'https://grab-tools-logs.twhlynch.workers.dev';
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: `[ᴍ](<https://grab-tools.live?mimic=${user_name}:${user_id}>)  ! **${t}** [${user_name}](<${playerUrl}>)`
        })
    });
}

if (!localStorage.getItem(`${popupPrefix}Shown`)) {
    let currentTime = new Date().getTime();
    let previousTime = parseInt(localStorage.getItem(`${popupPrefix}Time`))
    let willRun = true;
    
    if (previousTime) {
        if (previousTime + 86400000 > currentTime) {
            willRun = false;
        }
    }
    
    if (willRun) {
    let popupOverlayContainer = document.createElement("div");
    popupOverlayContainer.setAttribute("id", "popupOverlayContainer");

    let popupOverlayText = document.createElement("p");
    popupOverlayText.innerHTML = "GRAB is leaving Early Access with an OFFICIAL LAUNCH on <strong>August 8th</strong>, alongside one of the biggest updates yet! <br/><br/> There will be a FREE limited edition badge for playing in the first 24 hours";
    // popupOverlayText.innerHTML = "The GRAB Tools Discord server is a great place to get help using the available tools and find out about tools you didn't know about! Consider joining with the link below or by using the invite code: YKfGWSYAqf";
    // popupOverlayText.innerHTML = "You can now login to GRAB Tools and get personalised info on the stats page! Go to the homepage and click the login button at the top of the screen!";

    let yButton = document.createElement("a");
    yButton.classList.add("button");
    yButton.innerHTML = "Join Discord!";
    // yButton.innerHTML = "Join Now!";
    // yButton.innerHTML = "Go Now!";
    yButton.setAttribute("href", "https://discord.gg/slindev");
    // yButton.setAttribute("href", "https://grab-tools.live/discord");
    // yButton.setAttribute("href", "https://grab-tools.live");
    yButton.addEventListener("click", () => {
        popupOverlayContainer.style.display = "none";
        localStorage.setItem(`${popupPrefix}Shown`, "true");
        launchLog("Discord");
    });

    let yButton2 = document.createElement("a");
    yButton2.classList.add("button");
    yButton2.innerHTML = "Follow TikTok!";
    yButton2.setAttribute("href", "https://www.tiktok.com/@grabvrgame");
    yButton2.addEventListener("click", () => {
        popupOverlayContainer.style.display = "none";
        localStorage.setItem(`${popupPrefix}Shown`, "true");
        launchLog("TikTok");
    });
    
    let yButton3 = document.createElement("a");
    yButton3.classList.add("button");
    yButton3.innerHTML = "Follow YouTube!";
    yButton3.setAttribute("href", "https://www.youtube.com/@grabvrgame");
    yButton3.addEventListener("click", () => {
        popupOverlayContainer.style.display = "none";
        localStorage.setItem(`${popupPrefix}Shown`, "true");
        launchLog("YouTube");
    });

    let lButton = document.createElement("button");
    lButton.classList.add("button");
    lButton.innerHTML = "Maybe Later";
    lButton.addEventListener("click", () => {
        popupOverlayContainer.style.display = "none";
        localStorage.setItem(`${popupPrefix}Time`, `${currentTime}`);
        // localStorage.setItem(`${popupPrefix}Shown`, "true");
    });

    let nButton = document.createElement("button");
    nButton.classList.add("button");
    nButton.innerHTML = "No Thanks";
    nButton.addEventListener("click", () => {
        popupOverlayContainer.style.display = "none";
        localStorage.setItem(`${popupPrefix}Shown`, "true");
    });

    document.body.appendChild(popupOverlayContainer);
    popupOverlayContainer.appendChild(popupOverlayText);
    popupOverlayContainer.appendChild(yButton);
    popupOverlayContainer.appendChild(yButton2);
    popupOverlayContainer.appendChild(yButton3);
    popupOverlayContainer.appendChild(lButton);
    popupOverlayContainer.appendChild(nButton);
    }
}
