const url = location.href;

async function login() {
    if (url.indexOf('#') > -1) {
        const token = url.split('#')[1];
        history.pushState({}, document.title, location.pathname);
        const decoded = atob(token);
        const object = JSON.parse(decoded);
        if ("code" in object && "org_scoped_id" in object) {
            let response = await fetch('https://grab-tools-login.twhlynch.workers.dev/?code=' + object.code + '&org_scoped_id=' + object.org_scoped_id);
            let oauth_token = await response.text();
            if (oauth_token) {
                let userResponse = await fetch('https://graph.oculus.com/me?access_token=' + oauth_token + '&fields=alias')
                let userData = await userResponse.json();
                if (userData) {

                    const usersDataResponse = await fetch(`https://api.slin.dev/grab/v1/list?type=user_name&search_term=${userData.alias}`);
                    const usersData = await usersDataResponse.json();

                    let userId = null;

                    if (usersData.length > 0) {
                        usersData.forEach((item) => {
                            if (!userId && item.user_name == userData.alias) {
                                userId = item.user_id;
                            }
                        });
                    }

                    if (userId) {
                        localStorage.setItem('userName', userData.alias);
                        localStorage.setItem('userId', userId);
                        document.getElementById('login').innerHTML = document.getElementById('login').innerHTML.replace('Login', userData.alias);
                    }

                }
            }
        }
    } else if (localStorage.getItem('userId') != null) {
        let userId = localStorage.getItem('userId');
        let userName = localStorage.getItem('userName');
        document.getElementById('login').innerHTML = document.getElementById('login').innerHTML.replace('Login', userName);
    }
}

login();

