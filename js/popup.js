if (!localStorage.getItem("discordInviteShown")) {
    let currentTime = new Date().getTime();
    let previousTime = parseInt(localStorage.getItem("discordInviteTime"))
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
    popupOverlayText.innerHTML = "The GRAB Tools Discord server is a great place to get help using the available tools and find out about tools you didn't know about! Consider joining with the link below or by using the invite code: YKfGWSYAqf";

    let yButton = document.createElement("a");
    yButton.classList.add("button");
    yButton.innerHTML = "Join Now!";
    yButton.setAttribute("href", "https://grab-tools.live/discord");
    yButton.addEventListener("click", () => {
        popupOverlayContainer.style.display = "none";
        localStorage.setItem("discordInviteShown", "true");
    });

    let lButton = document.createElement("button");
    lButton.classList.add("button");
    lButton.innerHTML = "Maybe Later";
    lButton.addEventListener("click", () => {
        popupOverlayContainer.style.display = "none";
        localStorage.setItem("discordInviteTime", `${currentTime}`);
    });

    let nButton = document.createElement("button");
    nButton.classList.add("button");
    nButton.innerHTML = "No Thanks";
    nButton.addEventListener("click", () => {
        popupOverlayContainer.style.display = "none";
        localStorage.setItem("discordInviteShown", "true");
    });

    document.body.appendChild(popupOverlayContainer);
    popupOverlayContainer.appendChild(popupOverlayText);
    popupOverlayContainer.appendChild(yButton);
    popupOverlayContainer.appendChild(lButton);
    popupOverlayContainer.appendChild(nButton);
    }
}
