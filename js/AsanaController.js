asanaModule.controller("userController", function ($scope, AsanaGateway) {
    $scope.loggedIn = Asana.isLoggedIn();

    AsanaGateway.getUserData(function (response) {
        $scope.user = response;
    });

    $scope.createTab = function (url) {
        chrome.tabs.create({url: url}, function () {
            window.close();
        });
    };

    $scope.isDefined = function (param) {
        return typeof param != 'undefined';
    };

    $scope.navigate = function (url) {

    }
});

asanaModule.controller("createTaskController", function ($scope, AsanaGateway, $timeout) {
    $scope.workspaceNotSelected = true;
    $scope.projectRequired = false;
    $scope.taskNameRequired = false;

    $scope.taskCreationStatus = {
        success: false,
        message: "",
        show: false
    };

    $scope.clearFields = function () {
        $scope.selectedProject = { list: [] };
        $scope.selectedUser = { selected : undefined};
        $scope.selectedTags = {list: []};
        $scope.taskName = undefined;
        $scope.taskNotes = undefined;
        $scope.dueDate = undefined;
        $scope.taskNameRequired = false;
    };

    $scope.clearFields();

    $scope.onProjectSelected = function (item, model) {
        $scope.projectRequired = false;
        if(item.isTag){
            console.log("Creating new project: " + JSON.stringify(item));
            var projRef = item;
            var options = {data: {}};
            options.data.workspace = $scope.selectedWorkspaceId;
            options.data.name = item.name;

            AsanaGateway.createNewProject(function (response) {
                console.log("New project created: " + JSON.stringify(response));
                projRef.id = response.id;
            }, function (response) {
                console.log("New project create failed: " + JSON.stringify(response));
            }, options);
        }
    };

    $scope.onWorkspaceSelect = function (item, model) {
        $scope.selectedWorkspaceId = $scope.selectedWorkspace.selected.id;
        $scope.clearFields();
        $scope.workspaceNotSelected = false;

        AsanaGateway.getWorkspaceTags(function (response) {
            $scope.tags = response;
        }, null, {workspace_id: $scope.selectedWorkspaceId});

        AsanaGateway.getWorkspaceUsers(function (response) {
            $scope.users = response;
        }, null, {workspace_id: $scope.selectedWorkspaceId});

        AsanaGateway.getWorkspaceProjects(function (response) {
            $scope.projects = response;
        }, null, {workspace_id: $scope.selectedWorkspaceId});
    };

    $scope.createTask = function () {
        var options = {data: {}};
        options.data.workspace = $scope.selectedWorkspaceId;
        if($scope.isDefined($scope.selectedUser.selected))
            options.data.assignee = $scope.selectedUser.selected.id;
        if($scope.isDefined($scope.dueDate))
            options.data.due_at = $scope.dueDate.date;

        var projectList = $scope.selectedProject.list;
        if($scope.selectedProject.list.length == 0){
            $scope.projectRequired = true;
            return;
        }
        var projectIds = projectList.map(function (element) {
            return element.id;
        });
        if(projectIds.length > 0){
            options.data.projects = projectIds;
        }

        var taglist = $scope.selectedTags.list;
        var tags = taglist.map(function (element) {
            return element.id;
        });
        if(tags.length > 0){
            options.data.tags = tags;
        }

        if(!$scope.isDefined($scope.taskName)){
            $scope.taskNameRequired = true;
            return;
        }
        options.data.name = $scope.taskName;
        options.data.notes = $scope.taskNotes;

        console.log("Creating task with parameters: " + JSON.stringify(options));
        AsanaGateway.createTask(function (response) {
            console.log("Success: creating task: " + JSON.stringify(response));
            //$scope.selectedWorkspace = {};
            $scope.clearFields();

            $scope.taskCreationStatus = {
                success: true,
                message: "Task created",
                show: true
            };
            $timeout(function () {
                $scope.taskCreationStatus.show = false;
            }, 5000);
        }, function (response) {
            console.log("Error: creating task: " + JSON.stringify(response));
            $scope.taskCreationStatus = {
                success: false,
                message: "Failed to create task", //@todo error message
                show: true
            };
            $timeout(function () {
                $scope.taskCreationStatus.show = false;
            }, 5000);
        }, options);
    };

    AsanaGateway.getWorkspaces(function (response) {
        $scope.workspaces = response;
        if($scope.isDefined(response) && response.length > 0){
            $scope.selectedWorkspace = response[0];
            $scope.selectedWorkspace.selected = response[0];
            $scope.onWorkspaceSelect(response[0], response[0]);
        }
    });

    $scope.tagHandler = function (input){
        var lowInput = input.toLowerCase();
        for(var i=0; i<$scope.tags.length; i++){
            if($scope.tags[i].name.toLowerCase().indexOf(lowInput)>=0){
                return $scope.tags[i];
            }
        }
        return { id: 1, name: input, notes: '', prompt: "(new tag)" }
    };

    $scope.createNewTag = function (item, model) {
        if(item.isTag){
            var tagRef = item;
            //var tags = $scope.tags;
            console.log("Creating new tag: " + JSON.stringify(item));
            var options = {data: {}};
            options.data.workspace = $scope.selectedWorkspaceId;
            options.data.name = item.name;
            AsanaGateway.createNewTag(function (response) {
                console.log("Create tag success: " + JSON.stringify(response));
                tagRef.id = response.id; //update created tag with new id
                //tags.push({"id": response.id, "name": response.name, "notes": response.notes}); //update taglist
            }, function (response) {
                console.log("Create tag failed: " + JSON.stringify(response));
            }, options);
        }
    };

    $scope.projectTaggingHandler = function (input) {
        //console.log($scope.projects);
        var lowInput = input.toLowerCase();
        for(var i=0; i<$scope.projects.length; i++){
            if($scope.projects[i].name.toLowerCase().indexOf(lowInput)>=0){
                return $scope.projects[i];
            }
        }
        return { id: 1, name: input, notes: '', prompt: "(new project)", public: true};
    };

    $scope.createProject = function (item, model) {
        if(item.isTag){
            console.log("Creating new project: " + JSON.stringify(item));
            var options = {data: {}};
            options.data.workspace = $scope.selectedWorkspaceId;
            options.data.name = item.name;

            AsanaGateway.createNewProject(function (response) {
                console.log("New project created: " + JSON.stringify(response));
            }, function (response) {
                console.log("New project failed: " + JSON.stringify(response));
            }, options);
        }
    };

    $scope.copyPage = function () {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
            var tab = tabArray[0];
            $scope.taskName = tab.title;
            $scope.taskNotes = tab.url;
            $scope.taskNameRequired = false;
        });
    }
});

