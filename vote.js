if (!localStorage.getItem("votePopupShown")) {
    let voteOverlayContainer = document.createElement("div");
    voteOverlayContainer.setAttribute("id", "voteOverlayContainer");

    let voteOverlayText = document.createElement("p");
    voteOverlayText.innerHTML = "Voting for The GRAB Awards is live! Go nominate your favorite levels and creators!";

    let yButton = document.createElement("a");
    yButton.classList.add("button");
    yButton.innerHTML = "Vote Now!";
    yButton.setAttribute("href", "https://grab-tools.live/vote");
    yButton.addEventListener("click", () => {
        voteOverlayContainer.style.display = "none";
        localStorage.setItem("votePopupShown", "true");
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
        localStorage.setItem("votePopupShown", "true");
    });

    document.body.appendChild(voteOverlayContainer);
    voteOverlayContainer.appendChild(voteOverlayText);
    voteOverlayContainer.appendChild(yButton);
    voteOverlayContainer.appendChild(lButton);
    voteOverlayContainer.appendChild(nButton);
}
