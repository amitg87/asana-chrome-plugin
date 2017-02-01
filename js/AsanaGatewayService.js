asanaModule.service("AsanaGateway", ["$http", function ($http) {

    this.getWorkspaces = function (success, failure, options) {
        options = options? options: {};
        options.method = "GET";
        options.path = "workspaces";
        this.api(success, failure, options);
    };

    this.getWorkspaceUsers = function (success, failure, options) {
        if(typeof options === 'undefined' || typeof options.workspace_id === 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/users";
        options.query = {opt_fields: "name,email,photo.image_128x128"};

        this.api(function (response) {
            if(typeof response.photo === 'undefined')
                response.picture = chrome.extension.getURL("img/nopicture.png");
            else
                response.picture = response.photo.image_128x128;
            success(response);
        }, failure, options);
    };

    this.getWorkspaceProjects = function (success, failure, options) {
        if(typeof options === 'undefined' || typeof options.workspace_id === 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/projects";
        options.query = {opt_fields: "name,archived,notes,public"};

        this.api(success, failure, options);
    };

    this.getWorkspaceTags = function (success, failure, options) {
        if(typeof options === 'undefined' || typeof options.workspace_id === 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/tags";
        options.query = {opt_fields: "name,notes"};

        this.api(success, failure, options);
    };

    this.getUserData = function (success, failure, options) {
        if(typeof options === "undefined")
            options = {};
        options.method = "GET";
        options.path = "users/me";
        options.query = {opt_fields: "name,email,photo.image_128x128"};

        this.api(function (response) {
            if (typeof response.photo === 'undefined')
                response.picture = chrome.extension.getURL("img/nopicture.png");
            else
                response.picture = response.photo.image_128x128;
            success(response);
        }, failure, options);
    };

    this.createTask = function (success, failure, options) {
        if(typeof options === 'undefined')
            options = {};
        options.method = "POST";
        options.path = "tasks";
        this.api(success, failure, options);
    };

    this.createNewTag = function (success, failure, options) {
        if(typeof options == 'undefined')
            options = {};
        options.method = "POST";
        options.path = "tags";
        this.api(success, failure, options);
    };

    this.createNewProject = function (success, failure, options) {
        if(typeof options == 'undefined')
            options = {};
        options.method = "POST";
        options.path = "projects";
        this.api(success, failure, options);
    };

    this.getTasks = function (success, failure, options) {
        if(typeof options == 'undefined')
            options = {};
        options.method = "GET";
        options.path = "tasks";
        options.query.opt_fields = "name,due_at,due_on,completed,tags,projects";
        options.query.completed_since = "now";
        this.api(success, failure, options);
    };

    this.getTask = function (success, failure, options) {
        if(typeof options == 'undefined')
            options = {};
        if(typeof options.task_id == 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "GET";
        options.path = "tasks/" + options.task_id;
        this.api(success, failure, options);
    };

    this.taskDone = function (success, failure, options) {
        if(typeof options == 'undefined')
            options = {};
        if(typeof options.task_id == 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "PUT";
        options.path = "tasks/" + options.task_id;
        options.query = {completed: options.completed};
        this.api(success, failure, options);
    };

    this.getTaskStories = function (success, failure, options) {
        if(typeof options == 'undefined')
            options = {};
        if(typeof options.task_id == 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "GET";
        options.path = "tasks/" + options.task_id + "/stories";
        options.query = {opt_fields: "type,text,created_at,created_by.name,created_by.email,created_by.photo.image_128x128"};

        this.api(success, failure, options);
    };

    this.addComment = function (success, failure, options) {
        if(typeof options == 'undefined')
            options = {};
        if(typeof options.task_id == 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "POST";
        options.path = "tasks/" + options.task_id + "/stories";
        options.data = {
            text: options.commentText
        };
        this.api(success, failure, options);
    };

    this.updateTask = function (success, failure, options) {
        if(typeof options == 'undefined')
            options = {};
        if(typeof options.task_id == 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "PUT";
        options.path = "tasks/" + options.task_id;
        this.api(success, failure, options);
    };

    //called by others
    this.api = function (success, failure, options) {
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

        var url = Asana.getBaseApiUrl() + options.path + "?" + queryParams;
        $http({
            method: options.method,
            url: url,
            respondType: 'json',
            headers: options.headers || {},
            params: options.params || {},
            data: {data: options.data, options: asanaOptions}
        }).then(function (response) {
            if(response.data.data){
                var result = response.data.data;
                if(response.next_page){
                    result.offset = response.next_page.offset;
                }
                success(result);
            }
        }, function (response) {
            if (!failure) {failure = console.log;}
            var message = "";
            if(response.status == 401){
                Asana.setLoggedIn(false);
                message = response.data.errors[0].message;
            } else if(response.status == -1 && response.data){
                message = response.data.errors[0].message;
            } else{
                message = "ERR_INTERNET_DISCONNECTED";
            }
            failure({"error": "SERVER_ERROR", message: message});
        });
    };
}]);