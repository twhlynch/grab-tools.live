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

const fontcount = 8;
function dothefunny(element) {
    const randomFont = Math.floor(Math.random() * 8) + 1;
    element.style.fontFamily = `'${randomFont}'`;
    element.style.fontSize = Math.floor(Math.random() * 10) + 18 + "px";
    element.style.color = "#" + Math.floor(Math.random() * 16777215).toString(16);
    element.style.borderColor = "#" + Math.floor(Math.random() * 16777215).toString(16);
    element.style.textShadow = `${Math.floor(Math.random() * 4) + - 2 + "px"} ${Math.floor(Math.random() * 4) + - 2 + "px"} ${Math.floor(Math.random() * 4) + - 2 + "px"} ${"#" + Math.floor(Math.random() * 16777215).toString(16)}`;
    element.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
    element.style.transform = `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px) rotate(${Math.random() * 6 - 3}deg) scale(${Math.random() * 0.01 - 0.05 + 1})`
    element.style.animation = `funny ${Math.floor(Math.random() * 10) + 2}s infinite`;
    element.style.textAlign = ["left", "center", "right"][Math.floor(Math.random() * 3) + 1];
    element.style.alignSelf = ["start", "middle", "end"][Math.floor(Math.random() * 3) + 1];
    element.style.cursor = [
        'auto',
        'default',
        'none',
        'context-menu',
        'help',
        'pointer',
        'progress',
        'wait',
        'cell',
        'crosshair',
        'text',
        'vertical-text',
        'alias',
        'copy',
        'move',
        'no-drop',
        'not-allowed',
        'grab',
        'grabbing',
        'all-scroll',
        'col-resize',
        'row-resize',
        'n-resize',
        'e-resize',
        's-resize',
        'w-resize',
        'ne-resize',
        'nw-resize',
        'se-resize',
        'sw-resize',
        'ew-resize',
        'ns-resize',
        'nesw-resize',
        'nwse-resize',
        'zoom-in',
        'zoom-out',
        'initial',
        'inherit',
        'revert',
        'unset',
    ][Math.floor(Math.random() * 40) + 1];
}
document.querySelectorAll("*").forEach((element) => {
    dothefunny(element);
});
document.body.parentElement.style.backgroundImage = `linear-gradient(#${Math.floor(Math.random() * 16777215).toString(16)}, #${Math.floor(Math.random() * 16777215).toString(16)}, #${Math.floor(Math.random() * 16777215).toString(16)})`;
document.body.parentElement.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                dothefunny(node);
            }
            try {
                node.querySelectorAll("*").forEach((element) => {
                    dothefunny(element);
                });
            } catch {}
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });