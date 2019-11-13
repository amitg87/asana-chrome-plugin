asanaModule.controller("userController", ["$scope", "AsanaGateway", "AsanaConstants", "ChromeExtensionService", "$route",
    function ($scope, AsanaGateway, AsanaConstants, ChromeExtension, $route) {
    var userCtrl = this;
    userCtrl.$route = $route;
    userCtrl.loggedIn = AsanaConstants.isLoggedIn();

    AsanaGateway.getUserData().then(function (response) {
        userCtrl.user = response;
    });

    userCtrl.createTab = function (url) {
        ChromeExtension.openLink(url);
    };

    userCtrl.isActive = function (path) {
        return angular.isDefined(userCtrl.$route.current) && userCtrl.$route.current.activeTab === path;
    };
}]);

asanaModule.controller("createTaskController", ['$scope', 'AsanaGateway', '$timeout', 'AsanaConstants', '$filter', 'ChromeExtensionService', '$q', 'StorageService',
    function ($scope, AsanaGateway, $timeout, AsanaConstants, $filter, ChromeExtensionService, $q, StorageService) {
    var createTaskCtrl = this;
    createTaskCtrl.workspaceNotSelected = true;
    createTaskCtrl.projectRequired = false;
    createTaskCtrl.taskNameRequired = false;

    createTaskCtrl.taskCreationStatus = {
        success: false,
        message: "",
        show: false,
        container_id: null,
        task_id: null
    };

    createTaskCtrl.setDefaultAssignee = function () {
        if(AsanaConstants.getDefaultAssigneeMe() && angular.isDefined(createTaskCtrl.users)){
            var currentUser = createTaskCtrl.users.filter(function (user) {
                return user.gid == createTaskCtrl.user.gid;
            });
            if(currentUser.length == 1)
                createTaskCtrl.selectedUser.selected = currentUser[0];
        }
    };

    createTaskCtrl.init = function (check, storageProperty, allResource, selectedResource) {
        if(check) {
            var saved = StorageService.getArray(storageProperty);
            if(angular.isDefined(saved)) {
                allResource.forEach(item => {
                    var found = saved.find(oldItem => {
                        return item.gid == oldItem; //@todo
                    });
                    if(found) {
                        selectedResource.push(item);
                    }
                });
                var toSave = saved.filter(item => {
                    return selectedResource.find(selected => {
                        return selected.gid == item; //@todo
                    });
                });
                StorageService.initArray(storageProperty, toSave);
            }
        }
    }

    createTaskCtrl.clearFields = function () {
        createTaskCtrl.selectedProject = { list: [] };
        createTaskCtrl.init(AsanaConstants.getRememberProject(), "project", createTaskCtrl.projects, createTaskCtrl.selectedProject.list);

        createTaskCtrl.selectedUser = { selected : undefined};
        createTaskCtrl.setDefaultAssignee();

        createTaskCtrl.selectedFollowers = { list : [] };
        createTaskCtrl.init(AsanaConstants.getRememberFollower(), "follower", createTaskCtrl.users, createTaskCtrl.selectedFollowers.list);

        createTaskCtrl.selectedTags = {list: []};
        createTaskCtrl.init(AsanaConstants.getRememberTag(), "tag", createTaskCtrl.tags, createTaskCtrl.selectedTags.list);

        createTaskCtrl.taskName = StorageService.getString("name");
        createTaskCtrl.taskNotes = StorageService.getString("description");

        createTaskCtrl.deadline = undefined;
        createTaskCtrl.deadlineType = AsanaConstants.DEADLINE_TYPE.NONE;
        createTaskCtrl.taskNameRequired = false;
    };

    createTaskCtrl.clearNameDescription = function () {
        StorageService.setString("name", "");
        StorageService.setString("description", "");
    }

    createTaskCtrl.clearSaved = function () {
        StorageService.clearArray("project");
        StorageService.clearArray("tag");
        StorageService.clearArray("follower");
    }

    createTaskCtrl.onProjectDeselected = function(item, model) {
        StorageService.removeFromArray("project", item.gid);
    }

    createTaskCtrl.onProjectSelected = function (item, model) {
        createTaskCtrl.projectRequired = false;
        if(AsanaConstants.getRememberProject()) {
            StorageService.addToArray("project", item.gid);
        }
        if(item.isTag){
            var options = {data: {}};
            options.data.workspace = createTaskCtrl.selectedWorkspaceId;
            options.data.name = item.name;

            AsanaGateway.createNewProject(options).then(function (response) {
                item.gid = response.gid;
            });
        }
    };

    createTaskCtrl.onWorkspaceSelect = function (item, model) {
        createTaskCtrl.selectedWorkspaceId = createTaskCtrl.selectedWorkspace.selected.gid;
        StorageService.setString("workspace", createTaskCtrl.selectedWorkspaceId);
        createTaskCtrl.workspaceNotSelected = false;

        var promise1 = AsanaGateway.getWorkspaceTags({workspace_id: createTaskCtrl.selectedWorkspaceId}).then(function (response) {
            createTaskCtrl.tags = response;
        });

        var promise2 = AsanaGateway.getWorkspaceUsers({workspace_id: createTaskCtrl.selectedWorkspaceId}).then(function (response) {
            createTaskCtrl.users = response;
        });

        var promise3 = AsanaGateway.getWorkspaceProjects({workspace_id: createTaskCtrl.selectedWorkspaceId}).then(function (response) {
            createTaskCtrl.projects = response;
        });

        var promise4 = AsanaGateway.getUserData().then(function (response) {
            createTaskCtrl.user = response;
        });

        $q.all([promise1, promise2, promise3, promise4]).then(results => {
            createTaskCtrl.clearFields();
        });
    };

    createTaskCtrl.createTask = function () {
        var options = {data: {}};
        options.data.workspace = createTaskCtrl.selectedWorkspaceId;
        if(angular.isDefined(createTaskCtrl.selectedUser.selected))
            options.data.assignee = createTaskCtrl.selectedUser.selected.gid;
        if(angular.isDefined(createTaskCtrl.deadline)){
            if(createTaskCtrl.deadlineType === AsanaConstants.DEADLINE_TYPE.DUE_AT  )
                options.data.due_at = createTaskCtrl.deadline;
            else if(createTaskCtrl.deadlineType === AsanaConstants.DEADLINE_TYPE.DUE_ON)
                options.data.due_on = $filter('date')(createTaskCtrl.deadline, 'yyyy-MM-dd');
        }

        var projectList = createTaskCtrl.selectedProject.list;
        if(createTaskCtrl.selectedProject.list.length === 0 && !AsanaConstants.getProjectOptional()){
            createTaskCtrl.taskCreationStatus.success = false;
            createTaskCtrl.taskCreationStatus.message = "Missing Project";
            createTaskCtrl.taskCreationStatus.show = true;
            $timeout(function () {
                createTaskCtrl.taskCreationStatus.show = false;
            }, 5000);
            createTaskCtrl.projectRequired = true;
            return;
        }
        var projectIds = projectList.map(function (element) {
            return element.gid;
        });
        if(projectIds.length > 0){
            options.data.projects = projectIds;
        }

        var taglist = createTaskCtrl.selectedTags.list;
        var tags = taglist.map(function (element) {
            return element.gid;
        });
        if(tags.length > 0){
            options.data.tags = tags;
        }

        var followersList = createTaskCtrl.selectedFollowers.list;
        var followers = followersList.map(function (element) {
            return element.gid;
        });
        if(followers.length > 0){
            options.data.followers = followers;
        }

        if(!angular.isDefined(createTaskCtrl.taskName) || createTaskCtrl.taskName.trim().length == 0){
            createTaskCtrl.taskCreationStatus.success = false;
            createTaskCtrl.taskCreationStatus.message = "Task name required";
            createTaskCtrl.taskCreationStatus.show = true;
            $timeout(function () {
                createTaskCtrl.taskCreationStatus.show = false;
            }, 5000);
            createTaskCtrl.taskNameRequired = true;
            return;
        }
        options.data.name = createTaskCtrl.taskName;
        options.data.notes = createTaskCtrl.taskNotes;

        AsanaGateway.createTask(options).then(function (response) {
            createTaskCtrl.clearNameDescription();
            createTaskCtrl.clearFields();

            var containerId = (response.projects[0])? response.projects[0].gid: (response.tags[0])? response.tags[0].gid: (response.assignee)? response.assignee.gid: 0;
            var taskId = response.gid;
            createTaskCtrl.taskCreationStatus.success = true;
            createTaskCtrl.taskCreationStatus.message = "Task Created";
            createTaskCtrl.taskCreationStatus.show = true;
            createTaskCtrl.taskCreationStatus.link = "https://app.asana.com/0/" + containerId + "/" + taskId;
            $timeout(function () {
                createTaskCtrl.taskCreationStatus.show = false;
            }, 5000);
        }).catch(function (response) {
            console.log("Error: creating task: " + JSON.stringify(response));
            createTaskCtrl.taskCreationStatus.success = false;
            createTaskCtrl.taskCreationStatus.message = "Failed to create task";
            createTaskCtrl.taskCreationStatus.show = true;
            $timeout(function () {
                createTaskCtrl.taskCreationStatus.show = false;
            }, 5000);
        });
    };

    AsanaGateway.getWorkspaces().then(function (response) {
        createTaskCtrl.workspaces = response;
        if(angular.isDefined(response) && response.length > 0){
            var lastUsedWorkspaceId = StorageService.getString("workspace") || 0;
            var lastUsedWorkspace = response.find(function(workspace){
                return workspace.gid == lastUsedWorkspaceId;
            });
            if(!angular.isDefined(lastUsedWorkspace)) {
                lastUsedWorkspace = response[0];
            }
            createTaskCtrl.selectedWorkspace = lastUsedWorkspace;
            createTaskCtrl.selectedWorkspace.selected = lastUsedWorkspace;
            createTaskCtrl.onWorkspaceSelect(lastUsedWorkspace, lastUsedWorkspace);
        }
    });

    createTaskCtrl.tagHandler = function (input){
        var lowInput = input.toLowerCase();
        for(var i=0; i<createTaskCtrl.tags.length; i++){
            if(createTaskCtrl.tags[i].name.toLowerCase().indexOf(lowInput)>=0){
                return createTaskCtrl.tags[i];
            }
        }
        return { gid: "1", id: 1, name: input, notes: '', prompt: "(new tag)" };
    };

    createTaskCtrl.onTagSelected = function (item, model) {
        if(AsanaConstants.getRememberTag()) {
            StorageService.addToArray("tag", item.gid);
        }
        if(item.isTag){
            var tagRef = item;
            var options = {data: {}};
            options.data.workspace = createTaskCtrl.selectedWorkspaceId;
            options.data.name = item.name;
            AsanaGateway.createNewTag(options).then(function (response) {
                tagRef.gid = response.gid;
            });
        }
    };

    createTaskCtrl.onTagDeselected = function(item, model) {
        StorageService.removeFromArray("tag", item.gid);
    }

    createTaskCtrl.projectTaggingHandler = function (input) {
        var lowInput = input.toLowerCase();
        for(var i=0; i<createTaskCtrl.projects.length; i++){
            if(createTaskCtrl.projects[i].name.toLowerCase().indexOf(lowInput)>=0){
                return createTaskCtrl.projects[i];
            }
        }
        return { gid: "1", id: 1, name: input, notes: '', prompt: "(new project)", public: true};
    };

    createTaskCtrl.onFollowerSelected = function (item, model) {
        if(AsanaConstants.getRememberFollower()) {
            StorageService.addToArray("follower", item.gid);
        }
    };

    createTaskCtrl.onFollowerDeselected = function (item, model) {
        StorageService.removeFromArray("follower", item.gid);
    }

    createTaskCtrl.copyPage = function () {
        ChromeExtensionService.getCurrentTab(function (tab) {
            $timeout(function () {
                createTaskCtrl.taskName = tab.title;
                createTaskCtrl.taskNotes = tab.url;
                createTaskCtrl.taskNameRequired = false;
            });
        });
    };

    createTaskCtrl.successCopy = function () {
        createTaskCtrl.taskCreationStatus.message = "Task Copied";
    };
}]);

