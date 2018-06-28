angular.module("Asana").service("AsanaGateway",
    ["$http", "AsanaConstants", "AsanaSettings", "$q", "$filter", "ChromeExtensionService",
    function ($http, AsanaConstants, AsanaSettings, $q, $filter, ChromeExtension) {

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

        return AsanaGateway.api(options).then(function (response) {
            AsanaGateway.setDefaultPicture(response);
            return response;
        });
    };

    AsanaGateway.getWorkspaceProjects = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/projects";
        options.query = {opt_fields: "name,archived,notes,public"};

        return AsanaGateway.api(options).then(function (response) {
            //filter - archived projects
            var hideArchivedProjects = AsanaSettings.getHideArchivedProjects();
            if(hideArchivedProjects){
                return response.filter(function (project) {
                    return !project.archived;
                });
            }
            return response;
        });
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
        options.query.opt_fields = "name,completed,assignee.name,assignee.photo,due_on,due_at,workspace";
        options.query.completed_since = "now";
        return AsanaGateway.api(options);
    };

    AsanaGateway.getProject = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "projects/"+options.project_id;
        return AsanaGateway.api(options);
    };

    AsanaGateway.getProjectTasks = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "projects/" + options.project_id + "/tasks";
        options.query = {
            opt_fields:"name,completed,assignee.name,assignee.photo,due_on,due_at,completed_at,created_at,tags.name,followers,hearts.name,followers.name",
            limit: 100
        };
        if(options.offset){
            options.query.offset = options.offset;
        }
        //https://app.asana.com/api/1.0/projects/145619319717806/tasks?opt_fields=
        return AsanaGateway.api(options);
    };

    AsanaGateway.getTask = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "tasks/" + options.task_id;
        options.query = {
            opt_fields: "assignee.name,assignee.photo,assignee_status,completed,completed_at,created_at,due_at,due_on,followers.name,likes,liked,memberships,modified_at,name,notes,projects.name,tags.name,workspace.name"
        };
        return AsanaGateway.api(options).then(function (task) {
            AsanaGateway.setDefaultPictureUser(task.assignee);
            AsanaGateway.setDefaultPicture(task.followers);
            return task;
        });
    };

    AsanaGateway.getTaskStories = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "tasks/" + options.task_id + "/stories";
        options.query = {
            opt_fields: "type,text,created_at,created_by.name,created_by.email,created_by.photo.image_36x36"
        };

        return AsanaGateway.api(options).then(function (stories) {
            stories.forEach(function (story) {
                AsanaGateway.setDefaultPictureUser(story.created_by);
            });
            return stories;
        });
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

    AsanaGateway.search = function (options) {
        options = options || {};
        options.method = "GET";
        options.query = {
            type: options.type,
            query: options.search_text,
            opt_fields: "projects,name,id"
        };
        options.path = "workspaces/" + options.workspace_id + "/typeahead";
        return AsanaGateway.api(options);
    };

    //called by others
    AsanaGateway.api = function (options) {
        options.headers = {
            "X-Requested-With": "XMLHttpRequest",
            "X-Allow-Asana-Client": "1",
            "Asana-Fast-Api": true
        };

        var client_name = ChromeExtension.getClientName();

        var asanaOptions = {};
        if (options.method === "PUT" || options.method === "POST"){
            asanaOptions = {client_name: client_name};
        } else {
            options.query = options.query || {};
            options.query.opt_client_name = client_name;
        }
        var queryParams = "";
        for (var key in options.query) {
            if (options.query.hasOwnProperty(key)) {
                queryParams += (key + "=" + options.query[key] + "&");
            }
        }
        queryParams = encodeURI(queryParams.substr(0, queryParams.length-1));

        var url = AsanaConstants.getBaseApiUrl() + options.path + "?" + queryParams;
        var dataParam = {data: options.data, options: asanaOptions}
        var deferred = $q.defer();
        $http({
            method: options.method,
            url: url,
            respondType: 'json',
            headers: options.headers || {},
            data: dataParam
        }).then(function (response) {
            deferred.resolve(response.data.data);
            //deferred.resolve([response.data, response.next_page]);//destructuring - part of es6
        }).catch(function (response) {
            console.log("API Failure details: ");
            console.log("URL: ", url);
            console.log("Method: ", options.method);
            console.log("Status Code: ", response.status);
            console.log("Status Text: ", response.statusText)
            console.log("Headers: ", options.headers);
            console.log("Data: ", JSON.stringify(dataParam));
            console.log("Response: ", JSON.stringify(response));
            deferred.reject(response.data.errors);
        });
        return deferred.promise;
    };
}]);

asanaModule.service('StorageService', [function() {
    var StorageService = this;
    StorageService.getString = function(key) {
        return localStorage.getItem(key);
    }

    StorageService.setString = function(key, value) {
        localStorage.setItem(key, value)
    }

    StorageService.clearArray = function(key) {
        localStorage.setItem(key, JSON.stringify([]));
    }

    StorageService.getArray = function(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    StorageService.addToArray = function(key, value) {
        var current = StorageService.getArray(key);
        current.push(value);
        StorageService.initArray(key, current);
    }

    StorageService.removeFromArray = function(key, value) {
        var current = StorageService.getArray(key);
        var index = current.indexOf(value);
        if(index > -1) {
            current.splice(index, 1);
        }
        StorageService.initArray(key, current);
    }

    StorageService.initArray = function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}]);

asanaModule.service("ChromeExtensionService", [function () {
    var ChromeExtension = this;

    ChromeExtension.openLink = function (url) {
        chrome.tabs.create({url: url}, function () {
            window.close();
        });
    };

    ChromeExtension.openLinkInTab = function (url, tab) {
        chrome.tabs.update(tab.id, {url: url});
    };

    ChromeExtension.getCurrentTab = function (callback) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            callback(tabs[0]);
        });
    };
}]);