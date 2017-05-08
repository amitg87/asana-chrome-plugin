asanaModule.service("AsanaGateway", ["$http", "AsanaConstants", "$q", function ($http, AsanaConstants, $q) {

    var AsanaGateway = this;
    
    AsanaGateway.getWorkspaces = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "workspaces";
        return AsanaGateway.api(options);
    };

    AsanaGateway.getWorkspaceUsers = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/users";
        options.query = {opt_fields: "name,email,photo"};

        return AsanaGateway.api(options);
    };

    AsanaGateway.getWorkspaceProjects = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/projects";
        options.query = {opt_fields: "name,archived,notes,public"};

        var deferred = $q.defer();
        AsanaGateway.api(options).then(function (response) {
            //filter - archived projects
            var hideArchivedProjects = AsanaConstants.getHideArchivedProjects();
            if(hideArchivedProjects){
                deferred.resolve(response.filter(function (project) {
                    return !project.archived;
                }));
            } else {
                deferred.resolve(response);
            }
        }).catch(function (response) {
            deferred.reject(response);
        });
        return deferred.promise;
    };

    AsanaGateway.getWorkspaceTags = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/tags";
        options.query = {opt_fields: "name,notes"};

        return AsanaGateway.api(options);
    };

    AsanaGateway.getUserData = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "users/me";
        options.query = {opt_fields: "name,email,photo"};

        return AsanaGateway.api(options);
    };

    AsanaGateway.createTask = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "tasks";
        return AsanaGateway.api(options);
    };

    AsanaGateway.createNewTag = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "tags";
        return AsanaGateway.api(options);
    };

    AsanaGateway.createNewProject = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "projects";
        return AsanaGateway.api(options);
    };

    AsanaGateway.getTasks = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "tasks";
        options.query.opt_fields = "name,completed,assignee";
        options.query.completed_since = "now";
        return AsanaGateway.api(options);
    };

    AsanaGateway.getTask = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "tasks/" + options.task_id;
        return AsanaGateway.api(options);
    };

    AsanaGateway.taskDone = function (options) {
        options = options || {};
        options.method = "PUT";
        options.path = "tasks/" + options.task_id;
        options.query = {completed: options.completed};
        return AsanaGateway.api(options);
    };

    AsanaGateway.getTaskStories = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "tasks/" + options.task_id + "/stories";
        options.query = {
            opt_fields: "type,text,created_at,created_by.name,created_by.email,created_by.photo.image_36x36"
        };

        return AsanaGateway.api(options);
    };

    AsanaGateway.addComment = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "tasks/" + options.task_id + "/stories";
        options.data = {
            text: options.commentText
        };
        return AsanaGateway.api(options);
    };

    AsanaGateway.updateTask = function (options) {
        options = options || {};
        options.method = "PUT";
        options.path = "tasks/" + options.task_id;
        return AsanaGateway.api(options);
    };

    AsanaGateway.addTag = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "tasks/" + options.task_id + "/addTag";
        options.data =  {
            tag: options.tag_id
        };
        return AsanaGateway.api(options);
    };

    AsanaGateway.removeTag = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "tasks/" + options.task_id + "/removeTag";
        options.data = {
            tag: options.tag_id
        };
        return AsanaGateway.api(options);
    };

    AsanaGateway.addProjectToTask = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "tasks/" + options.task_id + "/addProject";
        options.data = {
            project: options.project_id
        };
        return AsanaGateway.api(options);
    };

    AsanaGateway.removeProjectFromTask = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "tasks/" + options.task_id + "/removeProject";
        options.data = {
            project: options.project_id
        };
        return AsanaGateway.api(options);
    };

    AsanaGateway.addFollowerToTask = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "tasks/" + options.task_id + "/addFollowers";
        options.data = {
            followers: [options.follower_id]
        };
        return AsanaGateway.api(options);
    };

    AsanaGateway.removeFollowersFromTask = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "tasks/" + options.task_id + "/removeFollowers";
        options.data = {
            followers: [options.follower_id]
        };
        return AsanaGateway.api(options);
    };

    //called by others
    AsanaGateway.api = function (options) {
        options.headers = {
            "X-Requested-With": "XMLHttpRequest",
            "X-Allow-Asana-Client": "1",
            "Asana-Fast-Api": true
        };

        // Be polite to Asana API and tell them who we are.
        var manifest = chrome.runtime.getManifest();
        var client_name = [
            "chrome-extension",
            chrome.i18n.getMessage("@@extension_id"),
            manifest.version,
            manifest.name
        ].join(":");

        var asanaOptions = {};
        if (options.method === "PUT" || options.method === "POST"){
            asanaOptions = {client_name: client_name};
        } else {
            options.query = options.query || {};
            options.query["opt_client_name"] = client_name;
        }
        var queryParams = "";
        for (var key in options.query) {
            if (options.query.hasOwnProperty(key)) {
                queryParams += (key + "=" + options.query[key] + "&");
            }
        }
        queryParams = encodeURI(queryParams.substr(0, queryParams.length-1));

        var url = AsanaConstants.getBaseApiUrl() + options.path + "?" + queryParams;
        var deferred = $q.defer();
        $http({
            method: options.method,
            url: url,
            respondType: 'json',
            headers: options.headers || {},
            params: options.params || {},
            data: {data: options.data, options: asanaOptions}
        }).success(function (response) {
            deferred.resolve(response.data);
        }).error(function (response, status) {
            if (response && response.hasOwnProperty(errors)) {
                deferred.reject(response.errors);
            } else {
                deferred.reject(response);
            }
        });
        return deferred.promise;
    };
}]);

asanaModule.service("ChromeExtensionService", [function () {
    var ChromeExtension = this;

    ChromeExtension.openLink = function (url) {
        chrome.tabs.create({url: url}, function () {
            window.close();
        });
    }
}]);