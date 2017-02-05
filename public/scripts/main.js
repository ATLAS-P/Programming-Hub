const socket = io();
$(document).ready(init);
function init() {
    if ($("#profileImageID").get().length > 0) {
        $('#profileImageID').text(getInitials());
        $('#profileImageID').css("background-color", intToRGB(hashCode(getName())));
    }
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
