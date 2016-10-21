const socket = io();
$(document).ready(init);
function init() {
    $('#profileImageID').text(getInitials());
    $('#profileImageID').css("background-color", intToRGB(hashCode(getName())));
}
function href(to) {
    document.location.href = to;
}
function hashCode(str) {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}
function intToRGB(i) {
    Random.setRandomSeed(i);
    const rand = () => Math.floor((Random.random(0, 255) + 32) / 2);
    return "rgb(" + rand() + "," + rand() + "," + rand() + ")";
}
function getInitials() {
    return $('#profileImageID').attr("name").substring(0, 1) +
        $('#profileImageID').attr("family").substring(0, 1);
}
function getName() {
    return $('#profileImageID').attr("family") + " " + $('#profileImageID').attr("name");
}
var Random;
(function (Random) {
    var SEED = 0;
    function setRandomSeed(seed) {
        SEED = Math.abs(seed);
    }
    Random.setRandomSeed = setRandomSeed;
    function random(min = 0, max = 1) {
        SEED = (SEED * 9301 + 49297) % 233280;
        const rnd = SEED / 233280;
        return min + rnd * (max - min);
    }
    Random.random = random;
})(Random || (Random = {}));
var DateHelper;
(function (DateHelper) {
    function initDate() {
        $("date").each(function () { setupDate($(this)); });
        $("date").hover(function () { dateFormat(false, $(this)); }, function () { dateFormat(true, $(this)); });
    }
    DateHelper.initDate = initDate;
    function setupDate(jq) {
        let date = new Date(jq.text());
        let format = jq.attr('format');
        jq.attr("full", date);
        jq.text(format == "in" ? DateHelper.dateTillNow(date) : DateHelper.simpleDate(date));
    }
    function dateFormat(def, jq) {
        let date = new Date(jq.attr("full"));
        let format = jq.attr('format');
        console.log("hello");
        if (def) {
            jq.text(format == "in" ? DateHelper.dateTillNow(date) : DateHelper.simpleDate(date));
        }
        else {
            jq.text(format == "in" ? DateHelper.simpleDate(date) : DateHelper.dateTillNow(date));
        }
    }
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
    DateHelper.dateTillNow = dateTillNow;
    function simpleDate(date) {
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    }
    DateHelper.simpleDate = simpleDate;
})(DateHelper || (DateHelper = {}));
//# sourceMappingURL=main.js.map