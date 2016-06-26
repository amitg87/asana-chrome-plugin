asanaModule.service("AsanaGateway", ["$http", function ($http) {

    this.getWorkspaces = function (success, failure, options) {
        options = options? options: {};
        options.method = "GET";
        options.path = "workspaces";
        this.api(function (response) {
            success(response);
        }, failure, options);
    };

    this.getWorkspaceUsers = function (success, failure, options) {
        if(typeof options === 'undefined' || typeof options.workspace_id === 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/users?opt_fields=name,email,photo.image_128x128";

        this.api(function (response) {
            if(response.photo == null)
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
        options.path = "workspaces/" + options.workspace_id + "/projects?opt_fields=name,archived";
        this.api(success, failure, options);
    };

    this.getWorkspaceTags = function (success, failure, options) {
        if(typeof options === 'undefined' || typeof options.workspace_id === 'undefined')
            failure({"error": "Missing Parameter", message: "Fix this"});
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/tags";
        this.api(success, failure, options);
    };

    this.getUserData = function (success, failure, options) {
        if(typeof options === "undefined")
            options = {};
        options.method = "GET";
        options.path = "users/me";
        this.api(function (response) {
            if (response.photo == null)
                response.picture = chrome.extension.getURL("img/nopicture.png");
            else
                response.picture = response.photo.image_128x128;
            success(response);
        }, failure, options);
    };

    this.createTask = function (success, failure, options) {
        if(typeof  options === 'undefined')
            options = {};
        options.method = "POST";
        options.path = "tasks";
        this.api(success, failure, options);
    };

    this.getMyTasks = function (success, failure, options) {
        //https://app.asana.com/api/1.0/tasks?assignee=me&workspace=42783899288073&completed_since=now&opt_fields=name,due_at,due_on,completed,tags,projects.name&limit=26
        if(typeof  options === 'undefined')
            options = {};
        options.method = "GET";
        options.path = "tasks?assignee=me&workspace=42783899288073&completed_since=now&opt_fields=name,due_at,due_on,completed,tags,projects.name";
        this.api(function (response) {
            success(response);
        }, failure, options);
    };

    //called by others
    this.api = function (success, failure, options) {
        options.headers = {"X-Requested-With": "XMLHttpRequest", "X-Allow-Asana-Client": "1"};
        var headers = options.headers || {};
        var params = options.params || {};

        var asanaOptions = {};
        if (options.method === "PUT" || options.method === "POST"){
            // Be polite to Asana API and tell them who we are.
            var manifest = chrome.runtime.getManifest();
            var client_name = [
                "chrome-extension",
                chrome.i18n.getMessage("@@extension_id"),
                manifest.version,
                manifest.name
            ].join(":");
            asanaOptions = {client_name: client_name};
        }

        var url = Asana.getBaseApiUrl() + options.path;
        $http({
            method: options.method,
            url: url,
            respondType: 'json',
            headers: headers,
            params: params,
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
            if(response.status == 401){
                Asana.setLoggedIn(false);
            }
            failure({"error": "SERVER_ERROR", message: response.data.errors[0].message})
        });
    }
}]);