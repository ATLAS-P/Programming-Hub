declare var $
declare var io

interface HtmlResponse {
    success: boolean,
    html?: string,
    err?: string
}

const socket = io()

$(document).ready(init)

function init() {
    if ($("#profileImageID").get().length > 0) {
        $('#profileImageID').text(getInitials())
        $('#profileImageID').css("background-color", intToRGB(hashCode(getName())))
    }
}

function href(to: string) {
    document.location.href = to
}

function hashCode(str:string):number {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return hash;
}

function intToRGB(i): string {
    Random.setRandomSeed(i)
    const rand = () => Math.floor((Random.random(0, 255) + 32) / 2)
    return "rgb(" + rand() + "," + rand() + "," + rand() + ")"
}

function getInitials(): string {
    return $('#profileImageID').attr("name").substring(0, 1) +
        $('#profileImageID').attr("family").substring(0, 1)
}

function getName(): string {
    return $('#profileImageID').attr("family") + " " + $('#profileImageID').attr("name")        
}

namespace Random {
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

//namespace DateHelper {
//    export function initDate() {
//        $("date").each(function () { setupDate($(this)) })
//        $("date").hover(function () { dateFormat(false, $(this)) }, function () { dateFormat(true, $(this)) })
//    }

//    function setupDate(jq) {
//        let date = new Date(jq.text())
//        let format = jq.attr('format')

//        jq.attr("full", date)
//        jq.text(format == "in" ? DateHelper.dateTillNow(date) : DateHelper.simpleDate(date))
//    }

//    function dateFormat(def: boolean, jq) {
//        let date = new Date(jq.attr("full"))
//        let format = jq.attr('format')

//        if (def) {
//            jq.text(format == "in" ? DateHelper.dateTillNow(date) : DateHelper.simpleDate(date))
//        } else {
//            jq.text(format == "in" ? DateHelper.simpleDate(date) : DateHelper.dateTillNow(date))
//        }
//    }

//    export function dateTillNow(date: Date): string {
//        let now = new Date()

//        let time: number = Math.abs((date as any) - (now as any))
//        time = time / 1000
//        let str = ""

//        if (time > 3600 * 24 * 365) {
//            let years = Math.floor(time / (3600 * 24 * 365))
//            let days = Math.floor((time - (years * 3600 * 24 * 365)) / (3600 * 24))
//            str += years + " years and " + days + " days"
//        } else if (time > 3600 * 24) {
//            let days = Math.floor(time / (3600 * 24))
//            let hours = Math.floor((time - (days * 3600 * 24)) / (3600))
//            str += days + " days and " + hours + " hours"
//        } else if (time > 3600) {
//            let hours = Math.floor(time / (3600))
//            let minutes = Math.floor((time - (hours * 3600)) / (60))
//            str += hours + " hours and " + minutes + " minutes"
//        } else {
//            let minutes = Math.floor(time / 60)
//            let seconds = Math.floor(time - (minutes * 60))
//            str += minutes + " minutes and " + seconds + " seconds"
//        }

//        if (date < now) str += " ago"
//        else str = "in " + str

//        return str
//    }

//    export function simpleDate(date: Date): string {
//        return date.toLocaleDateString() + " " + date.toLocaleTimeString()
//    }
//}