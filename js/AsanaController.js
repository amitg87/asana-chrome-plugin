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

asanaModule.controller("createTaskController", ['$scope', 'AsanaGateway', '$timeout', 'AsanaConstants', '$filter', 'ChromeExtensionService', 'StorageService',
    function ($scope, AsanaGateway, $timeout, AsanaConstants, $filter, ChromeExtensionService, StorageService) {
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

    createTaskCtrl.clearNameDescription = function () {
        StorageService.setString("name", "");
        StorageService.setString("description", "");
    }

    createTaskCtrl.clearSaved = function () {
        StorageService.clearArray("project");
        StorageService.clearArray("tag");
        StorageService.clearArray("follower");
    }

    createTaskCtrl.clearFields();

    createTaskCtrl.onProjectDeselected = function(item, model) {
        StorageService.removeFromArray("project", item.id);
    }

    createTaskCtrl.onProjectSelected = function (item, model) {
        createTaskCtrl.projectRequired = false;
        StorageService.addToArray("project", item.id);
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
        StorageService.setString("workspace", createTaskCtrl.selectedWorkspaceId);
        createTaskCtrl.workspaceNotSelected = false;

        createTaskCtrl.taskName = StorageService.getString("name");
        createTaskCtrl.taskNotes = StorageService.getString("description");

        AsanaGateway.getWorkspaceTags({workspace_id: createTaskCtrl.selectedWorkspaceId}).then(function (response) {
            createTaskCtrl.tags = response;
            if(AsanaConstants.getRememberTag()) {
                var oldTags = StorageService.getArray("tag");
                if(angular.isDefined(oldTags)) {
                    createTaskCtrl.tags.forEach(tag => {
                        var found = oldTags.find(oldTag => {
                            return tag.id == oldTag;
                        });
                        if(found) {
                            createTaskCtrl.selectedTags.list.push(tag);
                        }
                    });
                }
            }
        });

        AsanaGateway.getWorkspaceUsers({workspace_id: createTaskCtrl.selectedWorkspaceId}).then(function (response) {
            createTaskCtrl.users = response;
            if(AsanaConstants.getRememberFollower()) {
                var oldFollowers = StorageService.getArray("follower");
                if(angular.isDefined(oldFollowers)) {
                    createTaskCtrl.users.forEach(user => {
                        var found = oldFollowers.find(oldFollower => {
                            return user.id == oldFollower;
                        });
                        if(found) {
                            createTaskCtrl.selectedFollowers.list.push(user);
                        }
                    });
                }
            }
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
            createTaskCtrl.selectedProject = { list: [] };
            if(AsanaConstants.getRememberProject()) {
                var oldProjects = StorageService.getArray("project");
                if(angular.isDefined(oldProjects)) {
                    createTaskCtrl.projects.forEach(project => {
                        var found = oldProjects.find(oldProject => {
                            return project.id == oldProject;
                        });
                        if(found) {
                            createTaskCtrl.selectedProject.list.push(project);
                        }
                    });
                }
            }
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
            createTaskCtrl.clearNameDescription();

            var containerId = (response.projects[0])? response.projects[0].id: (response.tags[0])? response.tags[0].id: (response.assignee)? response.assignee.id: 0;
            var taskId = response.id;
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
                return workspace.id == lastUsedWorkspaceId;
            });
            if(!angular.isDefined(lastUsedWorkspace)) {
                lastUsedWorkspace = response[0];
            }
            createTaskCtrl.selectedWorkspace = lastUsedWorkspace;
            createTaskCtrl.selectedWorkspace.selected = lastUsedWorkspace;
            createTaskCtrl.onWorkspaceSelect(lastUsedWorkspace, lastUsedWorkspace);
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

    createTaskCtrl.onTagSelected = function (item, model) {
        StorageService.addToArray("tag", item.id);
        if(item.isTag){
            var tagRef = item;
            var options = {data: {}};
            options.data.workspace = createTaskCtrl.selectedWorkspaceId;
            options.data.name = item.name;
            AsanaGateway.onTagSelected(options).then(function (response) {
                tagRef.id = response.id; //update created tag with new id
                //tags.push({"id": response.id, "name": response.name, "notes": response.notes}); //update taglist
            }).catch(function (response) {
                console.log("Create tag failed: " + JSON.stringify(response));
            });
        }
    };

    createTaskCtrl.onTagDeselected = function(item, model) {
        StorageService.removeFromArray("tag", item.id);
    }

    createTaskCtrl.projectTaggingHandler = function (input) {
        var lowInput = input.toLowerCase();
        for(var i=0; i<createTaskCtrl.projects.length; i++){
            if(createTaskCtrl.projects[i].name.toLowerCase().indexOf(lowInput)>=0){
                return createTaskCtrl.projects[i];
            }
        }
        return { id: 1, name: input, notes: '', prompt: "(new project)", public: true};
    };

    createTaskCtrl.onFollowerSelected = function (item, model) {
        StorageService.addToArray("follower", item.id);
    };

    createTaskCtrl.onFollowerDeselected = function (item, model) {
        StorageService.removeFromArray("follower", item.id);
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
        console.log("copied to clipboard");
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
    }).catch(function (response) {
        console.log("AsanaNG Error: "+response[0].message);
    });

    AsanaGateway.getWorkspaces().then(function (response) {
        tasksCtrl.workspaces = response;
        if(angular.isDefined(response) && response.length > 0){
            var lastUsedWorkspaceId = StorageService.getString("workspace") || 0;
            var lastUsedWorkspace = response.find(function(workspace){
                return workspace.id == lastUsedWorkspaceId;
            });
            if(!angular.isDefined(lastUsedWorkspace)) {
                lastUsedWorkspace = response[0];
            }
            tasksCtrl.selectedWorkspace = lastUsedWorkspace;
            tasksCtrl.selectedWorkspace.selected = lastUsedWorkspace;
            tasksCtrl.onWorkspaceSelect(lastUsedWorkspace, lastUsedWorkspace);
        }
    }).catch(function (response) {
        console.log("AsanaNG Error: "+JSON.stringify(response));
    });

    tasksCtrl.onWorkspaceSelect = function (item, model) {
        tasksCtrl.selectedWorkspaceId = tasksCtrl.selectedWorkspace.selected.id;
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
        return { id: 1, name: input, notes: '', prompt: "(new tag)" };
    };

    tasksCtrl.onTagSelected = function (item, model, callback) {
        if(item.isTag){
            var options = {data: {}};
            options.data.workspace = tasksCtrl.selectedWorkspaceId;
            options.data.name = item.name;
            AsanaGateway.onTagSelected(options).then(function (response) {
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
            tasksCtrl.fetchTasks();
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
        if(!tasksCtrl.selectedWorkspace.selected) {
            return;
        }
        switch (tasksCtrl.filterTask){
            case "filterMyTasks":
                options.query.workspace = tasksCtrl.selectedWorkspace.selected.id;
                options.query.assignee = "me";
                break;
            case "filterProjectTasks":
                if(!tasksCtrl.filterProject.selected) {
                    return;
                }
                options.query.project = tasksCtrl.filterProject.selected.id;
                break;
            case "filterTagsTasks":
                if(!tasksCtrl.filterTag.selected){
                    return;
                }
                options.query.tag = tasksCtrl.filterTag.selected.id;
                break;
        }
        AsanaGateway.getTasks(options).then(function (response) {
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
        tasksCtrl.onTagSelected(item, model, function () {
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

    tasksCtrl.toggleLiked = function (current_liked) {
        var option = {
            task_id: tasksCtrl.selectedTaskId,
            data: {
                liked: !current_liked
            }
        };
        tasksCtrl.updateTask(option).then(function(response) {
            tasksCtrl.taskDetails.liked = response.liked;
            tasksCtrl.taskDetails.likes = response.likes;
        }).catch(function () {
            console.log("Error hearting task");
        });
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
