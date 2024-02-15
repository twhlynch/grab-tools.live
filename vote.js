if (!localStorage.getItem("discordInviteShown")) {
    let voteOverlayContainer = document.createElement("div");
    voteOverlayContainer.setAttribute("id", "voteOverlayContainer");

    let voteOverlayText = document.createElement("p");
    voteOverlayText.innerHTML = "The GRAB Tools Discord server is a great place to get help using the available tools and find out about tools you didn't know about! Consider joining with the link below or by using the invite code: YKfGWSYAqf";

    let yButton = document.createElement("a");
    yButton.classList.add("button");
    yButton.innerHTML = "Join Now!";
    yButton.setAttribute("href", "https://grab-tools.live/discord");
    yButton.addEventListener("click", () => {
        voteOverlayContainer.style.display = "none";
        localStorage.setItem("discordInviteShown", "true");
    });

    let lButton = document.createElement("button");
    lButton.classList.add("button");
    lButton.innerHTML = "Maybe Later";
    lButton.addEventListener("click", () => {
        voteOverlayContainer.style.display = "none";
    });

    let nButton = document.createElement("button");
    nButton.classList.add("button");
    nButton.innerHTML = "No Thanks";
    nButton.addEventListener("click", () => {
        voteOverlayContainer.style.display = "none";
        localStorage.setItem("discordInviteShown", "true");
    });

    document.body.appendChild(voteOverlayContainer);
    voteOverlayContainer.appendChild(voteOverlayText);
    voteOverlayContainer.appendChild(yButton);
    voteOverlayContainer.appendChild(lButton);
    voteOverlayContainer.appendChild(nButton);
}
