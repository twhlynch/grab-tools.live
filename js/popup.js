
const popupPrefix = "newWebsite"; // "discordInvite"; "loginPrompt"; "launchPrep"; "launchCountdown";

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
        popupOverlayText.innerHTML = "I am currently remaking this website! Most features except the stats page are done. Go check it out and bookmark it at grabvr.tools";

        let yButton = document.createElement("a");
        yButton.classList.add("button");
        yButton.innerHTML = "grabvr.tools";
        yButton.setAttribute("href", "https://grabvr.tools");
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
