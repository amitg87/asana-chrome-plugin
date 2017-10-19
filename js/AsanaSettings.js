angular.module("AsanaSettings", ["AsanaConstants"]).value("AsanaSettings", (function () {
    return {
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
