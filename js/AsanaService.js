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

        var deferred = $q.defer();
        AsanaGateway.api(options).then(function (response) {
            response.forEach(function (user, index) {
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
            deferred.resolve(response);
        }).catch(function (response) {
            deferred.reject(response);
        });
        return deferred.promise;
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

    AsanaGateway.getWorkspaceMyTasks = function (options) {
        if(typeof options === 'undefined' || typeof options.workspace_id === 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/tasks";
        options.query = {assignee: "me", opt_fields: "name,due_on,due_at", completed_since: 'now'};

        return AsanaGateway.api(options);
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

    AsanaGateway.getTaskSubtasks = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "tasks/" + options.task_id + "/subtasks";
        return AsanaGateway.api(options);
    };

    AsanaGateway.getTaskWorkspaceParent = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "tasks/" + options.task_id;
        options.query = {opt_fields: "workspace, parent"};
        return AsanaGateway.api(options);
    };

    AsanaGateway.setParent = function (options) {
        options = options || {};
        options.method = "POST";
        options.path = "tasks/" + options.task_id + "/setParent";
        options.data = {
            parent: options.parent_id
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

    AsanaGateway.tasksTypeahead = function (options) {
        options = options || {};
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/typeahead";
        options.query = {
            type: 'task',
            query: options.query
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
    };
}]);

asanaModule.service("AsanaAlarm", ["AsanaGateway", function (AsanaGateway) {

    var AsanaAlarm = this;

    AsanaAlarm.listenedTasks = [];
    AsanaAlarm.reportedMin = -1;

    AsanaAlarm.createNotification = function (message, taskId, title) {
        // only message is the required argument
        var messageString = message.toString() || 'null';
        var notifcationIdString = (typeof(taskId) === 'number')? taskId.toString(): messageString;
        var titleString = title? title.toString(): 'AsanaNG';
        // Support Mac native notification from Chrome 59, the banner shows up every time
        chrome.notifications.clear(notifcationIdString);
        chrome.notifications.create(
            notifcationIdString, {type: "basic", iconUrl: "img/icon128.png", title: titleString, message: messageString}
        );
        if ((typeof taskId === 'number') && (AsanaAlarm.listenedTasks.indexOf(taskId) === -1)) {
            AsanaAlarm.listenedTasks.push(taskId);
            chrome.notifications.onClicked.addListener(function (notifcationIdString){
                chrome.tabs.create({url: "https://app.asana.com/0/0/" + notifcationIdString});
                chrome.notifications.clear(notifcationIdString);
            });
        }
    };

    AsanaAlarm.playSound = function () {
        var notificationSound = new Audio();
        // sound taken from http://gallery.mobile9.com/f/4709233/
        notificationSound.src = chrome.extension.getURL("sound/Cool Notification0.mp3");
        notificationSound.play();
    };

    AsanaAlarm.compareDateTime = function (response) {
        var dateNow = new Date();
        for (var i = 0; i < response.length; i ++) {
            if (response[i].due_at) {
                var dateDueAt = new Date(response[i].due_at);
                var minuteRemaining = Math.round((dateDueAt - dateNow)/60000);
                if (0 < minuteRemaining && minuteRemaining < 24 * 60) {
                    if ([1, 5, 15, 30, 60].indexOf(minuteRemaining) !== -1) {
                        AsanaAlarm.createNotification(response[i].name, response[i].id, minuteRemaining.toString() + " min until");
                        AsanaAlarm.playSound();
                    }
                }
            }
        }
    };

    AsanaAlarm.failureFunc = function (response) {
        // Sometimes the ticket cookie expires and an error is displayed
        // I have to come up with a workaround
        AsanaAlarm.createNotification("AlarmNG Error: " + JSON.stringify(response), 0);
    };

    AsanaAlarm.checkTasksAndNotify = function (workspaces) {
        var dateNow = new Date();
        var reportingMin = dateNow.getUTCMinutes();
        if (reportingMin === AsanaAlarm.reportedMin) {
            return;
        }
        else {
            AsanaAlarm.reportedMin = reportingMin;
            for (var i = 0; i < workspaces.length; i ++) {
                AsanaGateway.getWorkspaceMyTasks({workspace_id: workspaces[i].id})
                .then(AsanaAlarm.compareDateTime)
                .catch(AsanaAlarm.failureFunc);
            }
        }
    };
}]);