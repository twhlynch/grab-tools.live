const popupPrefix = "discordInvite";
// const popupPrefix = "loginPrompt";

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
    popupOverlayText.innerHTML = "The GRAB Tools Discord server is a great place to get help using the available tools and find out about tools you didn't know about! Consider joining with the link below or by using the invite code: YKfGWSYAqf";
    // popupOverlayText.innerHTML = "You can now login to GRAB Tools and get personalised info on the stats page! Go to the homepage and click the login button at the top of the screen!";

    let yButton = document.createElement("a");
    yButton.classList.add("button");
    yButton.innerHTML = "Join Now!";
    // yButton.innerHTML = "Go Now!";
    yButton.setAttribute("href", "https://grab-tools.live/discord");
    // yButton.setAttribute("href", "https://grab-tools.live");
    yButton.addEventListener("click", () => {
        popupOverlayContainer.style.display = "none";
        localStorage.setItem(`${popupPrefix}Shown`, "true");
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
    popupOverlayContainer.appendChild(lButton);
    popupOverlayContainer.appendChild(nButton);
    }
}
