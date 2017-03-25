asanaModule.value("AsanaConstants", (function () {
    return {
        API_VERSION          : "1.0",
        ASANA_HOST           : "app.asana.com",
        ASANA_LOGIN_COOKIE_NAME : "ticket",
        DEADLINE_TYPE: {
            NONE: 0,
            DUE_ON: 1,
            DUE_AT: 2
        },

        getBaseApiUrl        : function () {
            return "https://" + this.ASANA_HOST + '/api/' + this.API_VERSION + "/";
        },

        getAsanaDomain       : function() {
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
        },

        HIDE_ARCHIVED_PROJECTS: "hideArchivedProjects",
        getHideArchivedProjects: function () {
            return localStorage[this.HIDE_ARCHIVED_PROJECTS] === 'true';
        },
        setHideArchivedProjects: function (hide) {
            localStorage[this.HIDE_ARCHIVED_PROJECTS] = hide;
        },

        DEFAULT_ASSIGNEE_ME: "defaultAssigneeMe",
        getDefaultAssigneeMe: function () {
            return localStorage[this.DEFAULT_ASSIGNEE_ME] === 'true';
        },
        setDefaultAssigneeMe: function (defaultMe) {
            localStorage[this.DEFAULT_ASSIGNEE_ME] = defaultMe;
        },

        PROJECT_OPTIONAL: "projectOptional",
        getProjectOptional: function () {
            return localStorage[this.PROJECT_OPTIONAL] === 'true';
        },
        setProjectOptional: function (value) {
            localStorage[this.PROJECT_OPTIONAL] = value;
        }
    };
})());