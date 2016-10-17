//needs major cleanups splitting up etc..
var socket = io();
let project;
let bestResult;
let hasStudents = false;
let canSubmit = false;
$(document).ready(init);
function init() {
    if ($("#miniprojects").get().length)
        socket.emit('getMiniprojects');
    else {
        $("date").each(function () { setupDate($(this)); });
        $("date").hover(function () { dateFormat(false, $(this)); }, function () { dateFormat(true, $(this)); });
    }
    socket.on('setMiniprojects', setMiniprojects);
    socket.on('setPartners', setOtherStudents);
    $('#switchProject').click(stopGrade);
    $('#clearAllFiles').click(removeResults);
    $('#submitResult').click(submitResult);
    $("#partners").change(partnersChanged).change();
    $('#profileImageID').text(getInitials());
    $('#profileImageID').css("background-color", intToRGB(hashCode(getName())));
    $("#cencelSubmit").click(cencelSubmit);
}
function href(to) {
    console.log(to);
    document.location.href = to;
}
function setupDate(jq) {
    console.log(jq);
    let date = new Date(jq.text());
    let format = jq.attr('format');
    jq.attr("full", date);
    jq.text(format == "in" ? dateTillNow(date) : simpleDate(date));
}
function dateFormat(def, jq) {
    let date = new Date(jq.attr("full"));
    let format = jq.attr('format');
    console.log("hello");
    if (def) {
        jq.text(format == "in" ? dateTillNow(date) : simpleDate(date));
    }
    else {
        jq.text(format == "in" ? simpleDate(date) : dateTillNow(date));
    }
}
function hashCode(str) {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}
function intToRGB(i) {
    MMath.setRandomSeed(i);
    const rand = () => Math.floor((MMath.random(0, 255) + 32) / 2);
    return "rgb(" + rand() + "," + rand() + "," + rand() + ")";
}
function getInitials() {
    return $('#profileImageID').attr("name").substring(0, 1) +
        $('#profileImageID').attr("family").substring(0, 1);
}
function getName() {
    return $('#profileImageID').attr("family") + " " + $('#profileImageID').attr("name");
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
//cleanups requiered below
function addResult(name, response) {
    if (response.success) {
        bestResult = getBestResult(response, bestResult);
        showResults(true);
        showErrorNoPython(false);
        const el = document.createElement("tr");
        function addDataOf(typ, data, to) {
            const column = document.createElement(typ);
            column.innerText = data;
            to.appendChild(column);
        }
        addDataOf("td", name, el);
        addDataOf("td", response.tests.toString(), el);
        addDataOf("td", response.passed.toString(), el);
        const sel = document.createElement("select");
        sel.classList.add("form-control");
        sel.id = "failedTests";
        response.failed.forEach((val) => addDataOf("option", val, sel));
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
function setMiniprojects(data) {
    if (data.success) {
        $("#miniprojects").html(data.html);
    }
    else {
        $("#miniprojects").html(data.err);
    }
    $("date").each(function () { setupDate($(this)); });
    $("date").hover(function () { dateFormat(false, $(this)); }, function () { dateFormat(true, $(this)); });
    $(".group").click(function () { href("group/" + $(this).attr("group")); });
}
function gradeProject(id, name, submit) {
    project = id;
    canSubmit = submit;
    if (submit)
        $("#submitResult").removeClass("disabled");
    else
        $("#submitResult").addClass("disabled");
    $("#mpname").text("'" + name + "' ");
    $("#assignments").fadeOut(100, () => $("#upload").fadeIn(100));
}
function stopGrade() {
    project = "";
    $("#upload").fadeOut(100, () => $("#assignments").fadeIn(100, () => removeResults()));
}
function submitResult() {
    if (bestResult && canSubmit) {
        $("#upload").fadeOut(100, function () {
            if (!hasStudents)
                socket.emit("getOtherStudents", (window.location.pathname + window.location.search).split("/")[2]);
            $("#studentInfo").fadeIn(100);
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
    let partners = [];
    let names = [];
    $("#partners option:selected").each(function () {
        partners.push($(this).val());
        names.push($(this).text());
    });
    let refs = $("#reflections").get()[0];
    let childs = refs.children;
    for (let i = 1; i < childs.length; i++) {
        let student = childs.item(i);
        let index = partners.indexOf(student.getAttribute("student"));
        if (index == -1) {
            refs.removeChild(student);
        }
        else
            partners.splice(index, 1);
    }
    if (partners.indexOf("none") == -1)
        partners.forEach(function (val, index) {
            refs.appendChild(mkReflectionArea(val, names[index]));
        });
}
function mkReflectionArea(id, text) {
    let formGroup = document.createElement("div");
    formGroup.classList.add("form-group", "reflection");
    formGroup.setAttribute("student", id);
    let label = document.createElement("label");
    label.setAttribute("for", id);
    label.textContent = text;
    formGroup.appendChild(label);
    let area = document.createElement("textarea");
    area.classList.add("form-control");
    area.setAttribute("maxlength", "500");
    area.setAttribute("rows", "5");
    area.setAttribute("name", id);
    area.setAttribute("placeholder", "Please write a short reflection, max 500 characters...");
    formGroup.appendChild(area);
    return formGroup;
}
var MMath;
(function (MMath) {
    var SEED = 0;
    function setRandomSeed(seed) {
        SEED = Math.abs(seed);
    }
    MMath.setRandomSeed = setRandomSeed;
    function random(min = 0, max = 1) {
        SEED = (SEED * 9301 + 49297) % 233280;
        const rnd = SEED / 233280;
        return min + rnd * (max - min);
    }
    MMath.random = random;
})(MMath || (MMath = {}));
function dateTillNow(date) {
    console.log(date);
    let now = new Date();
    let time = Math.abs(date - now);
    time = time / 1000;
    let str = "";
    if (time > 3600 * 24 * 365) {
        let years = Math.floor(time / (3600 * 24 * 365));
        let days = Math.floor((time - (years * 3600 * 24 * 365)) / (3600 * 24));
        str += years + " years and " + days + " days";
    }
    else if (time > 3600 * 24) {
        let days = Math.floor(time / (3600 * 24));
        let hours = Math.floor((time - (days * 3600 * 24)) / (3600));
        str += days + " days and " + hours + " hours";
    }
    else if (time > 3600) {
        let hours = Math.floor(time / (3600));
        let minutes = Math.floor((time - (hours * 3600)) / (60));
        str += hours + " hours and " + minutes + " minutes";
    }
    else {
        let minutes = Math.floor(time / 60);
        let seconds = Math.floor(time - (minutes * 60));
        str += minutes + " minutes and " + seconds + " seconds";
    }
    if (date < now)
        str += " ago";
    else
        str = "in " + str;
    return str;
}
function simpleDate(date) {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}
//# sourceMappingURL=main.js.map