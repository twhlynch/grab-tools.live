const url = location.href;

async function login() {
    if (url.indexOf('#') > -1) {
        const token = url.split('#')[1];
        history.pushState({}, document.title, location.pathname);
        const decoded = atob(token);
        const object = JSON.parse(decoded);
        if ("code" in object && "org_scoped_id" in object) {
            let response = await fetch('https://dotindex.pythonanywhere.com/get_access_token?code=' + object.code + '&org_scoped_id=' + object.org_scoped_id);
            let data = await response.json();
            if (data) {
                access_token = data.oauth_token;
                let userResponse = await fetch('https://graph.oculus.com/me?access_token=' + access_token + '&fields=alias')
                let userData = await userResponse.json();
                if (userData) {
                    // localStorage.setItem('user', userData.alias);
                    console.log(userData.alias);
                }
            }
        }
    }
}

login();

