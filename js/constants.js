asanaModule.value("AsanaConstants", (function () {
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
        },

        NOTIFICATIONS_ENABLED: "enableNotifications",
        getNotificationsEnabled: function () {
            return localStorage[this.NOTIFICATIONS_ENABLED] === 'true';
        },
        setNotificationsEnabled: function (value) {
            localStorage[this.NOTIFICATIONS_ENABLED] = value;
        },

        REMEMBER_PROJECT: "rememberProject",
        getRememberProject: function () {
            return localStorage[this.REMEMBER_PROJECT] === 'true';
        },

        setRememberProject: function (value) {
            localStorage[this.REMEMBER_PROJECT] = value;
        },

        REMEMBER_TAG: "rememberTag",
        getRememberTag: function () {
            return localStorage[this.REMEMBER_TAG] === 'true';
        },

        setRememberTag: function (value) {
            localStorage[this.REMEMBER_TAG] = value;
        },

        REMEMBER_FOLLOWER: "rememberFollower",
        getRememberFollower: function () {
            return localStorage[this.REMEMBER_FOLLOWER] === 'true';
        },

        setRememberFollower: function (value) {
            localStorage[this.REMEMBER_FOLLOWER] = value;
        },

        setDefaultPictureUser: function (user) {
            if(user && user.photo == null){
                user.photo = {
                    "image_21x21": "../img/nopicture.png",
                    "image_27x27": "../img/nopicture.png",
                    "image_36x36": "../img/nopicture.png",
                    "image_60x60": "../img/nopicture.png",
                    "image_128x128": "../img/nopicture.png",
                    "image_1024x1024": "../img/nopicture.png"
                };
            }
        },

        setDefaultPicture: function (users) {
            users.forEach(function (user) {
                if(user.photo == null){
                    user.photo = {
                        "image_21x21": "../img/nopicture.png",
                        "image_27x27": "../img/nopicture.png",
                        "image_36x36": "../img/nopicture.png",
                        "image_60x60": "../img/nopicture.png",
                        "image_128x128": "../img/nopicture.png",
                        "image_1024x1024": "../img/nopicture.png"
                    };
                }
            });
        }
    };
})());