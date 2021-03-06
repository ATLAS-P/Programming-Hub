let project;
let assignment;
let projectType;
let result;
let bestScript;
let hasStudents = false;
let canSubmit = false;
var Group;
(function (Group) {
    function init() {
        DateHelper.initDate();
        socket.on('setUsersIn', setOtherStudents);
        $('#switchProject').click(stopGrade);
        $('#clearAllFiles').click(removeResults);
        $('#submitResult').click(submitResult);
        $('#finalizeResult').click(finalizeResult);
        $("#partners").change(partnersChanged).change();
        $("#cencelSubmit").click(cencelSubmit);
    }
    Group.init = init;
    function finalizeResult() {
        $("#projectID").attr('value', project);
        $("#projectType").attr('value', projectType);
        $("#assignmentID").attr('value', assignment);
        $("#groupID").attr('value', (window.location.pathname + window.location.search).split("/")[2]);
        let flag = true;
        $('.reflection textarea').each(function () {
            if ($(this).val().length == 0) {
                if (projectType == "auto_code") {
                    flag = false;
                    $(this).parent().addClass('has-error');
                }
                else {
                    $(this).val(" ");
                }
            }
            else {
                $(this).parent().removeClass('has-error');
            }
        });
        if (flag)
            $("#finalizeResults").submit();
    }
    function removeResults() {
        $('#completedTests').html("");
        showResults(false);
        result = null;
    }
    function showResults(show) {
        showOrHide("#testResults", show);
    }
    function showErrorNoPython(show, message) {
        if (show)
            $("#errMessage").text(message);
        showOrHide("#errMessage", show);
    }
    Group.showErrorNoPython = showErrorNoPython;
    function showOrHide(sel, show) {
        if (show)
            $(sel).show();
        else
            $(sel).hide();
    }
    function addDataOf(typ, data, to) {
        const column = document.createElement(typ);
        if (data.toString() == "[object Object]" || data instanceof Object) {
            column.innerText = "no info available";
        }
        else
            column.innerText = data;
        to.appendChild(column);
    }
    function addResult(name, response) {
        if (response.success) {
            result = response;
            bestScript = name;
            showResults(true);
            showErrorNoPython(false);
            $('#completedTests').html(response.html);
        }
        else {
            console.log(response.err);
            showErrorNoPython(true, response.err);
        }
    }
    Group.addResult = addResult;
    function createFailedList(res) {
        const sel = document.createElement("select");
        sel.classList.add("form-control");
        sel.id = "failedTests";
        return sel;
    }
    function uploadFile(id, ass, name, submit, type) {
        projectType = type;
        project = id;
        assignment = ass;
        $("#projectid").attr("value", id);
        canSubmit = submit;
        if (submit)
            $("#submitResult").removeClass("disabled");
        else
            $("#submitResult").addClass("disabled");
        if (type == "auto_code") {
            $("#submitResult").text("Send and write reflection");
            $("#reftitle").text("Reflections");
            $(".refbox").attr("placeholder", "Please write a short reflection, max 500 characters...");
        }
        else {
            $("#submitResult").text("Upload");
            $("#reftitle").text("Additional Comments");
            $(".refbox").attr("placeholder", "Please write any additional comments here, max 500 characters...");
        }
        $("#mpname").text("'" + name + "' ");
        $("#assignments").fadeOut(100, () => $("#upload").fadeIn(100));
    }
    Group.uploadFile = uploadFile;
    function stopGrade() {
        project = "";
        $("#upload").fadeOut(100, () => $("#assignments").fadeIn(100, () => removeResults()));
    }
    function submitResult() {
        if (result && canSubmit) {
            $("#upload").fadeOut(100, function () {
                $("#studentInfo").fadeIn(100);
                if (!hasStudents)
                    socket.emit("getUsersIn", (window.location.pathname + window.location.search).split("/")[2]);
            });
            $("#testResults").fadeOut(100);
        }
    }
    function cencelSubmit() {
        $("#studentInfo").fadeOut(100, function () {
            $("#upload").fadeIn(100);
            $("#testResults").fadeIn(100);
        });
    }
    function setOtherStudents(res) {
        if (res.success) {
            let old = $("#partners");
            $("#partners").html(res.html);
        }
        else {
            console.log(res.err);
        }
    }
    function partnersChanged() {
        const partners = [];
        const names = [];
        const refs = $("#reflections").get()[0];
        $("#partners option:selected").each(function () {
            partners.push($(this).val());
            names.push($(this).text());
        });
        const none = partners.indexOf("none") >= 0;
        console.log(names, partners, none);
        if (none) {
            while (refs.childNodes.length > 1) {
                refs.removeChild(refs.lastChild);
            }
        }
        else {
            const length = refs.childNodes.length;
            for (let i = 1; i < length; i++) {
                let student = refs.children.item(i);
                let index = partners.indexOf(student.getAttribute("student"));
                if (index == -1) {
                    refs.removeChild(student);
                }
                else {
                    partners.splice(index, 1);
                    names.splice(index, 1);
                }
            }
            partners.forEach(function (val, index) {
                refs.appendChild(mkReflectionArea(val, names[index]));
            });
        }
    }
    function mkReflectionArea(id, text) {
        let formGroup = document.createElement("div");
        formGroup.classList.add("form-group", "reflection");
        formGroup.setAttribute("student", id);
        let label = document.createElement("label");
        label.setAttribute("for", id);
        label.classList.add("control-label");
        label.textContent = text;
        formGroup.appendChild(label);
        let area = document.createElement("textarea");
        area.classList.add("form-control");
        area.setAttribute("maxlength", "500");
        area.setAttribute("rows", "5");
        area.setAttribute("id", id);
        area.setAttribute("name", id);
        if (projectType == "auto_code") {
            area.setAttribute("placeholder", "Please write a short reflection, max 500 characters...");
        }
        else {
            area.setAttribute("placeholder", "Please write any additional comments here, max 500 characters...");
        }
        formGroup.appendChild(area);
        return formGroup;
    }
})(Group || (Group = {}));
$(document).ready(Group.init);
