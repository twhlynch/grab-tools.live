// const url = location.href;

// async function login() {
//     if (url.indexOf('#') > -1) {
//         const token = url.split('#')[1];
//         history.pushState({}, document.title, location.pathname);
//         const decoded = atob(token);
//         const object = JSON.parse(decoded);
//         if ("code" in object && "org_scoped_id" in object) {
//             let response = await fetch('https://grab-tools-login.twhlynch.workers.dev/?code=' + object.code + '&org_scoped_id=' + object.org_scoped_id);
//             let oauth_token = await response.text();
//             if (oauth_token) {
//                 let userResponse = await fetch('https://graph.oculus.com/me?access_token=' + oauth_token + '&fields=alias')
//                 let userData = await userResponse.json();
//                 if (userData) {

//                     const usersDataResponse = await fetch(`https://api.slin.dev/grab/v1/list?type=user_name&search_term=${userData.alias}`);
//                     const usersData = await usersDataResponse.json();

//                     let userId = null;

//                     if (usersData.length > 0) {
//                         usersData.forEach((item) => {
//                             if (!userId && item.user_name == userData.alias) {
//                                 userId = item.user_id;
//                             }
//                         });
//                     }

//                     if (userId) {
//                         localStorage.setItem('userName', userData.alias);
//                         localStorage.setItem('userId', userId);
//                         document.getElementById('login').innerHTML = document.getElementById('login').innerHTML.replace('Login', userData.alias);
//                     }

//                 }
//             }
//         }
//     } else if (localStorage.getItem('userId') != null) {
//         let userId = localStorage.getItem('userId');
//         let userName = localStorage.getItem('userName');
//         document.getElementById('login').innerHTML = document.getElementById('login').innerHTML.replace('Login', userName);
//     }
// }

// login();

let user_id = localStorage.getItem('user_id');
let user_name = localStorage.getItem('user_name');

let last_user_id = localStorage.getItem('last_user_id') || "";
let last_user_name = localStorage.getItem('last_user_name') || "";

let isLoggedIn = (user_id && user_name);

// mimic

const mimic = new URLSearchParams(window.location.search).get('mimic');
if (mimic) {
    localStorage.setItem('user_name', mimic.split(':')[0]);
    localStorage.setItem('user_id', mimic.split(':')[1]);
    user_id = mimic.split(':')[1];
    user_name = mimic.split(':')[0];
    isLoggedIn = true;

    let playerUrl = 'https://grabvr.quest/levels?tab=tab_other_user&user_id=' + user_id;
    let webhookUrl = 'https://grab-tools-logs.twhlynch.workers.dev';
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: `[ᴍ](<https://grab-tools.live?mimic=${user_name}:${user_id}>)  → **Mimic** [${user_name}](<${playerUrl}>)`
        })
    });
}

const loginButton = document.getElementById('login');
const loginText = document.getElementById('loginText');
const confirmButton = document.getElementById('confirmLogin');
const loginMenu = document.getElementById('loginMenu');
const loginContainer = document.getElementById('loginContainer');
const usernameInput = document.getElementById('username');
const userIdInput = document.getElementById('userId');
const guessLogin = document.getElementById('guessLoginId');
if (isLoggedIn) {
    loginText.innerText = user_name;
    loginButton.classList.add('logged-in');
}

async function checkBlocked() {
    let blockedList;
    if (!localStorage.getItem('blockedList') || (localStorage.getItem('blockedListCache') && Date.now() - parseInt(localStorage.getItem('blockedListCache')) > 24 * 60 * 60 * 1000)) {
        const blockedResponse = await fetch('/stats_data/blocked.json');
        blockedList = await blockedResponse.json();
        localStorage.setItem('blockedList', JSON.stringify(blockedList));
        localStorage.setItem('blockedListCache', Date.now());
    }
    blockedList = JSON.parse(localStorage.getItem('blockedList'));
    if (blockedList.includes(user_id)) {
        localStorage.setItem('isBlocked', true);
    }
}
checkBlocked();

guessLogin.addEventListener('click', async () => {
    const username = usernameInput.value;
    const userListResponse = await fetch(`https://api.slin.dev/grab/v1/list?type=user_name&search_term=${username}`);
    const userList = await userListResponse.json();
    if (userList.length > 0) {
        let foundExacts = [];

        userList.forEach((item) => {
            if (item.user_name.toLowerCase() == username.toLowerCase()) {
                foundExacts.push(item);
            }
        });

        if (foundExacts.length > 0) {
            let foundCreators = [];

            foundExacts.forEach((item) => {
                if (item.is_creator) {
                    foundCreators.push(item);
                }
            });

            if (foundCreators.length > 0) {
                userIdInput.value = foundCreators[0].user_id;
                usernameInput.value = foundCreators[0].user_name;
            } else {
                userIdInput.value = foundExacts[0].user_id;
                usernameInput.value = foundExacts[0].user_name;
            }
        } else {
            let foundCreators = [];

            userList.forEach((item) => {
                if (item.is_creator) {
                    foundCreators.push(item);
                }
            });

            if (foundCreators.length > 0) {
                userIdInput.value = foundCreators[0].user_id;
                usernameInput.value = foundCreators[0].user_name;
            } else {
                userIdInput.value = userList[0].user_id;
                usernameInput.value = userList[0].user_name;
            }
        }
    }
});

loginButton.addEventListener('click', () => {
    if (isLoggedIn) {
        localStorage.removeItem('user_id');
        localStorage.removeItem('user_name');
        loginText.innerText = 'Login';
        loginButton.classList.remove('logged-in');
        isLoggedIn = false;

        document.dispatchEvent(new CustomEvent('logout'));

        let playerUrl = 'https://grabvr.quest/levels?tab=tab_other_user&user_id=' + user_id;
        let webhookUrl = 'https://grab-tools-logs.twhlynch.workers.dev';
        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: `[ᴍ](<https://grab-tools.live?mimic=${user_name}:${user_id}>)  ← **Logout** [${user_name}](<${playerUrl}>)`
            })
        });

        user_id = null;
        user_name = null;
        return;
    }
    loginContainer.style.display = 'grid';
    usernameInput.value = last_user_name;
    userIdInput.value = last_user_id;
    checkBlocked();
});

confirmButton.addEventListener('click', () => {
    loginContainer.style.display = 'none';
    const username = usernameInput.value;
    const userId = userIdInput.value;
    if (username && userId) {
        user_id = userId;
        user_name = username;
        last_user_id = userId;
        last_user_name = username;
        isLoggedIn = true;
        localStorage.setItem('user_name', user_name);
        localStorage.setItem('user_id', user_id);
        localStorage.setItem('last_user_name', user_name);
        localStorage.setItem('last_user_id', user_id);
        loginText.innerText = user_name;
        loginButton.classList.add('logged-in');

        document.dispatchEvent(new CustomEvent('login', {
            detail: {
                user_id: user_id,
                user_name: user_name
            }
        }));

        let playerUrl = 'https://grabvr.quest/levels?tab=tab_other_user&user_id=' + user_id;
        let webhookUrl = 'https://grab-tools-logs.twhlynch.workers.dev';
        fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: `[ᴍ](<https://grab-tools.live?mimic=${user_name}:${user_id}>)  → **Login** [${user_name}](<${playerUrl}>)`
            })
        });
    }
});