asanaModule.controller("tasksController", ["$scope", "AsanaGateway", "ChromeExtensionService", "$filter", "AsanaConstants", "$q", "StorageService",
    function ($scope, AsanaGateway, ChromeExtension, $filter, AsanaConstants, $q, StorageService) {
    var tasksCtrl = this;
    tasksCtrl.selectedView = "My Tasks";
    tasksCtrl.filterTask = 'filterMyTasks';
    tasksCtrl.filterProject = {};
    tasksCtrl.filterTag = {};
    tasksCtrl.showTaskManager = true;

    AsanaGateway.getUserData().then(function (response) {
        tasksCtrl.user = response;
    });

    AsanaGateway.getWorkspaces().then(function (response) {
        tasksCtrl.workspaces = response;
        if(angular.isDefined(response) && response.length > 0){
            var lastUsedWorkspaceId = StorageService.getString("workspace") || 0;
            var lastUsedWorkspace = response.find(function(workspace){
                return workspace.gid == lastUsedWorkspaceId;
            });
            if(!angular.isDefined(lastUsedWorkspace)) {
                lastUsedWorkspace = response[0];
            }
            tasksCtrl.selectedWorkspace = lastUsedWorkspace;
            tasksCtrl.selectedWorkspace.selected = lastUsedWorkspace;
            tasksCtrl.onWorkspaceSelect(lastUsedWorkspace, lastUsedWorkspace);
        }
    });

    tasksCtrl.onWorkspaceSelect = function (item, model) {
        tasksCtrl.selectedWorkspaceId = tasksCtrl.selectedWorkspace.selected.gid;
        StorageService.setString("workspace", tasksCtrl.selectedWorkspaceId);
        tasksCtrl.workspaceNotSelected = false;

        tasksCtrl.filterProject.selected = undefined;
        tasksCtrl.filterTag.selected = undefined;
        tasksCtrl.tasks = [];

        var promise1 = AsanaGateway.getWorkspaceTags({workspace_id: tasksCtrl.selectedWorkspaceId}).then(function (response) {
            tasksCtrl.tags = response;
        });

        var promise2 = AsanaGateway.getWorkspaceProjects({workspace_id: tasksCtrl.selectedWorkspaceId}).then(function (response) {
            tasksCtrl.projects = response;
        });

        var promise3 = AsanaGateway.getWorkspaceUsers({workspace_id: tasksCtrl.selectedWorkspaceId}).then(function (response) {
            tasksCtrl.users = response;
        });

        $q.all([promise1, promise2, promise3]).then(function () {
            if(tasksCtrl.filterTask == 'filterMyTasks'){
                tasksCtrl.fetchTasks();
            }
        });
    };

    tasksCtrl.clearNameDescription = function () {
        StorageService.setString("name", "");
        StorageService.setString("description", "");
    }

    tasksCtrl.clearSaved = function () {
        StorageService.clearArray("project");
        StorageService.clearArray("tag");
        StorageService.clearArray("follower");
    }

    tasksCtrl.tagHandler = function (input){
        var lowInput = input.toLowerCase();
        for(var i=0; i<tasksCtrl.tags.length; i++){
            if(tasksCtrl.tags[i].name.toLowerCase().indexOf(lowInput)>=0){
                return tasksCtrl.tags[i];
            }
        }
        return { gid: "1", id: 1, name: input, notes: '', prompt: "(new tag)" };
    };

    tasksCtrl.onTagSelectedTaskList = function (item, model) {
        tasksCtrl.fetchTasks();
    };

    tasksCtrl.onTagSelected = function (item, model, callback) {
        if(item.isTag){
            var options = {data: {}};
            options.data.workspace = tasksCtrl.selectedWorkspaceId;
            options.data.name = item.name;
            AsanaGateway.onTagSelected(options).then(function (response) {
                item.gid = response.gid; //update created tag with new id
                callback();
            });
        } else {
            callback();
        }
    };

    tasksCtrl.projectTaggingHandler = function (input) {
        var lowInput = input.toLowerCase();
        for(var i=0; i<tasksCtrl.projects.length; i++){
            if(tasksCtrl.projects[i].name.toLowerCase().indexOf(lowInput)>=0){
                return tasksCtrl.projects[i];
            }
        }
        return { gid: "1", id: 1, name: input, notes: '', prompt: "(new project)", public: true};
    };

    tasksCtrl.createProject = function (item, model, callback) {
        if(item.isTag){
            var options = {data: {}};
            options.data.workspace = tasksCtrl.selectedWorkspaceId;
            options.data.name = item.name;

            AsanaGateway.createNewProject(options).then(function (response) {
                item.gid = response.gid;
                callback();
            });
        } else {
            callback();
        }
    };

    tasksCtrl.switchView = function (choice, filter) {
        if(tasksCtrl.selectedView != choice){
            tasksCtrl.tasks = [];
            tasksCtrl.selectedView = choice;
            tasksCtrl.filterTask = filter;
            tasksCtrl.fetchTasks();
        }
    };


    tasksCtrl.onProjectSelected = function (item, model) {
        tasksCtrl.fetchTasks();
    };

    tasksCtrl.fetchTasks = function () {
        //fetch tasks here
        tasksCtrl.tasks = [];
        var options = { query: {} };
        if(!tasksCtrl.selectedWorkspace.selected) {
            return;
        }
        switch (tasksCtrl.filterTask){
            case "filterMyTasks":
                options.query.workspace = tasksCtrl.selectedWorkspace.selected.gid;
                options.query.assignee = "me";
                break;
            case "filterProjectTasks":
                if(!tasksCtrl.filterProject.selected) {
                    return;
                }
                options.query.project = tasksCtrl.filterProject.selected.gid;
                break;
            case "filterTagsTasks":
                if(!tasksCtrl.filterTag.selected){
                    return;
                }
                options.query.tag = tasksCtrl.filterTag.selected.gid;
                break;
        }
        AsanaGateway.getTasks(options).then(function (response) {
            tasksCtrl.tasks = response;
            tasksCtrl.tasks.forEach(task => {
                tasksCtrl.enrichTask(task);
            });
        });
    };

    tasksCtrl.enrichTask = function (task) {
        task.link = "https://app.asana.com/0/" + task.workspace.gid + "/" + task.gid;
        AsanaConstants.setDefaultPictureUser(task.assignee);
        task.due = {
            open: false
        };
        var now = new Date().getTime(); // current time since epoch seconds
        if(task.due_at !== null){
            task.deadline = new Date(Date.parse(task.due_at));
            task.deadlineType = AsanaConstants.DEADLINE_TYPE.DUE_AT;
            task.due = Date.parse(task.due_at);
            task.schedule = $filter('date')(new Date(task.due), 'MMM d hh:mm a');
            task.status = task.due < now? 'overdue':'upcoming';
        }
        else if(task.due_on !== null) {
            task.deadline = new Date(Date.parse(task.due_on));
            task.deadlineType = AsanaConstants.DEADLINE_TYPE.DUE_ON;
            task.due = Date.parse(task.due_on);
            task.schedule = $filter('date')(new Date(task.due), 'MMM d');
            task.status = task.due < now? 'overdue':'upcoming';
        }
        else {
            task.deadlineType = AsanaConstants.DEADLINE_TYPE.NONE;
            task.due = Number.MAX_VALUE;
            task.schedule = "";
        }
    }

    tasksCtrl.onProjectAdd = function (item, model) {
        tasksCtrl.createProject(item, model, function () {
            var options = {
                task_id: tasksCtrl.selectedTaskId,
                project_id: item.gid
            };
            AsanaGateway.addProjectToTask(options).then(function () {

            });
        });
    };

    tasksCtrl.onProjectRemove = function (item, model) {
        var options = {
            task_id: tasksCtrl.selectedTaskId,
            project_id: item.gid
        };
        AsanaGateway.removeProjectFromTask(options).then(function () {

        });
    };

    tasksCtrl.onTagAdd = function (item, model) {
        tasksCtrl.onTagSelected(item, model, function () {
            var options = {
                task_id: tasksCtrl.selectedTaskId,
                tag_id: item.gid
            };
            AsanaGateway.addTag(options).then(function () {

            });
        });
    };

    tasksCtrl.onTagRemove = function (item, model) {
        var options = {
            task_id: tasksCtrl.selectedTaskId,
            tag_id : item.gid
        };

        AsanaGateway.removeTag(options).then(function () {

        });
    };

    tasksCtrl.onFollowerAdd = function (item, model) {
        var options = {
            task_id: tasksCtrl.selectedTaskId,
            follower_id: item.gid
        };
        AsanaGateway.addFollowerToTask(options).then(function () {

        });
    };

    tasksCtrl.onFollowerRemove = function (item, model) {
        var options = {
            task_id: tasksCtrl.selectedTaskId,
            follower_id: item.gid
        };
        AsanaGateway.removeFollowersFromTask(options).then(function () {

        });
    };

    tasksCtrl.isTask = function (taskName) {
        return !taskName.endsWith(":");
    };

    tasksCtrl.showTaskList = function () {
        tasksCtrl.showTaskManager = true;
    };

    tasksCtrl.openInAsana = function (url) {
        ChromeExtension.openLink(url);
    };

    tasksCtrl.showTask = function (taskId, index) {
        tasksCtrl.showTaskManager = false;
        tasksCtrl.selectedTaskId = taskId;
        tasksCtrl.selectedTaskIndex = index;

        AsanaGateway.getTaskStories({task_id: tasksCtrl.selectedTaskId}).then(function (response) {
            tasksCtrl.activities = response.filter(function (activity) {
                return activity.type === "system";
            });
            tasksCtrl.comments = response.filter(function (comment) {
                return comment.type === "comment";
            });
        });

        AsanaGateway.getTask({task_id: tasksCtrl.selectedTaskId}).then(function (response) {
            tasksCtrl.tasks[tasksCtrl.selectedTaskIndex] = response;
            tasksCtrl.taskDetails = tasksCtrl.tasks[tasksCtrl.selectedTaskIndex]; 
            tasksCtrl.enrichTask(tasksCtrl.taskDetails);
        });
    };

    tasksCtrl.updateName = function () {
        var options = {
            task_id: tasksCtrl.selectedTaskId,
            data: {
                name: tasksCtrl.taskDetails.name
            }
        };
        tasksCtrl.updateTask(options);
    };

    tasksCtrl.toggleLiked = function (current_liked) {
        var option = {
            task_id: tasksCtrl.selectedTaskId,
            data: {
                liked: !current_liked
            }
        };
        tasksCtrl.updateTask(option);
    }

    tasksCtrl.updateNotes = function () {
        var options = {
            task_id: tasksCtrl.selectedTaskId,
            data: {
                notes: tasksCtrl.taskDetails.notes
            }
        };
        tasksCtrl.updateTask(options);
    };

    tasksCtrl.updateAssignee = function () {
        var options = {
            task_id: tasksCtrl.selectedTaskId
        };
        if(angular.isDefined(tasksCtrl.taskDetails.assignee)){
            options.data = {
                assignee: tasksCtrl.taskDetails.assignee.gid
            };
        } else {
            options.data = {
                assignee: null
            };
        }
        tasksCtrl.updateTask(options);
    };

    tasksCtrl.updateDeadline = function () {
        var options = {
            task_id: tasksCtrl.selectedTaskId
        };
        switch (tasksCtrl.taskDetails.deadlineType) {
            case AsanaConstants.DEADLINE_TYPE.DUE_ON:
                options.data = {
                    due_on: $filter('date')(tasksCtrl.taskDetails.deadline, 'yyyy-MM-dd'),
                    due_at: null
                };
                break;
            case AsanaConstants.DEADLINE_TYPE.DUE_AT:
                options.data = {
                    due_at: tasksCtrl.taskDetails.deadline,
                    due_on: null
                };
                break;
            default:
                options.data = {
                    due_on: null,
                    due_at: null
                };
                break;
        }
        tasksCtrl.updateTask(options);
    };

    tasksCtrl.setCompleted = function (task_id, task_completed) {
        var option = {
            task_id: task_id,
            query: {
                completed: task_completed
            } 
        };
        AsanaGateway.updateTask(option);
    };

    tasksCtrl.updateTask = function (options) {
        return AsanaGateway.updateTask(options).then(function (response) {
            var keys = ["likes", "liked", "name", "notes", "assignee", "completed", "due_on", "due_at"];
            keys.forEach(key => {
                tasksCtrl.taskDetails[key] = response[key];
            });

            tasksCtrl.enrichTask(tasksCtrl.taskDetails);
            return response;
        });
    };

    tasksCtrl.addComment = function () {
        AsanaGateway.addComment({task_id: tasksCtrl.selectedTaskId, commentText: tasksCtrl.commentText}).then(function (response) {
            tasksCtrl.comments.push({
                id: response.gid,
                created_at: response.created_at,
                created_by: {
                    "id": tasksCtrl.user.gid,
                    "name": tasksCtrl.user.name,
                    "email": tasksCtrl.user.email,
                    "photo": tasksCtrl.user.photo
                },
                text: tasksCtrl.commentText,
                type: "comment"
            });
            tasksCtrl.commentText = "";
        });
    };
}]);

