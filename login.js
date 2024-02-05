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
                    localStorage.setItem('user', userData.alias);
                    document.getElementById('user').innerHTML.replace('Login', userData.alias);
                    console.log(userData.alias);
                }
            }
        }
    }
}

login();

