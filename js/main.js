let cursorOuter = document.getElementById("cursor-outer");
let cursorInner = document.getElementById("cursor-inner");
let links = document.querySelectorAll("a, button, .button");
if (window.navigator.platform !== "MacIntel" && window.navigator.platform!== "MacPPC" && window.navigator.platform!== "Mac68K") {
    document.addEventListener("mousemove", function (e) {
        cursorInner.style.transform =
        cursorOuter.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    });
}

for (let i = 0; i < links.length; i++) {
    links[i].addEventListener("mouseover", () => {
        cursorOuter.classList.add("cursor-outer-hover");
        cursorInner.classList.add("cursor-inner-hover");
    });
    links[i].addEventListener("mouseout", () => {
        cursorOuter.classList.remove("cursor-outer-hover");
        cursorInner.classList.remove("cursor-inner-hover");
    });
    if (links[i].classList.contains("bookmarklet")) {
        links[i].addEventListener("click", (e) => {
            e.preventDefault();
            navigator.clipboard.writeText(links[i].href);
        });
    }
}

if (document.title === "GRAB Tools") {
    const currentTime = document.getElementById("currentTime");
    const currentState = document.getElementById("currentState");
    const time = new Date();

    const options = { timeZone: 'Australia/Melbourne' };
    const localTime = time.toLocaleString('en-US', options);

    let hour = new Date(localTime).getHours();

    if (hour >= 17 && hour < 24) {
        currentState.innerHTML = "awake";
    } else if (hour >= 9 && hour < 17) {
        currentState.innerHTML = "working";
    } else {
        currentState.innerHTML = "sleeping";
    }
    let minutes = new Date(localTime).getMinutes();
    currentTime.innerHTML = `${hour < 12 ? hour : hour - 12}:${minutes < 10 ? '0' + minutes : minutes} ${hour >= 12 ? "PM" : "AM"}`;
}

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
    darkModeButton.classList.add("dark");
} else if (localStorage.getItem("darkMode") === "ultra") {
    document.body.parentElement.classList.add("ultra-dark-mode");
    darkModeButton.classList.add("ultra-dark");
}

const currentLocation = window.location.pathname.replace("/", "").replace(".html", "");
const currentTab = document.getElementById("tab-" + currentLocation);
if (currentTab) {
    currentTab.classList.add("current");
}