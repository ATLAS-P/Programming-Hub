namespace Files {
    interface Result {
        type: String,
        data: Object
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

        setResult(JSON.parse($('#result').attr('data')))
    }

    function setResult(res: Result) {
        if (res.type == 'autograder') {
            setGraderResult(res.data as Grader)
        }
    }

    function setGraderResult(res: Grader) {
        const p = document.createElement("p")
        p.innerText = "Tests passed: " + (res.tests - res.fail.length) + "/" + res.tests

        const p2 = document.createElement("p")
        p2.innerText = "Failed tests: " + res.fail.toString().replace(/,/g, ", ")

        $("#result").append(p)
        $("#result").append(p2)
        $("#result").attr("data", "")
    }
}

$(document).ready(Files.init)