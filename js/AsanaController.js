asanaModule.controller("userController", ["$scope", "AsanaGateway", "AsanaConstants", "ChromeExtensionService", "$route",
    function ($scope, AsanaGateway, AsanaConstants, ChromeExtension, $route) {
    var userCtrl = this;
    userCtrl.$route = $route;
    userCtrl.loggedIn = AsanaConstants.isLoggedIn();

    AsanaGateway.getUserData().then(function (response) {
        userCtrl.user = response;
    }).catch(function (response) {
        console.log("AsanaNG Error: "+response[0].message);
    });

    userCtrl.createTab = function (url) {
        ChromeExtension.openLink(url);
    };

    userCtrl.isActive = function (path) {
        return angular.isDefined(userCtrl.$route.current) && userCtrl.$route.current.activeTab === path;
    };
}]);

asanaModule.controller("createTaskController", ['$scope', 'AsanaGateway', '$timeout', 'AsanaConstants', '$filter',
    function ($scope, AsanaGateway, $timeout, AsanaConstants, $filter) {
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
                return user.id == createTaskCtrl.user.id;
            });
            if(currentUser.length == 1)
                createTaskCtrl.selectedUser.selected = currentUser[0];
        }
    };

    createTaskCtrl.clearFields = function () {
        createTaskCtrl.selectedProject = { list: [] };
        createTaskCtrl.selectedUser = { selected : undefined};
        createTaskCtrl.selectedFollowers = { list : [] };
        createTaskCtrl.setDefaultAssignee();
        createTaskCtrl.selectedTags = {list: []};
        createTaskCtrl.taskName = undefined;
        createTaskCtrl.taskNotes = undefined;
        createTaskCtrl.deadline = undefined;
        createTaskCtrl.deadlineType = AsanaConstants.DEADLINE_TYPE.NONE;
        createTaskCtrl.taskNameRequired = false;
    };

    createTaskCtrl.clearFields();

    createTaskCtrl.onProjectSelected = function (item, model) {
        createTaskCtrl.projectRequired = false;
        if(item.isTag){
            var options = {data: {}};
            options.data.workspace = createTaskCtrl.selectedWorkspaceId;
            options.data.name = item.name;

            AsanaGateway.createNewProject(options).then(function (response) {
                item.id = response.id;
            }).catch(function (response) {
                console.log("New project create failed: " + JSON.stringify(response));
            });
        }
    };

    createTaskCtrl.onWorkspaceSelect = function (item, model) {
        createTaskCtrl.selectedWorkspaceId = createTaskCtrl.selectedWorkspace.selected.id;
        createTaskCtrl.clearFields();
        createTaskCtrl.workspaceNotSelected = false;

        AsanaGateway.getWorkspaceTags({workspace_id: createTaskCtrl.selectedWorkspaceId}).then(function (response) {
            createTaskCtrl.tags = response;
        });

        AsanaGateway.getWorkspaceUsers({workspace_id: createTaskCtrl.selectedWorkspaceId}).then(function (response) {
            // console.log("user list: " + JSON.stringify(response));
            createTaskCtrl.users = response;
        }).then(function () {
            AsanaGateway.getUserData().then(function (response) {
                createTaskCtrl.user = response;
                createTaskCtrl.setDefaultAssignee();
            }).catch(function (response) {
                console.log("AsanaNG Error: "+response[0].message);
            });
        });

        AsanaGateway.getWorkspaceProjects({workspace_id: createTaskCtrl.selectedWorkspaceId}).then(function (response) {
            createTaskCtrl.projects = response;
        });
    };

    createTaskCtrl.createTask = function () {
        var options = {data: {}};
        options.data.workspace = createTaskCtrl.selectedWorkspaceId;
        if(angular.isDefined(createTaskCtrl.selectedUser.selected))
            options.data.assignee = createTaskCtrl.selectedUser.selected.id;
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
            return element.id;
        });
        if(projectIds.length > 0){
            options.data.projects = projectIds;
        }

        var taglist = createTaskCtrl.selectedTags.list;
        var tags = taglist.map(function (element) {
            return element.id;
        });
        if(tags.length > 0){
            options.data.tags = tags;
        }

        var followersList = createTaskCtrl.selectedFollowers.list;
        var followers = followersList.map(function (element) {
            return element.id;
        });
        if(followers.length > 0){
            options.data.followers = followers;
        }

        if(!angular.isDefined(createTaskCtrl.taskName)){
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
            createTaskCtrl.clearFields();

            var containerId = (response.projects[0])? response.projects[0].id: (response.tags[0])? response.tags[0].id: (response.assignee)? response.assignee.id: 0;
            var taskId = response.id;
            createTaskCtrl.taskCreationStatus.success = true;
            createTaskCtrl.taskCreationStatus.message = "Task created";
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
            createTaskCtrl.selectedWorkspace = response[0];
            createTaskCtrl.selectedWorkspace.selected = response[0];
            createTaskCtrl.onWorkspaceSelect(response[0], response[0]);
        }
    }).catch(function (response) {
        console.log("AsanaNG Error: "+JSON.stringify(response));
    });

    createTaskCtrl.tagHandler = function (input){
        var lowInput = input.toLowerCase();
        for(var i=0; i<createTaskCtrl.tags.length; i++){
            if(createTaskCtrl.tags[i].name.toLowerCase().indexOf(lowInput)>=0){
                return createTaskCtrl.tags[i];
            }
        }
        return { id: 1, name: input, notes: '', prompt: "(new tag)" };
    };

    createTaskCtrl.createNewTag = function (item, model) {
        if(item.isTag){
            var tagRef = item;
            var options = {data: {}};
            options.data.workspace = createTaskCtrl.selectedWorkspaceId;
            options.data.name = item.name;
            AsanaGateway.createNewTag(options).then(function (response) {
                tagRef.id = response.id; //update created tag with new id
                //tags.push({"id": response.id, "name": response.name, "notes": response.notes}); //update taglist
            }).catch(function (response) {
                console.log("Create tag failed: " + JSON.stringify(response));
            });
        }
    };

    createTaskCtrl.projectTaggingHandler = function (input) {
        var lowInput = input.toLowerCase();
        for(var i=0; i<createTaskCtrl.projects.length; i++){
            if(createTaskCtrl.projects[i].name.toLowerCase().indexOf(lowInput)>=0){
                return createTaskCtrl.projects[i];
            }
        }
        return { id: 1, name: input, notes: '', prompt: "(new project)", public: true};
    };

    createTaskCtrl.copyPage = function () {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
            var tab = tabArray[0];
            $timeout(function () {
                createTaskCtrl.taskName = tab.title;
                createTaskCtrl.taskNotes = tab.url;
                createTaskCtrl.taskNameRequired = false;
            });
        });
    };
}]);