asanaModule.controller("settingsController", ['$scope', 'AsanaConstants', function ($scope, AsanaConstants) {
    var settingsCtrl = this;
    settingsCtrl.hideArchivedProjects = AsanaConstants.getHideArchivedProjects();
    settingsCtrl.changeHideArchivedProjects = function () {
        AsanaConstants.setHideArchivedProjects(settingsCtrl.hideArchivedProjects);
    };

    settingsCtrl.defaultAssigneeMe = AsanaConstants.getDefaultAssigneeMe();
    settingsCtrl.changeDefaultAssigneeMe = function () {
        AsanaConstants.setDefaultAssigneeMe(settingsCtrl.defaultAssigneeMe);
    };

    settingsCtrl.projectOptional = AsanaConstants.getProjectOptional();
    settingsCtrl.changeProjectOptional = function () {
        AsanaConstants.setProjectOptional(settingsCtrl.projectOptional);
    };

    settingsCtrl.rememberProject = AsanaConstants.getRememberProject();
    settingsCtrl.changeRememberProject = function () {
        AsanaConstants.setRememberProject(settingsCtrl.rememberProject);
    };

    settingsCtrl.rememberTag = AsanaConstants.getRememberTag();
    settingsCtrl.changeRememberTag = function () {
        AsanaConstants.setRememberTag(settingsCtrl.rememberTag);
    };

    settingsCtrl.rememberFollower = AsanaConstants.getRememberFollower();
    settingsCtrl.changeRememberFollower = function () {
        AsanaConstants.setRememberFollower(settingsCtrl.rememberFollower);
    };

}]);
