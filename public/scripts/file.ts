namespace Files {
    interface Result {
        tests: Object,
        success: boolean,
        passed: number,
        failed: any[]
    }

    interface Grader {
        tests: number,
        fail: string[]
    }

    export function init() {
        DateHelper.initDate()

        $(".acceptNonFinal").click(function () {
            const ass = $(this).parent().attr("assignment")
            socket.emit('handleNonFinal', true, ass)
            $(".nonFinalHandin#" + ass).remove()
            $("#nonFinalAlert").remove()
        })
        $(".declineNonFinal").click(function () {
            const ass = $(this).parent().attr("assignment")
            socket.emit('handleNonFinal', false, ass)
            $(".nonFinalHandin#" + ass).remove()
            $("#nonFinalAlert").remove()
        })
        $("#updateFeadback").click(function () {
            const file = $(this).attr("file")
            const feedback = $("#feedback").val()

            sendFeedback(file, feedback)
        })

        socket.on("setResults", setResults)
        socket.on("feedbacked", doneFeedback)

        const data = JSON.parse($("#displayResults").attr("data"))
        const project = $("#displayResults").attr("project")

        if (data.length > 0) {
            setResult(data, project)
            $("#displayResults").attr("data", "")
        }
    }

    export function setResult(res, project) {
        socket.emit("getResults", res, project)
    }

    function sendFeedback(file: string, feedback: string) {
        socket.emit("updateFeedback", file, feedback)
    }

    function doneFeedback(success: boolean, err?: string) {
        console.log("Feedbacked")
        if (success) {
            $("#feedbackMessage").text("Your feedback has been recoreded")
            $("#feedbackMessage").addClass("success")
            $("#feedbackMessage").removeClass("fail")
        } else {
            $("#feedbackMessage").text(err)
            $("#feedbackMessage").addClass("fail")
            $("#feedbackMessage").removeClass("success")
        }
    }

    function setResults(html: HtmlResponse) {
        if (html.success) {
            $("#displayResults").html(html.html)
        } else {
            $("#displayResults").html(html.err)
        }
    }
}

$(document).ready(Files.init)