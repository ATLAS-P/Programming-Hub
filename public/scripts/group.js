//needs major cleanups splitting up etc..
let project;
let assignment;
let bestResult;
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
        $("#assignmentID").attr('value', assignment);
        $("#groupID").attr('value', (window.location.pathname + window.location.search).split("/")[2]);
        let flag = true;
        $('.reflection textarea').each(function () {
            console.log("boe", $(this));
            if ($(this).val().length == 0) {
                flag = false;
                $(this).parent().addClass('has-error');
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
        bestResult = null;
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
    function getBestResult(r1, r2) {
        if (r2 && r1.tests != r2.tests)
            return null;
        else if (!r2 || r1.passed > r2.passed)
            return r1;
        else
            return r2;
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
            bestResult = getBestResult(response, bestResult);
            bestScript = bestResult == response ? name : bestScript;
            showResults(true);
            showErrorNoPython(false);
            const el = document.createElement("tr");
            addDataOf("td", name, el);
            addDataOf("td", response.tests.toString(), el);
            addDataOf("td", response.passed.toString(), el);
            const sel = createFailedList(response);
            const td = document.createElement("td");
            td.appendChild(sel);
            el.appendChild(td);
            $('#completedTests').append(el);
        }
        else {
            console.log(response.err);
            showErrorNoPython(true, response.err); //add to results
        }
    }
    Group.addResult = addResult;
    function createFailedList(res) {
        const sel = document.createElement("select");
        sel.classList.add("form-control");
        sel.id = "failedTests";
        res.failed.forEach((val) => addDataOf("option", val, sel));
        return sel;
    }
    function gradeProject(id, ass, name, submit) {
        project = id;
        assignment = ass;
        $("#projectid").attr("value", id);
        canSubmit = submit;
        if (submit)
            $("#submitResult").removeClass("disabled");
        else
            $("#submitResult").addClass("disabled");
        $("#mpname").text("'" + name + "' ");
        $("#assignments").fadeOut(100, () => $("#upload").fadeIn(100));
    }
    Group.gradeProject = gradeProject;
    function stopGrade() {
        project = "";
        $("#upload").fadeOut(100, () => $("#assignments").fadeIn(100, () => removeResults()));
    }
    function submitResult() {
        if (bestResult && canSubmit) {
            $("#upload").fadeOut(100, function () {
                if (!hasStudents)
                    socket.emit("getUsersIn", (window.location.pathname + window.location.search).split("/")[2]);
                $("#studentInfo").fadeIn(100);
                $("#best_filename").text(bestScript);
                $("#best_total").text(bestResult.tests);
                $("#best_succeeded").text(bestResult.passed);
                const sel = createFailedList(bestResult);
                $("#best_failed").html(sel);
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
        area.setAttribute("placeholder", "Please write a short reflection, max 500 characters...");
        formGroup.appendChild(area);
        return formGroup;
    }
})(Group || (Group = {}));
$(document).ready(Group.init);
//# sourceMappingURL=group.js.map