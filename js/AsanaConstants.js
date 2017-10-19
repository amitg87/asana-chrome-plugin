angular.module("AsanaConstants", [])
    .value("AsanaConstantsValue", (function () {
    return {
        API_VERSION: "1.0",
        ASANA_HOST: "app.asana.com",
        ASANA_LOGIN_COOKIE_NAME: "ticket",
        DEADLINE_TYPE: {
            NONE: 0,
            DUE_ON: 1,
            DUE_AT: 2
        },

        getBaseApiUrl: function () {
            return "https://" + this.ASANA_HOST + '/api/' + this.API_VERSION + "/";
        },

        getAsanaDomain: function() {
            return "https://" + this.ASANA_HOST + "/";
        },

        isAsanaLoginCookie: function (cookieName) {
            return cookieName === this.ASANA_LOGIN_COOKIE_NAME;
        },

        isAsanaDomain: function (domain) {
            return domain.endsWith(this.ASANA_HOST);
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
})());