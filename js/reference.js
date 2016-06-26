function collectData() {
    /*arrayIterator(User.WORKSPACES.get(), function (workspace) {
     getWorkspace({workspace_id: workspace.id}, log, log)
     });
     getProjects({workspace_id: 42783899288073}, log, log); //workspace: Personel
     getProject({project_id: 42788763054662}, log, log); //project: Driving

     getUsers({workspace_id: 5803881798936}, log, log); //workspace: xx
     getUser({user_id: 42783910289791}, log, log); //user: me

     getTags({workspace_id: 42783899288073}, log, log); //workspace: Peresonel
     getTag({tag_id: 42788763054709}, log, log); //tag: urgent

     getTasksFromTags({tag_id: 42788763054709}, log, log); //tasks marked "Urgent" tag
     getTasksFromProjects({project_id: 42788763054662}, log, log); //task from "Driving" project*/

    /*getTasksFromProjects({project_id: 74445673181106, limit:10}, log, log);
     getTasksFromProjects({project_id: 74445673181106, limit:10, offset:"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJib3JkZXJfcmFuayI6IlZWdThabHJ3VGVxIiwiaWF0IjoxNDUxNDE1MDQ2LCJleHAiOjE0NTE0MTU5NDZ9.ddhOXijVDRhAh3616Cahc_dOa6YZHfsooIqxdXG2GKU"}, log, log);
     */
    /*createTask( {project_id: 74445673181106, name: "api created task", notes: "api created task notes",
     assignee:42783910289791, workspace_id:42783899288073}, log, log);
     updateTask( {task_id: 75302842895401, completed:false}, log, log); //empty strings - changed
     deleteTask( {task_id: }, log, log);*/
    /*getTaskDetails({task_id: 44105625304763}, log, log); //task details: driving: S1
     getTaskStories({task_id: 44105625304763}, log, log); //track activity on a task

     getTasksMine({workspace_id: 42783899288073}, log, log);

     getIncompleteTasksFromProject({project_id: 42788763054662}, log, log);*/
}

function asanaIterator(response, callback){
    if(response.data){
        var entities = response.data;
        for (var key in entities){
            var entity = entities[key];
            callback({id:entity.id, name: entity.name});
        }
    }
}

function arrayIterator(array, callback){
    for(var i=0; i<array.length; i++){
        callback(array[i]);
    }
}

function getTasksFromProjects(request, success, failure){
    request.path = "projects/"+request.project_id+"/tasks";
    Asana.get(request, success, failure);
}

function getIncompleteTasksFromProject(request, success, failure){
    request.path = "projects/"+request.project_id+"/tasks?completed_since=now";
    Asana.get(request, success, failure);
}

function getTasksFromTags(request, success, failure){
    request.path = "tags/"+request.tag_id+"/tasks";
    Asana.get(request, success, failure);
}

function getTaskDetails(request, success, failure){
    request.path = "tasks/" + request.task_id;
    Asana.get(request, success, failure);
}

function getTaskStories(request, success, failure){
    request.path = "tasks/" + request.task_id + "/stories";
    Asana.get(request, success, failure);
}

function createProject(request, success, failure){
    request.path = "workspaces/" + request.workspace_id + "/projects";
    request.data = {
        team: request.team_id,
        name: request.name,
        notes: request.notes
    };
    Asana.post(request, success, failure);
}

function deleteProject(request, success, failure){
    request.path = "projects/" + request.project_id;
    Asana.remove(request, success, failure);
}

function createTask(request, success, failure){
    request.path = "tasks";
    request.data = {
        workspace: request.workspace_id,
        projects: request.project_id,
        name: request.name,
        notes: request.notes,
        assignee: request.assignee
    };
    Asana.post(request, success, failure);
}

function deleteTask(request, success, failure){
    request.path = "tasks/"+request.task_id;
    Asana.remove(request, success, failure);
}

//@todo - name becomes null if not provided
function updateTask(request, success, failure){
    request.path = "tasks/"+request.task_id;
    request.data = {
        completed: request.completed,
        name: request.name,
        notes: request.notes
    };
    Asana.put(request, success, failure);
}