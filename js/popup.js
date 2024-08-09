
const popupPrefix = "discordInvite"; // loginPrompt"; "launchPrep"; "launchCountdown";

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
        popupOverlayText.innerHTML = "The GRAB Modding Discord server is a great place to get help using the available tools and find out about tools you didn't know about! Consider joining with the link below or by using the invite code: YKfGWSYAqf";

        let yButton = document.createElement("a");
        yButton.classList.add("button");
        yButton.innerHTML = "Join Discord!";
        yButton.setAttribute("href", "https://grab-tools.live/discord");
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
