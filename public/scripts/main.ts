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

    $('#profileImageID').text(getInitials())
    $('#profileImageID').css("background-color", intToRGB(hashCode(getName())))
}

function hashCode(str:string):number {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function intToRGB(i): string {
    MMath.setRandomSeed(i)
    const rand = () => Math.floor((MMath.random(0, 255) + 32) / 2)
    return "rgb(" + rand() + "," + rand() + "," + rand() + ")"
}

function getInitials(): string {
    return $('#profileImageID').attr("name").substring(0, 1) +
        $('#profileImageID').attr("family").substring(0, 1)
}

function getName(): string {
    return $('#profileImageID').attr("family") + " " + $('#profileImageID').attr("name")        
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

namespace MMath {
    var SEED: number = 0;

    export function setRandomSeed(seed: number) {
        SEED = Math.abs(seed);
    }

    export function random(min: number = 0, max: number = 1): number {
        SEED = (SEED * 9301 + 49297) % 233280;
        const rnd = SEED / 233280;
        return min + rnd * (max - min);
    }
}