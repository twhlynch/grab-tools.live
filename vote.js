if (false && !localStorage.getItem("finalVotePopupShown")) {
    let voteOverlayContainer = document.createElement("div");
    voteOverlayContainer.setAttribute("id", "voteOverlayContainer");

    let voteOverlayText = document.createElement("p");
    voteOverlayText.innerHTML = "Final voting for The GRAB Awards is open! Go cast your final votes!";

    let yButton = document.createElement("a");
    yButton.classList.add("button");
    yButton.innerHTML = "Vote Now!";
    yButton.setAttribute("href", "https://grab-tools.live/vote");
    yButton.addEventListener("click", () => {
        voteOverlayContainer.style.display = "none";
        localStorage.setItem("finalVotePopupShown", "true");
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
        localStorage.setItem("finalVotePopupShown", "true");
    });

    document.body.appendChild(voteOverlayContainer);
    voteOverlayContainer.appendChild(voteOverlayText);
    voteOverlayContainer.appendChild(yButton);
    voteOverlayContainer.appendChild(lButton);
    voteOverlayContainer.appendChild(nButton);
}
