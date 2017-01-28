var Hub;
(function (Hub) {
    let count = 2;
    function init() {
        socket.emit('getNonFinalHandIns');
        socket.on('setNonFinalHandIns', setNonFinalHandins);
        socket.on('courseCreated', courseCreated);
        socket.on('courseRemoved', removeCourseDone);
    }
    Hub.init = init;
    function setNonFinalHandins(res) {
        count -= 1;
        if (res.success) {
            $("#nonFinalHandIns").html(res.html);
            $(".acceptNonFinal").click(function () {
                const ass = $(this).parent().attr("assignment");
                socket.emit('handleNonFinal', true, ass);
                $(".nonFinalHandin#" + ass).remove();
                hideAlert();
            });
            $(".declineNonFinal").click(function () {
                const ass = $(this).parent().attr("assignment");
                socket.emit('handleNonFinal', false, ass);
                $(".nonFinalHandin#" + ass).remove();
                hideAlert();
            });
        }
        if (count == 0)
            DateHelper.initDate();
    }
    function hideAlert() {
        if ($(".nonFinalHandin").get().length == 0) {
            $("#nonFinalAlert").remove();
        }
    }
})(Hub || (Hub = {}));
$(document).ready(Hub.init);
function courseCreated(success, error) {
    if (success)
        location.reload();
    else {
        $("#errorContainer").removeClass("hidden");
        $("#errors").html("");
        const li = document.createElement("li");
        li.innerText = error;
        $("#errors").append(li);
    }
}
function createCourse() {
    const errors = [];
    const name = $("#courseName");
    const start = $("#courseStart").parent();
    const end = $("#courseEnd").parent();
    name.parent().removeClass("has-error");
    start.removeClass("has-error");
    end.removeClass("has-error");
    const startDate = start.datepicker("getDate");
    const endDate = end.datepicker("getDate");
    if (name.val().length < 8) {
        name.parent().addClass("has-error");
        errors.push("The course name must be at least 8 characters long!");
    }
    if (!startDate) {
        start.addClass("has-error");
        errors.push("The start date format is incorrect!");
    }
    if (!endDate) {
        end.addClass("has-error");
        errors.push("The end date format is incorrect!");
    }
    if (!!startDate && !!endDate && startDate >= endDate) {
        start.addClass("has-error");
        end.addClass("has-error");
        errors.push("The start date has to be before the end date!");
    }
    $("#errorContainer").addClass("hidden");
    $("#errors").html("");
    if (errors.length > 0) {
        $("#errorContainer").removeClass("hidden");
        errors.forEach(e => {
            const li = document.createElement("li");
            li.innerText = e;
            $("#errors").append(li);
        });
    }
    else {
        socket.emit("createCourse", name.val(), startDate, endDate);
    }
}
function preRemoveCourse(id, name) {
    $("#errorRemoveContainer").addClass("hidden");
    $("#removeCourse").attr("course", id);
    $("#removeCourseName").text(name);
}
function removeCourse() {
    const course = $("#removeCourse").attr("course");
    console.log(course);
    socket.emit("removeCourse", course);
}
function removeCourseDone(success, error) {
    if (success)
        location.reload();
    else {
        $("#errorRemoveContainer").removeClass("hidden");
        $("#errorsRemove").html("");
        const li = document.createElement("li");
        li.innerText = error;
        $("#errorsRemove").append(li);
    }
}
