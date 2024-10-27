let darkModeButton = document.getElementById("darkMode");
let latestTime = performance.now();
if (darkModeButton) {
    darkModeButton.addEventListener("click", () => {
        let currentTime = performance.now();
        let difference = currentTime - latestTime;
        latestTime = currentTime;
        console.log(difference);
        if (difference < 150) {
            darkModeButton.classList.add("ultra-dark");
            localStorage.setItem("darkMode", "ultra");
            document.body.parentElement.classList.add("ultra-dark-mode");
        } else {
            darkModeButton.classList.remove("ultra-dark");
            document.body.parentElement.classList.remove("ultra-dark-mode");
            if (darkModeButton.classList.contains("dark")) {
                darkModeButton.classList.remove("dark");
                localStorage.setItem("darkMode", "false");
                document.body.parentElement.classList.remove("dark-mode");
            } else {
                darkModeButton.classList.add("dark");
                localStorage.setItem("darkMode", "true");
                document.body.parentElement.classList.add("dark-mode");
            }
        }
    });
}

if (localStorage.getItem("darkMode") === "true") {
    document.body.parentElement.classList.add("dark-mode");
    if (darkModeButton) darkModeButton.classList.add("dark");
} else if (localStorage.getItem("darkMode") === "ultra") {
    document.body.parentElement.classList.add("ultra-dark-mode");
    if (darkModeButton) darkModeButton.classList.add("ultra-dark");
}

const currentLocation = window.location.pathname.replace("/", "").replace(".html", "");
const currentTab = document.getElementById("tab-" + currentLocation);
if (currentTab) {
    currentTab.classList.add("current");
}

// dev
if (location.href.includes("localhost") || location.href.includes("127.0.0.1")) {
    // highlight ad containers
    const adverts = document.querySelectorAll("#ads-overlay-r, #ads-overlay-l, #advertisement");
    adverts.forEach((advert) => {
        advert.style.outline = "solid 1px #0f0";
    });

    // live server sucks
    if (location.href.endsWith("/stats") || location.href.endsWith("/tools")) {
        location.href = location.href + ".html";
    }
}