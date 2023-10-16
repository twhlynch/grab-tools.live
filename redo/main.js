let cursorOuter = document.getElementById("cursor-outer");
let cursorInner = document.getElementById("cursor-inner");
let links = document.getElementsByTagName("a");

document.addEventListener("mousemove", function (e) {
    cursorInner.style.transform =
        cursorOuter.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
});

for (let i = 0; i < links.length; i++) {
    links[i].addEventListener("mouseover", () => {
        cursorOuter.classList.add("cursor-outer-hover");
        cursorInner.classList.add("cursor-inner-hover");
    });
    links[i].addEventListener("mouseout", () => {
        cursorOuter.classList.remove("cursor-outer-hover");
        cursorInner.classList.remove("cursor-inner-hover");
    });
}

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
    
function changeStyle() {
    document.documentElement.style.setProperty('--text-color-default', "#b7b8c5");
    document.documentElement.style.setProperty('--text-color-alt', "#e0e1f0");
    document.documentElement.style.setProperty('--background-color-default', "#1d1d1d");
    document.documentElement.style.setProperty('--background-color-alt', "#131c22");
    document.documentElement.style.setProperty('--text-color-link', "#329e9e");
    document.documentElement.style.setProperty('--border-color', "#262626");
}
