const urlParams = new URLSearchParams(window.location.search);
const level = urlParams.get('level');
if (level) {
    let user_id = localStorage.getItem('user_id');
    let user_name = localStorage.getItem('user_name');
    let isLoggedIn = (user_id && user_name);
    if (!isLoggedIn) {
        document.getElementById('login').click();
    } else {
        if (!localStorage.getItem('isBlocked')) {
            console.log(level);
            const levels = level.split(" ");
            alert("Use https://grabvr.tools for downloading");
        } else {
            const levels = level.split(" ");
            for (let i = 0; i < levels.length; i++) {
                log("BLOCKED", levels[i]);
            }
        }
    }
}
