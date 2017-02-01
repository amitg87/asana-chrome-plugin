asanaModule.service("AsanaGateway", ["$http", function ($http) {

    this.getWorkspaces = function (success, failure, options) {
        options = options || {};
        options.method = "GET";
        options.path = "workspaces";
        this.api(success, failure, options);
    };

    this.getWorkspaceUsers = function (success, failure, options) {
        options = options || {};
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/users";
        options.query = {opt_fields: "name,email,photo"};

        this.api(success, failure, options);
    };

    this.getWorkspaceProjects = function (success, failure, options) {
        options = options || {};
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/projects";
        options.query = {opt_fields: "name,archived,notes,public"};

        this.api(function (response) {
            //filter - archived projects
            console.log("Workspace project: " + Asana.getHideArchivedProjects());
            var hideArchivedProjects = Asana.getHideArchivedProjects();
            var filtered = response.filter(function (project) {
                return hideArchivedProjects && !project.archived;
            });
            success(filtered);
        }, failure, options);
    };

    this.getWorkspaceTags = function (success, failure, options) {
        options = options || {};
        options.method = "GET";
        options.path = "workspaces/" + options.workspace_id + "/tags";
        options.query = {opt_fields: "name,notes"};

        this.api(success, failure, options);
    };

    this.getUserData = function (success, failure, options) {
        options = options || {};
        options.method = "GET";
        options.path = "users/me";
        options.query = {opt_fields: "name,email,photo"};

        this.api(success, failure, options);
    };

    this.createTask = function (success, failure, options) {
        options = options || {};
        options.method = "POST";
        options.path = "tasks";
        this.api(success, failure, options);
    };

    this.createNewTag = function (success, failure, options) {
        options = options || {};
        options.method = "POST";
        options.path = "tags";
        this.api(success, failure, options);
    };

    this.createNewProject = function (success, failure, options) {
        options = options || {};
        options.method = "POST";
        options.path = "projects";
        this.api(success, failure, options);
    };

    //called by others
    this.api = function (success, failure, options) {
        options.headers = {"X-Requested-With": "XMLHttpRequest", "X-Allow-Asana-Client": "1"};

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
            var message = "";
            if(response.status == 401){
                Asana.setLoggedIn(false);
                message = response.data.errors[0].message;
            } else if(response.status == -1){
                message = "ERR_INTERNET_DISCONNECTED";
            }

            failure({"error": "SERVER_ERROR", message: message})
        });
    }
}]);