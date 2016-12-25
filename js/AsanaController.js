asanaModule.controller("userController", function ($scope, AsanaGateway) {
    $scope.loggedIn = Asana.isLoggedIn();
    $scope.workspaceNotSelected = true;
    $scope.refreshProjectList = false;
    $scope.refreshTagList = false;

    AsanaGateway.getUserData(function (response) {
        $scope.user = response;
    });

    $scope.createTab = function (url) {
        chrome.tabs.create({url: url}, function () {
            window.close();
        });
    };

    AsanaGateway.getWorkspaces(function (response) {
        $scope.workspaces = response;
        if(angular.isDefined(response) && response.length > 0){
            $scope.selectedWorkspace = response[0];
            $scope.selectedWorkspace.selected = response[0];
            $scope.onWorkspaceSelect(response[0], response[0]);
        }
    });

    $scope.onWorkspaceSelect = function (item, model) {
        $scope.selectedWorkspaceId = $scope.selectedWorkspace.selected.id;
        $scope.workspaceNotSelected = false;

        $scope.getWorkspaceTags();
        $scope.getWorkspaceUsers();
        $scope.getWorkspaceProjects();
    };

    $scope.getWorkspaceTags = function () {
        AsanaGateway.getWorkspaceTags(function (response) {
            $scope.tags = response;
        }, null, {workspace_id: $scope.selectedWorkspaceId});
    };

    $scope.getWorkspaceUsers = function () {
        AsanaGateway.getWorkspaceUsers(function (response) {
            $scope.users = response;
        }, null, {workspace_id: $scope.selectedWorkspaceId});
    };

    $scope.getWorkspaceProjects = function () {
        AsanaGateway.getWorkspaceProjects(function (response) {
            $scope.projects = response;
        }, null, {workspace_id: $scope.selectedWorkspaceId});
    };

    $scope.refresh = function () {
        if($scope.refreshProjectList){
            $scope.refreshProjectList = false;
            $scope.getWorkspaceProjects();
        }
        if($scope.refreshTagList){
            $scope.refreshTagList = false;
            $scope.getWorkspaceTags();
        }
    };

    $scope.tagHandler = function (input){
        var lowInput = input.toLowerCase();
        for(var i=0; i<$scope.tags.length; i++){
            if($scope.tags[i].name.toLowerCase().indexOf(lowInput)>=0){
                return $scope.tags[i];
            }
        }
        return { id: 1, name: input, notes: '', prompt: "(new tag)" };
    };

    $scope.createNewTag = function (item, model) {
        if(item.isTag){
            var tagRef = item;
            console.log("Creating new tag: " + JSON.stringify(item));
            var options = {data: {}};
            options.data.workspace = $scope.selectedWorkspaceId;
            options.data.name = item.name;
            AsanaGateway.createNewTag(function (response) {
                console.log("Create tag success: " + JSON.stringify(response));
                tagRef.id = response.id; //update created tag with new id
                $scope.refreshTagList = true;
            }, function (response) {
                console.log("Create tag failed: " + JSON.stringify(response));
            }, options);
        }
    };

    $scope.projectTaggingHandler = function (input) {
        var lowInput = input.toLowerCase();
        for(var i=0; i<$scope.projects.length; i++){
            if($scope.projects[i].name.toLowerCase().indexOf(lowInput)>=0){
                return $scope.projects[i];
            }
        }
        return { id: 1, name: input, notes: '', prompt: "(new project)", public: true};
    };

    $scope.onProjectSelected = function (item, model) {
        if(item.isTag){
            console.log("Creating new project: " + JSON.stringify(item));
            var projRef = item;
            var options = {data: {}};
            options.data.workspace = $scope.selectedWorkspaceId;
            options.data.name = item.name;

            AsanaGateway.createNewProject(function (response) {
                console.log("New project created: " + JSON.stringify(response));
                projRef.id = response.id;
                $scope.refreshProjectList = true;
            }, function (response) {
                console.log("New project create failed: " + JSON.stringify(response));
            }, options);
        }
    };
});

asanaModule.controller("createTaskController", function ($scope, AsanaGateway, $timeout) {
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

    $scope.onWorkspaceSelect = function () {
        $scope.$parent.onWorkspaceSelect();
        $scope.clearFields();
    };

    $scope.createTask = function () {
        var options = {data: {}};
        options.data.workspace = $scope.selectedWorkspaceId;
        if(angular.isDefined($scope.selectedUser.selected))
            options.data.assignee = $scope.selectedUser.selected.id;
        if(angular.isDefined($scope.dueDate))
            options.data.due_at = $scope.dueDate.date;

        var projectList = $scope.selectedProject.list;
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

        if(!angular.isDefined($scope.taskName)){
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
            $scope.refresh();
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

    $scope.copyPage = function () {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
            var tab = tabArray[0];
            $scope.taskName = tab.title;
            $scope.taskNotes = tab.url;
            $scope.taskNameRequired = false;
        });
    };
});

