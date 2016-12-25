var Asana = {
    API_VERSION: "1.0",
    ASANA_HOST: "app.asana.com",
    DEFAULT_WORKSPACE_ID: 0,
    ASANA_LOGIN_COOKIE_NAME: "ticket",

    getBaseApiUrl: function () {
        return "https://" + this.ASANA_HOST + '/api/' + this.API_VERSION + "/";
    },

    getAsanaDomain: function() {
        return "https://" + this.ASANA_HOST + "/";
    },

    isAsanaLoginCookie: function (cookieName) {
        return cookieName === Asana.ASANA_LOGIN_COOKIE_NAME;
    },

    isAsanaDomain: function (domain) {
        return domain.endsWith(Asana.ASANA_HOST);
    },

    // plugin specific
    LOGIN_PROPERTY: "loggedIn",
    isLoggedIn: function() {
        return localStorage[this.LOGIN_PROPERTY] === 'true';
    },

    setLoggedIn: function (loggedIn) {
        localStorage[this.LOGIN_PROPERTY] = loggedIn;
    }
};