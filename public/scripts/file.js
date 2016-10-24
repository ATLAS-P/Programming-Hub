var Files;
(function (Files) {
    function init() {
        DateHelper.initDate();
        $(".acceptNonFinal").click(function () {
            const ass = $(this).parent().attr("assignment");
            socket.emit('handleNonFinal', true, ass);
            $(".nonFinalHandin#" + ass).remove();
            $("#nonFinalAlert").remove();
        });
        $(".declineNonFinal").click(function () {
            const ass = $(this).parent().attr("assignment");
            socket.emit('handleNonFinal', false, ass);
            $(".nonFinalHandin#" + ass).remove();
            $("#nonFinalAlert").remove();
        });
        setResult(JSON.parse($('#result').attr('data')));
    }
    Files.init = init;
    function setResult(res) {
        if (res.type == 'autograder') {
            setGraderResult(res.data);
        }
    }
    function setGraderResult(res) {
        const p = document.createElement("p");
        p.innerText = "Tests passed: " + (res.tests - res.fail.length) + "/" + res.tests;
        const p2 = document.createElement("p");
        p2.innerText = "Failed tests: " + res.fail.toString().replace(/,/g, ", ");
        $("#result").append(p);
        $("#result").append(p2);
        $("#result").attr("data", "");
    }
})(Files || (Files = {}));
$(document).ready(Files.init);
//# sourceMappingURL=file.js.map