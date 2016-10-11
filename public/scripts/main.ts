//needs major cleanups

declare var $
declare var io

var socket = io()
let project:string

interface Response {
    success: boolean
    err?: string
    passed?: number
    tests?: number
    failed?: string[]
}

interface Miniprojects {
    success: boolean,
    html?: string,
    err?: string
}

$(document).ready(init)

function init() {
    socket.emit('getMiniprojects')
    socket.on('setMiniprojects', setMiniprojects)

    $('#switchProject').click(stopGrade)
    $('#clearAllFiles').click(removeResults)
}

function removeResults() {
    $('#completedTests').html("")
    showResults(false)
}

function showResults(show: boolean) {
    showOrHide("#testResults", show)
}

function showErrorNoPython(show: boolean) {
    showOrHide("#errMessage", show)
}

function showOrHide(sel:string, show: boolean) {
    if (show) $(sel).show()
    else $(sel).hide()
}

//cleanups requiered below
function addResult(name:string, response: Response) {
    if (response.success) {
        const el = document.createElement("tr")

        function addDataOf(typ:string, data: string, to: HTMLElement) {
            const column = document.createElement(typ)
            column.innerText = data
            to.appendChild(column)
        }

        addDataOf("td", name, el)
        addDataOf("td", response.tests.toString(), el)
        addDataOf("td", response.passed.toString(), el)

        const sel = document.createElement("select")
        sel.classList.add("form-control")
        sel.id = "failedTests"
        response.failed.forEach((val: string) => addDataOf("option", val, sel))
        const td = document.createElement("td")
        td.appendChild(sel)
        el.appendChild(td)

        $('#completedTests').append(el)
    }
}

function setMiniprojects(data: Miniprojects) {
    if (data.success) {
        $("#miniprojects").html(data.html)
    } else {
        $("#miniprojects").html(data.err)
    }
}

function gradeProject(id: string, name:string) {
    project = id

    $("#mpname").text("'" + name + "' ")
    $("#miniprojects").fadeOut(100, () => $("#upload").fadeIn(100))
}

function stopGrade() {
    project = ""

    $("#upload").fadeOut(100, () =>
        $("#miniprojects").fadeIn(100, () =>
            removeResults()))
}

function showGroup(i: number) {
    $(".group:not([gnum=" + i + "])").fadeOut(() => $(".group[gnum=" + i + "]").fadeOut(100), 100)
}