asanaModule.controller("tasksController", function ($scope, AsanaGateway) {
    $scope.selectedView = "Task by Due Date";

    $scope.switchView = function (choice) {
        $scope.selectedView = choice;
    };

    AsanaGateway.getWorkspaces(function (response) {
        $scope.workspaces = response;
        if($scope.isDefined(response) && response.length > 0){
            $scope.selectedWorkspace = response[0];
            $scope.selectedWorkspace.selected = response[0];
            $scope.onWorkspaceSelect(response[0], response[0]);
        }
    });

    $scope.onWorkspaceSelect = function (item, model) {
        $scope.selectedWorkspaceId = $scope.selectedWorkspace.selected.id;
        //fetch tasks here
        var options = {
            workspace_id: $scope.selectedWorkspaceId
        };
        AsanaGateway.getTasks(function (response) {
            $scope.tasks = response;
        }, function () {

        }, options);
    };

    $scope.markTaskDone = function (task_id, task_completed) {
        var taskNextStatus = !task_completed;
        var option = {
            task_id: task_id,
            completed: taskNextStatus
        };
        AsanaGateway.taskDone(function (response) {

        }, function () {
        }, option);
    };
});

asanaModule.controller("taskController", function ($scope, $routeParams, AsanaGateway) {
    $scope.task_id = $routeParams.id;
    $scope.assignee = {selected: undefined};

    console.log("task_id : " + $scope.task_id);
    var options = {
        task_id: $scope.task_id
    };
    AsanaGateway.getTaskStories(function (response) {
        $scope.stories = response;
        console.dir("Stories: " + $scope.stories);
    }, function () {

    }, options);
    AsanaGateway.getTask(function (response) {
        $scope.taskDetails = response;
        console.dir("Task details: " + $scope.taskDetails);
        $scope.assignee.selected = response.assignee;
    }, function () {

    }, options);
});

