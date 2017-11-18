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
        options.query.opt_fields = "name,completed,assignee.name,assignee.photo,due_on,due_at";
        options.query.completed_since = "now";
        var now = new Date().getTime(); // current time since epoch seconds
        return AsanaGateway.api(options).then(function (response) {
            response.forEach(function (element) {
                if(element.assignee != null){
                    AsanaGateway.setDefaultPictureUser(element.assignee);
                }
                if(element.due_at !== null){
                    element.due = Date.parse(element.due_at);
                    element.schedule = $filter('date')(new Date(element.due), 'MMM d hh:mm a');
                    element.status = element.due < now? 'overdue':'upcoming';
                } else if(element.due_on != null) {
                    element.due = Date.parse(element.due_on);
                    element.schedule = $filter('date')(new Date(element.due), 'MMM d');
                    element.status = element.due < now? 'overdue':'upcoming';
                } else {
                    element.due = Number.MAX_VALUE;
                    element.schedule = "";
                }
            });
            return response;
        });
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
            opt_fields: "assignee.name,assignee.photo,assignee_status,completed,completed_at,created_at,due_at,due_on,followers.name,hearted,hearts,memberships,modified_at,name,notes,num_hearts,projects.name,tags.name,workspace.name"
        };
        return AsanaGateway.api(options).then(function (task) {
            AsanaGateway.setDefaultPictureUser(task.assignee);
            AsanaGateway.setDefaultPicture(task.followers);
            return task;
        });
    };

    AsanaGateway.setDefaultPictureUser = function (user) {
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
    };

    AsanaGateway.setDefaultPicture = function (users) {
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
        var deferred = $q.defer();
        $http({
            method: options.method,
            url: url,
            respondType: 'json',
            headers: options.headers || {},
            params: options.params || {},
            data: {data: options.data, options: asanaOptions}
        }).success(function (response) {
            if(!angular.isDefined(response.next_page))
                deferred.resolve(response.data);
            else
                deferred.resolve([response.data, response.next_page]);//destructuring - part of es6
        }).error(function (response) {
            if (response && response.hasOwnProperty("errors")) {
                deferred.reject(response.errors);
            } else {
                deferred.reject(response);
            }
        });
        return deferred.promise;
    };
}]);