asanaModule.controller("tasksController", function ($scope, AsanaGateway) {
    $scope.selectedView = "Assigned to Me";
    $scope.filterTask = 'filterMyTasks';
    $scope.filterProject = {};
    $scope.filterTag = {};

    $scope.switchView = function (choice, filter) {
        if($scope.selectedView != choice){
            $scope.selectedView = choice;
            $scope.filterTask = filter;
        }
    };

    $scope.fetchTasks = function () {
        //fetch tasks here
        $scope.tasks = [];
        var options = { query: {} };
        switch ($scope.filterTask){
            case "filterMyTasks":
                options.query.workspace = $scope.selectedWorkspace.selected.id;
                options.query.assignee = "me";
                break;
            case "filterProjectTasks":
                options.query.project = $scope.filterProject.selected.id;
                break;
            case "filterTagsTasks":
                options.query.tag = $scope.filterTag.selected.id;
                break;
        }
        AsanaGateway.getTasks(function (response) {
            $scope.tasks = response;
        }, function () {

        }, options);
    };

    $scope.fetchTasks();

    $scope.onProjectSelected = function (item, model) {
        $scope.$parent.onProjectSelected(item, model);
        console.log("filter on project");
        $scope.fetchTasks();
    };

    $scope.onTagSelected = function (item, model) {
        $scope.$parent.createNewTag(item, model);
        console.log("filter on tags");
        $scope.fetchTasks();
    };

    $scope.markTaskDone = function (task_id, task_completed) {
        var taskNextStatus = !task_completed;
        var option = {
            task_id: task_id,
            completed: taskNextStatus
        };
        AsanaGateway.taskDone(function (response) {
            console.log("marked task: " + taskNextStatus);
        }, function () {
            console.log("error");
        }, option);
    };
});

asanaModule.controller("taskController", function ($scope, $routeParams, AsanaGateway) {
    $scope.task_id = $routeParams.id;

    console.log("fetching task details: " + $scope.task_id);
    AsanaGateway.getTaskStories(function (response) {
        console.dir("Stories: " + $scope.stories);
        $scope.activities = response.filter(function (activity) {
            return activity.type === "system";
        });
        $scope.comments = response.filter(function (comment) {
            return comment.type === "comment";
        });
    }, function () {
        console.log("Error fetching task stories");
    }, {task_id: $scope.task_id});

    AsanaGateway.getTask(function (response) {
        $scope.taskDetails = response;
        $scope.taskDetails.due = {
            open: false
        };
        if(response.due_at !== null)
            $scope.taskDetails.due.due_date = new Date(Date.parse(response.due_at));
        else
            $scope.taskDetails.due.due_date = new Date(Date.parse(response.due_on));
        console.dir("Task details: " + JSON.stringify($scope.taskDetails));
    }, function () {
        console.log("Error fetching task details");
    }, {task_id: $scope.task_id});

    $scope.updateName = function () {
        console.log("Updating task name: " + $scope.task_id);
        var options = {
            task_id: $scope.task_id,
            data: {
                name: $scope.taskDetails.name
            }
        };
        $scope.updateTask(options);
    };

    $scope.updateNotes = function () {
        console.log("Updating task name: " + $scope.task_id);
        var options = {
            task_id: $scope.task_id,
            data: {
                notes: $scope.taskDetails.notes
            }
        };
        $scope.updateTask(options);
    };

    $scope.updateDueDate = function () {
        console.log("updateing task due date" + $scope.task_id);
        var options = {
            task_id: $scope.task_id,
            data: {
                due_at: $scope.taskDetails.due.due_date
            }
        };
        $scope.updateTask(options);
    };

    $scope.updateTask = function (options) {
        AsanaGateway.updateTask(function (response) {
            console.log("updated task: " + JSON.stringify(response));
        }, function () {
            console.log("Error occurred updating task");
        }, options);
    };

    $scope.addComment = function () {
        console.log("Adding comment: " + $scope.commentText + " to task_id: " + $scope.task_id);
        AsanaGateway.addComment(function (response) {
            console.log("Added comment: " + JSON.stringify(response));
            $scope.comments.push({
                id: response.id,
                created_at: response.created_at,
                created_by: {
                    "id": $scope.user.id,
                    "name": $scope.user.name,
                    "email": $scope.user.email,
                    "photo": {
                        image_128x128: $scope.user.picture
                    }
                },
                text: $scope.commentText,
                type: "comment"
            });
            $scope.commentText = "";
        }, function () {

        }, {task_id: $scope.task_id, commentText: $scope.commentText});
    };
});

