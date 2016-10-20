//needs major cleanups splitting up etc..

declare var $
declare var io

var socket = io()
let project: string
let assignment: string

let bestResult: Response
let hasStudents = false
let canSubmit = false

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
    if ($("#miniprojects").get().length) socket.emit('getMiniprojects')
    else {
        $("date").each(function () { setupDate($(this)) })
        $("date").hover(function () { dateFormat(false, $(this)) }, function() { dateFormat(true, $(this)) })
    }
    socket.on('setMiniprojects', setMiniprojects)
    socket.on('setPartners', setOtherStudents)

    $('#switchProject').click(stopGrade)
    $('#clearAllFiles').click(removeResults)
    $('#submitResult').click(submitResult)
    $('#finalizeResult').click(finalizeResult)

    $("#partners").change(partnersChanged).change();

    $('#profileImageID').text(getInitials())
    $('#profileImageID').css("background-color", intToRGB(hashCode(getName())))

    $("#cencelSubmit").click(cencelSubmit)
}

function href(to: string) {
    document.location.href = to
}

function setupDate(jq) {
    console.log(jq)

    let date = new Date(jq.text())
    let format = jq.attr('format')

    jq.attr("full", date)
    jq.text(format == "in" ? dateTillNow(date) : simpleDate(date))
}

function dateFormat(def:boolean, jq) {
    let date = new Date(jq.attr("full"))
    let format = jq.attr('format')
    console.log("hello")
    if (def) {
        jq.text(format == "in" ? dateTillNow(date) : simpleDate(date))
    } else {
        jq.text(format == "in" ? simpleDate(date) : dateTillNow(date))
    }
}

function hashCode(str:string):number {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return hash;
}

function finalizeResult() {
    $("#projectID").attr('value', project)
    $("#assignmentID").attr('value', assignment)
    $("#groupID").attr('value', (window.location.pathname + window.location.search).split("/")[2])

    $("#finalizeResults").submit()
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
    bestResult = null
}

function showResults(show: boolean) {
    showOrHide("#testResults", show)
}

function showErrorNoPython(show: boolean, message?: string) {
    if(show) $("#errMessage").text(message)
    showOrHide("#errMessage", show)
}

function showOrHide(sel:string, show: boolean) {
    if (show) $(sel).show()
    else $(sel).hide()
}

function getBestResult(r1: Response, r2: Response): Response {
    if (r2 && r1.tests != r2.tests) return null
    else if (!r2 || r1.passed > r2.passed) return r1
    else return r2
}

//cleanups requiered below
function addResult(name: string, response: Response) {
    if (response.success) {
        bestResult = getBestResult(response, bestResult)

        showResults(true)
        showErrorNoPython(false)
        const el = document.createElement("tr")

        function addDataOf(typ: string, data: string, to: HTMLElement) {
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
    } else {
        console.log(response.err)
        showErrorNoPython(true, response.err) //add to results
    }
}

function setMiniprojects(data: Miniprojects) {
    if (data.success) {
        $("#miniprojects").html(data.html)
    } else {
        $("#miniprojects").html(data.err)
    }
    $("date").each(function () { setupDate($(this)) })
    $("date").hover(function () { dateFormat(false, $(this)) }, function () { dateFormat(true, $(this)) })
    $(".group").click(function () { href("group/" + $(this).attr("group")) })
}

function gradeProject(id: string, ass: string, name:string, submit:boolean) {
    project = id
    assignment = ass

    $("#projectid").attr("value", id)

    canSubmit = submit
    if (submit) $("#submitResult").removeClass("disabled")
    else $("#submitResult").addClass("disabled")

    $("#mpname").text("'" + name + "' ")
    $("#assignments").fadeOut(100, () => $("#upload").fadeIn(100))
}

function stopGrade() {
    project = ""

    $("#upload").fadeOut(100, () =>
        $("#assignments").fadeIn(100, () =>
            removeResults()))
}

function submitResult() {
    if (bestResult && canSubmit) {
        $("#upload").fadeOut(100, function () {
            if (!hasStudents) socket.emit("getOtherStudents", (window.location.pathname + window.location.search).split("/")[2])
            $("#studentInfo").fadeIn(100)
        })
        $("#testResults").fadeOut(100)
    }
}

function cencelSubmit() {
    $("#studentInfo").fadeOut(100, function () {
        $("#upload").fadeIn(100)
        $("#testResults").fadeIn(100)
    })
}

function setOtherStudents(res) {
    if (res.success) {
        let old = $("#partners")
        $("#partners").html(res.html)
    } else {
        console.log(res.err)
    }
}

function partnersChanged() {
    const partners = []
    const names = []
    const refs = $("#reflections").get()[0] as HTMLDivElement

    $("#partners option:selected").each(function () {
        partners.push($(this).val())
        names.push($(this).text())
    })

    const none = partners.indexOf("none") >= 0

    console.log(names, partners, none)

    if (none) {
        while (refs.childNodes.length > 1) {
            refs.removeChild(refs.lastChild)
        }
    } else {
        const length = refs.childNodes.length
        for (let i = 1; i < length; i++) {
            let student = refs.children.item(i)
            let index = partners.indexOf(student.getAttribute("student"))

            if (index == -1) {
                refs.removeChild(student)
            } else {
                partners.splice(index, 1)
                names.splice(index, 1)
            }
        }

        partners.forEach(function (val: string, index: number) {
            refs.appendChild(mkReflectionArea(val, names[index]))
        })
    }
}

function mkReflectionArea(id: string, text:string): HTMLDivElement {
    let formGroup = document.createElement("div")
    formGroup.classList.add("form-group", "reflection")
    formGroup.setAttribute("student", id)

    let label = document.createElement("label")
    label.setAttribute("for", id)
    label.textContent = text
    formGroup.appendChild(label)

    let area = document.createElement("textarea")
    area.classList.add("form-control")
    area.setAttribute("maxlength", "500")
    area.setAttribute("rows", "5")
    area.setAttribute("name", id)
    area.setAttribute("placeholder", "Please write a short reflection, max 500 characters...")
    formGroup.appendChild(area)

    return formGroup
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

function dateTillNow(date: Date): string {
    console.log(date)
    let now = new Date()

    let time: number = Math.abs((date as any) - (now as any))
    time = time / 1000
    let str = ""

    if (time > 3600 * 24 * 365) {
        let years = Math.floor(time / (3600 * 24 * 365))
        let days = Math.floor((time - (years * 3600 * 24 * 365)) / (3600 * 24))
        str += years + " years and " + days + " days"
    } else if (time > 3600 * 24) {
        let days = Math.floor(time / (3600 * 24))
        let hours = Math.floor((time - (days * 3600 * 24)) / (3600))
        str += days + " days and " + hours + " hours"
    } else if (time > 3600) {
        let hours = Math.floor(time / (3600))
        let minutes = Math.floor((time - (hours * 3600)) / (60))
        str += hours + " hours and " + minutes + " minutes"
    } else {
        let minutes = Math.floor(time / 60)
        let seconds = Math.floor(time - (minutes * 60))
        str += minutes + " minutes and " + seconds + " seconds"
    }

    if (date < now) str += " ago"
    else str = "in " + str

    return str
}

function simpleDate(date: Date): string {
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
}