asanaModule.controller("tasksController", ["$scope", "AsanaGateway", "ChromeExtensionService", "$filter", "AsanaConstants",
    function ($scope, AsanaGateway, ChromeExtension, $filter, AsanaConstants) {
    var tasksCtrl = this;
    tasksCtrl.selectedView = "My Tasks";
    tasksCtrl.filterTask = 'filterMyTasks';
    tasksCtrl.filterProject = {};
    tasksCtrl.filterTag = {};
    tasksCtrl.showTaskManager = true;

    AsanaGateway.getUserData().then(function (response) {
        tasksCtrl.user = response;
    }).catch(function (response) {
        console.log("AsanaNG Error: "+response[0].message);
    });

    AsanaGateway.getWorkspaces().then(function (response) {
        tasksCtrl.workspaces = response;
        if(angular.isDefined(response) && response.length > 0){
            tasksCtrl.selectedWorkspace = response[0];
            tasksCtrl.selectedWorkspace.selected = response[0];
            tasksCtrl.onWorkspaceSelect(response[0], response[0]);
        }
    }).catch(function (response) {
        console.log("AsanaNG Error: "+JSON.stringify(response));
    });

    tasksCtrl.onWorkspaceSelect = function (item, model) {
        tasksCtrl.selectedWorkspaceId = tasksCtrl.selectedWorkspace.selected.id;
        tasksCtrl.workspaceNotSelected = false;

        AsanaGateway.getWorkspaceTags({workspace_id: tasksCtrl.selectedWorkspaceId}).then(function (response) {
            tasksCtrl.tags = response;
        });

        AsanaGateway.getWorkspaceProjects({workspace_id: tasksCtrl.selectedWorkspaceId}).then(function (response) {
            tasksCtrl.projects = response;
        });

        AsanaGateway.getWorkspaceUsers({workspace_id: tasksCtrl.selectedWorkspaceId}).then(function (response) {
            tasksCtrl.users = response;
            tasksCtrl.fetchTasks();
        });
    };

    tasksCtrl.tagHandler = function (input){
        var lowInput = input.toLowerCase();
        for(var i=0; i<tasksCtrl.tags.length; i++){
            if(tasksCtrl.tags[i].name.toLowerCase().indexOf(lowInput)>=0){
                return tasksCtrl.tags[i];
            }
        }
        return { id: 1, name: input, notes: '', prompt: "(new tag)" };
    };

    tasksCtrl.createNewTag = function (item, model, callback) {
        if(item.isTag){
            var options = {data: {}};
            options.data.workspace = tasksCtrl.selectedWorkspaceId;
            options.data.name = item.name;
            AsanaGateway.createNewTag(options).then(function (response) {
                item.id = response.id; //update created tag with new id
                callback();
            }).catch(function (response) {
                console.log("Create tag failed: " + JSON.stringify(response));
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
        return { id: 1, name: input, notes: '', prompt: "(new project)", public: true};
    };

    tasksCtrl.createProject = function (item, model, callback) {
        if(item.isTag){
            var options = {data: {}};
            options.data.workspace = tasksCtrl.selectedWorkspaceId;
            options.data.name = item.name;

            AsanaGateway.createNewProject(options).then(function (response) {
                item.id = response.id;
                callback();
            }).catch(function (response) {
                console.log("New project failed: " + JSON.stringify(response));
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
        }
    };


    tasksCtrl.onProjectSelected = function (item, model) {
        tasksCtrl.fetchTasks();
    };

    tasksCtrl.onTagSelected = function (item, model) {
        tasksCtrl.fetchTasks();
    };

    tasksCtrl.fetchTasks = function () {
        //fetch tasks here
        tasksCtrl.tasks = [];
        var options = { query: {} };
        switch (tasksCtrl.filterTask){
            case "filterMyTasks":
                options.query.workspace = tasksCtrl.selectedWorkspace.selected.id;
                options.query.assignee = "me";
                break;
            case "filterProjectTasks":
                options.query.project = tasksCtrl.filterProject.selected.id;
                break;
            case "filterTagsTasks":
                options.query.tag = tasksCtrl.filterTag.selected.id;
                break;
        }
        AsanaGateway.getTasks(options).then(function (response) {
            response.forEach(function (element, index) {
                tasksCtrl.users.forEach(function (element1, index1) {
                    if(element.assignee !== null && element.assignee.id == element1.id){
                        element.assignee.name = element1.name;
                        element.assignee.photo = element1.photo;
                    }
                });
            });

            tasksCtrl.tasks = response; //response[0].assignee.id -> tasksCtrl.users
        }).catch(function () {
            console.log("Error getting tasks");
        });
    };

    tasksCtrl.onProjectAdd = function (item, model) {
        tasksCtrl.createProject(item, model, function () {
            var options = {
                task_id: tasksCtrl.selectedTaskId,
                project_id: item.id
            };
            AsanaGateway.addProjectToTask(options).then(function () {

            }).catch(function () {
                console.log("could not add project to task");
            });
        });
    };

    tasksCtrl.onProjectRemove = function (item, model) {
        var options = {
            task_id: tasksCtrl.selectedTaskId,
            project_id: item.id
        };
        AsanaGateway.removeProjectFromTask(options).then(function () {

        }).catch(function () {
            console.log("project could not be removed from task");
        });
    };

    tasksCtrl.onTagAdd = function (item, model) {
        tasksCtrl.createNewTag(item, model, function () {
            var options = {
                task_id: tasksCtrl.selectedTaskId,
                tag_id: item.id
            };
            AsanaGateway.addTag(options).then(function () {
            }).catch(function () {
                console.log("Tag add failed");
            });
        });
    };

    tasksCtrl.onTagRemove = function (item, model) {
        var options = {
            task_id: tasksCtrl.selectedTaskId,
            tag_id : item.id
        };

        AsanaGateway.removeTag(options).then(function () {
        }).catch(function () {
            console.log("Tag could not be removed");
        });
    };

    tasksCtrl.onFollowerAdd = function (item, model) {
        var options = {
            task_id: tasksCtrl.selectedTaskId,
            follower_id: item.id
        };
        AsanaGateway.addFollowerToTask(options).then(function () {
        }).catch(function () {
            console.log("failed to add follower");
        });
    };

    tasksCtrl.onFollowerRemove = function (item, model) {
        var options = {
            task_id: tasksCtrl.selectedTaskId,
            follower_id: item.id
        };
        AsanaGateway.removeFollowersFromTask(options).then(function () {
        }).catch(function () {
            console.log("failed to remove follower");
        });
    };

    tasksCtrl.toggleTaskDone = function (task_id, task_completed) {
        var taskNextStatus = !task_completed;
        var option = {
            task_id: task_id,
            completed: taskNextStatus
        };
        AsanaGateway.taskDone(option).then(function (response) {
        }).catch(function () {
            console.log("Error marking task as done");
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
        }).catch(function () {
            console.log("Error fetching task stories");
        });

        AsanaGateway.getTask({task_id: tasksCtrl.selectedTaskId}).then(function (response) {
            tasksCtrl.users.forEach(function (element1, index1) {
                if(response.assignee !== null && response.assignee.id == element1.id){
                    response.assignee.photo = element1.photo;
                }
            });
            tasksCtrl.tasks[tasksCtrl.selectedTaskIndex] = response;
            tasksCtrl.taskDetails = tasksCtrl.tasks[tasksCtrl.selectedTaskIndex];
            tasksCtrl.taskDetails.due = {
                open: false
            };
            var workSpaceId = tasksCtrl.taskDetails.workspace.id;
            var taskId = tasksCtrl.taskDetails.id;
            tasksCtrl.taskDetails.link = "https://app.asana.com/0/" + workSpaceId + "/" + taskId;
            if(response.due_at !== null){
                tasksCtrl.taskDetails.deadline = new Date(Date.parse(response.due_at));
                tasksCtrl.taskDetails.deadlineType = AsanaConstants.DEADLINE_TYPE.DUE_AT;
            }
            else if(response.due_on !== null) {
                tasksCtrl.taskDetails.deadline = new Date(Date.parse(response.due_on));
                tasksCtrl.taskDetails.deadlineType = AsanaConstants.DEADLINE_TYPE.DUE_ON;
            }
            else {
                tasksCtrl.taskDetails.deadlineType = AsanaConstants.DEADLINE_TYPE.NONE;
            }

            console.dir("Task details: " + JSON.stringify(tasksCtrl.taskDetails));
        }).catch(function () {
            console.log("Error fetching task details");
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
                assignee: tasksCtrl.taskDetails.assignee.id
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

    tasksCtrl.updateTask = function (options) {
        return AsanaGateway.updateTask(options).then(function (response) {
            return response;
        }).catch(function () {
            console.log("Error occurred updating task");
        });
    };

    tasksCtrl.addComment = function () {
        AsanaGateway.addComment({task_id: tasksCtrl.selectedTaskId, commentText: tasksCtrl.commentText}).then(function (response) {
            tasksCtrl.comments.push({
                id: response.id,
                created_at: response.created_at,
                created_by: {
                    "id": tasksCtrl.user.id,
                    "name": tasksCtrl.user.name,
                    "email": tasksCtrl.user.email,
                    "photo": tasksCtrl.user.photo
                },
                text: tasksCtrl.commentText,
                type: "comment"
            });
            tasksCtrl.commentText = "";
        }).catch(function (response) {
            console.log("Failed to add comment.");
        });
    };
}]);

asanaModule.controller("utilitiesController", ["$scope", "AsanaGateway", "$timeout", function($scope, AsanaGateway, $timeout) {
    var utilitiesCtrl = this;

    utilitiesCtrl.onPageLoad = function(){
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
            utilitiesCtrl.pageUrl = tabArray[0].url;

            var asanaUrlMatch = /(https:\/\/app\.asana\.com\/0(?:\/inbox|\/search)?\/\d+\/)(\d+)(\/\d+)?/.exec(utilitiesCtrl.pageUrl);
            utilitiesCtrl.containerUrl = asanaUrlMatch? asanaUrlMatch[1]: undefined;
            utilitiesCtrl.taskId = asanaUrlMatch? asanaUrlMatch[2]: undefined;
            utilitiesCtrl.taskStoryId = asanaUrlMatch? asanaUrlMatch[3]: undefined;

            if (utilitiesCtrl.taskId) {
                utilitiesCtrl.getWorkspaceParent();
            }
        });
    };

    utilitiesCtrl.onPageLoad();

    utilitiesCtrl.getWorkspaceParent = function () {
        AsanaGateway.getTaskWorkspaceParent({task_id: utilitiesCtrl.taskId})
        .then(function (response) {
            utilitiesCtrl.taskWorkspace = response.workspace;

            if (response.parent) {
                utilitiesCtrl.parentTask = response.parent;
                utilitiesCtrl.getSiblings();
            } else {
                utilitiesCtrl.parentTask = undefined;
                utilitiesCtrl.clearSubtasks();
            }
        });
    };

    utilitiesCtrl.getSiblings = function () {
        AsanaGateway.getTaskSubtasks({task_id: utilitiesCtrl.parentTask.id})
        .then(function(response){
            if (response) {
                utilitiesCtrl.subtasksArray = response;
                utilitiesCtrl.shiftSubtasks();
            }
        });
    };

    utilitiesCtrl.shiftSubtasks = function () {
        utilitiesCtrl.clearSubtasks();

        var idx = -1, len = utilitiesCtrl.subtasksArray.length;
        for (var i = 0; i < len; i ++) {
            if (utilitiesCtrl.subtasksArray[i].id == utilitiesCtrl.taskId) {
                idx = i;
                break;
            }
        }
        if (idx !== -1) {
            utilitiesCtrl.currentSubtask = utilitiesCtrl.subtasksArray[idx];

            for (var j = 1; idx - j >= 0; j ++) {
                if (!utilitiesCtrl.subtasksArray[idx - j].name.endsWith(':')){
                    utilitiesCtrl.previousSubtask = utilitiesCtrl.subtasksArray[idx - j];
                    break;
                }
            }
            for (var k = 1; idx + k <= len - 1; k ++) {
                if (!utilitiesCtrl.subtasksArray[idx + k].name.endsWith(':')){
                    utilitiesCtrl.nextSubtask = utilitiesCtrl.subtasksArray[idx + k];
                    break;
                }
            }
        }
    };

    utilitiesCtrl.clearSubtasks = function () {
        utilitiesCtrl.currentSubtask = undefined;
        utilitiesCtrl.previousSubtask = undefined;
        utilitiesCtrl.nextSubtask = undefined;
    };

    utilitiesCtrl.executeFuncAfter100ms = function (func) {
        $timeout(function () {
            func();
        }, 100);
    };

    utilitiesCtrl.openParentTask = function () {
        // [array of string].join("") is slower but needed to exclude undefined when concatenating
        chrome.tabs.update({url: [utilitiesCtrl.containerUrl, utilitiesCtrl.parentTask.id, utilitiesCtrl.taskStoryId].join("")}, function(){
            utilitiesCtrl.taskId = utilitiesCtrl.parentTask.id;
            utilitiesCtrl.executeFuncAfter100ms(utilitiesCtrl.onPageLoad);
        });
    };

    utilitiesCtrl.openPreviousSubtask = function () {
        chrome.tabs.update({url: [utilitiesCtrl.containerUrl, utilitiesCtrl.previousSubtask.id, utilitiesCtrl.taskStoryId].join("")}, function(){
            utilitiesCtrl.taskId = utilitiesCtrl.previousSubtask.id;
            utilitiesCtrl.executeFuncAfter100ms(utilitiesCtrl.shiftSubtasks);
        });
    };

    utilitiesCtrl.openNextSubtask = function () {
        chrome.tabs.update({url: [utilitiesCtrl.containerUrl, utilitiesCtrl.nextSubtask.id, utilitiesCtrl.taskStoryId].join("")}, function(){
            utilitiesCtrl.taskId = utilitiesCtrl.nextSubtask.id;
            utilitiesCtrl.executeFuncAfter100ms(utilitiesCtrl.shiftSubtasks);
        });
    };

    utilitiesCtrl.openSelectedSubtask = function() {
        chrome.tabs.update({url: [utilitiesCtrl.containerUrl, utilitiesCtrl.currentSubtask.id, utilitiesCtrl.taskStoryId].join("")}, function(){
            utilitiesCtrl.taskId = utilitiesCtrl.currentSubtask.id;
            utilitiesCtrl.executeFuncAfter100ms(utilitiesCtrl.shiftSubtasks);
        });
    };

    utilitiesCtrl.setParent = function () {
        var options = {
            task_id: utilitiesCtrl.taskId,
            parent_id: utilitiesCtrl.selectedParentTask.selected.id
         };
        AsanaGateway.setParent(options)
        .then(function (response){
            console.log("Added parent: " + JSON.stringify(response));
            utilitiesCtrl.taskUpdateStatus = {
                success: true,
                message: "Task updated",
                show: true,
            };
            utilitiesCtrl.hideUpdateStatusAfterFive();
            utilitiesCtrl.parentTask = utilitiesCtrl.selectedParentTask.selected;
            utilitiesCtrl.executeFuncAfter100ms(utilitiesCtrl.getSiblings);
            utilitiesCtrl.selectedParentTask.selected = undefined;
        }).catch(function (response) {
            console.log('Error adding parent: ' + JSON.stringify(response));
            utilitiesCtrl.taskUpdateStatus = {
                success: false,
                message: "Failed to set parent",
                show: true,
            };
            utilitiesCtrl.hideUpdateStatusAfterFive();
        });
    };

    utilitiesCtrl.updateTypeahead = function (string) {
        var options = {
            workspace_id: utilitiesCtrl.taskWorkspace.id,
            query: string
         };
        AsanaGateway.tasksTypeahead(options)
        .then(function (response){
            utilitiesCtrl.tasksTypeaheadArray = response;
        });
    };

    utilitiesCtrl.notEndsWithColon = function (task) {
        return !task.name.endsWith(":");
    };

    utilitiesCtrl.notSameTask = function (task) {
        return task.id != utilitiesCtrl.taskId;
    };

    utilitiesCtrl.replacePatterns = function () {
        AsanaGateway.getTask({task_id: utilitiesCtrl.taskId})
        .then(function (response) {
            var updatedNote = response.notes;
            for (var i = 0; i < utilitiesCtrl.patternsArray.length; i ++) {
                //https://bugs.chromium.org/p/chromium/issues/detail?id=380964
                var pattern = new RegExp(utilitiesCtrl.patternsArray[i][0], 'gm');
                updatedNote = updatedNote.replace(pattern, utilitiesCtrl.patternsArray[i][1]);
            }
            AsanaGateway.updateTask({task_id: response.id, data: {notes: updatedNote}}
            ).then(function (response) {
                console.log("updated task note: " + JSON.stringify(response));
                utilitiesCtrl.taskUpdateStatus = {
                    success: true,
                    message: "Task updated",
                    show: true,
                };
                utilitiesCtrl.hideUpdateStatusAfterFive();
            }).catch(function () {
                console.log("Error updating task note:" + JSON.stringify(response));
                utilitiesCtrl.taskUpdateStatus = {
                    success: false,
                    message: "Failed to update the task",
                    show: true,
                };
                utilitiesCtrl.hideUpdateStatusAfterFive();
            });
        }).catch(function (response) {
            console.log('Error fetching task details: ' + JSON.stringify(response));
            utilitiesCtrl.taskUpdateStatus = {
                success: false,
                message: "Failed to get task data",
                show: true,
            };
            utilitiesCtrl.hideUpdateStatusAfterFive();
        });
    };

    utilitiesCtrl.hideUpdateStatusAfterFive = function () {
        $timeout(function () {
            utilitiesCtrl.taskUpdateStatus.show = false;
        }, 5000);
    };

    utilitiesCtrl.defaultPatternArray = [
        ['[<"]?([A-Za-z0-9\\-:;/._=+&%?!#@]+)[>"]?\\s[<\\[](mailto:|http://|https://)?\\1[/\\s]*[>\\]]', '$1'],
        ['&b?[rl]?d?quot?;', '\"'],
        ['&([rl]squo|apos);', "\'"],
        ['&[mn]?dash;', "-"]
    ];

    utilitiesCtrl.saveReplacePatterns = function () {
        // using chrome.storage instead of localStorage for easier handling of array
        chrome.storage.local.set({'patternsArray': utilitiesCtrl.patternsArray});
    };

    utilitiesCtrl.setReplaceOnLoad = function () {
        chrome.storage.local.get(null, function (value) {
            utilitiesCtrl.patternsArray = value.patternsArray || utilitiesCtrl.defaultPatternArray;
            utilitiesCtrl.saveReplacePatterns();
        });
    };

    utilitiesCtrl.setReplaceOnLoad();

    utilitiesCtrl.clearPatterns = function () {
        utilitiesCtrl.patternsArray = [];
        utilitiesCtrl.saveReplacePatterns();
    };

    utilitiesCtrl.resetToDefault = function () {
        chrome.storage.local.remove("patternsArray");
        utilitiesCtrl.setReplaceOnLoad();
    };

    utilitiesCtrl.addPattern = function(){
        utilitiesCtrl.patternsArray.push(['', '']);
        utilitiesCtrl.saveReplacePatterns();
    };

    utilitiesCtrl.delPattern = function(idx){
        utilitiesCtrl.patternsArray.splice(idx, 1);
        utilitiesCtrl.saveReplacePatterns();
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

    settingsCtrl.myTasksAlarmOn = AsanaConstants.getMyTasksAlarmOn();
    settingsCtrl.changeMyTasksAlarmOn = function () {
        AsanaConstants.setMyTasksAlarmOn(settingsCtrl.myTasksAlarmOn);
    };
}]);
