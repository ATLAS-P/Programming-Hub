//so much redundancy -_-......

$(document).ready(() => {
    socket.on('assignmentCreated', assignmentCreated)
    socket.on('usersGot', usersGot)
    socket.on('usersAdded', addUsersDone)
    socket.on('assignmentRemoved', removeAssignmentDone)
})

function assignmentCreated(success: boolean, error?: string) {
    if (success) location.reload()
    else {
        $("#errorContainer").removeClass("hidden")
        $("#errors").html("")
        const li = document.createElement("li")
        li.innerText = error.toString()
        $("#errors").append(li)
    }
}

function createAssignment(group: string, start: string, end: string) {
    const errors: string[] = []

    const name = $("#assignmentName")
    const type = $("#assignmentType")
    const due = $("#dueDate").parent()
    const link = $("#infoLink")

    name.parent().removeClass("has-error")
    due.removeClass("has-error")
    link.parent().removeClass("has-error")
    type.parent().removeClass("has-error")

    const dueDate = due.datepicker("getDate") as Date
    const assType = type.val()
    const info = link.val()

    if (assType == "autograder") {
        type.parent().addClass("has-error")
        errors.push("The autograder type is not available for now!")
    } else if (assType == "defined" || assType == "open") {
        if (name.val().length < 8) {
            name.parent().addClass("has-error")
            errors.push("The assignment name must be at least 8 characters long!")
        }

        if (assType == "open" && $("#openExists").size() >= 1) {
            type.parent().addClass("has-error")
            errors.push("There can only be one open assignment per course!")
        }

        if (assType == "defined") {
            if (!dueDate) {
                due.addClass("has-error")
                errors.push("The due date format is incorrect!")
            } else {
                const startDate = new Date(start)
                const endDate = new Date(end)

                if (dateDiff(startDate, dueDate) < 0) {
                    due.addClass("has-error")
                    errors.push("The due date cannot be before the start of the course!")
                } else if (dateDiff(dueDate, endDate) < 0) {
                    due.addClass("has-error")
                    errors.push("The due date cannot be after the end of the course!")
                }
            }

            if (info.length > 0 && !validURL(info)) {
                link.parent().addClass("has-error")
                errors.push("The information link seems to be invalid!")
            }
        }
    } else {
        type.parent().addClass("has-error")
        errors.push("The assignment type is invalid!")
    }

    $("#errorContainer").addClass("hidden")
    $("#errors").html("")

    if (errors.length > 0) {
        $("#errorContainer").removeClass("hidden")
        errors.forEach(e => {
            const li = document.createElement("li")
            li.innerText = e
            $("#errors").append(li)
        })
    } else {
        let linkVal: string = link.val()
        linkVal = linkVal.startsWith("http://") ? linkVal.substr(7) : linkVal
        linkVal = linkVal.startsWith("https://") ? linkVal.substr(8) : linkVal
        socket.emit("createAssignment", group, name.val(), assType, dueDate, linkVal)
    }
}

function validURL(str:string) {
    var pattern = new RegExp('^(https?:\\/\\/)?' +
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + 
        '((\\d{1,3}\\.){3}\\d{1,3}))' + 
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + 
        '(\\?[;&a-z\\d%_.~+=-]*)?' + 
        '(\\#[-a-z\\d_]*)?$', 'i')
    if (!pattern.test(str)) return false
    else return true
}

function preRemoveAssignment(id, name) {
    $("#errorRemoveContainer").addClass("hidden")
    $("#removeAssignment").attr("assignment", id)
    $("#removeAssignmentName").text(name)
}

function removeAssignment() {
    const assignment = $("#removeAssignment").attr("assignment")
    socket.emit("removeAssignment", assignment)
}

function removeAssignmentDone(success: boolean, error?: string) {
    if (success) location.reload()
    else {
        $("#errorRemoveContainer").removeClass("hidden")
        $("#errorsRemove").html("")
        const li = document.createElement("li")
        li.innerText = error
        $("#errorsRemove").append(li)
    }
}

function getUsers(users: string) {
    console.log(users)
    console.log(JSON.parse(users))
    if ($("#allUserList").html().length == 0) socket.emit("getUsers", JSON.parse(users))
}

declare function initListGroup(container)
declare function getSelected(container):string[]

function usersGot(users: any[]) {
    $("#allUserList").html("")
    for (let user of users) {
        const li = document.createElement("li")
        li.classList.add("list-group-item")
        li.innerText = user.name + " " + user.surename + " (" + user._id + ")"
        li.setAttribute("value", user._id)
        $("#allUserList").append(li)
    }

    if (users.length == 0) {
        const p = document.createElement("span")
        p.innerText = "There are no available users to add!"
        $("#allUserList").append(p)
    } else initListGroup($("#allUserList"))
}

function addUsers(group:string) {
    $("#errorContainerUser").addClass("hidden")
    const users = getSelected($("#allUserList"))
    if (users.length > 0) {
        const role = $("#userRole").val()
        socket.emit("addUsers", users, group, role)
    } else {
        $("#errorContainerUser").removeClass("hidden")
        $("#errorsUser").html("")
        const li = document.createElement("li")
        li.innerText = "Select at least one user!"
        $("#errorsUser").append(li)
    }
}

function addUsersDone(success: boolean, error?: string) {
    if (success) location.reload()
    else {
        $("#errorContainerUsers").removeClass("hidden")
        $("#errorsUsers").html("")
        const li = document.createElement("li")
        li.innerText = error
        $("#errorsUsers").append(li)
    }
}

function preUploadAssignment(id, name, group, student) {
    const ass = $("#assignmentUploadId")
    ass.text(name)
    ass.attr("assignment", id)
    ass.attr("group", group)
    ass.attr("student", student)
}