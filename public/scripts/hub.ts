namespace Hub {
    let count = 2

    export function init() {
        socket.emit('getGroups')
        socket.emit('getNonFinalHandIns')

        socket.on('setGroups', setGroups)
        socket.on('setNonFinalHandIns', setNonFinalHandins)
    }

    function setGroups(res: HtmlResponse) {
        count -= 1

        if (res.success) {
            $("#classes").html(res.html)
            $(".group").click(function () { href("group/" + $(this).attr("group")) })
            
        } else $("#classes").html(res.err)

        if (count == 0) DateHelper.initDate()
    }

    function setNonFinalHandins(res: HtmlResponse) {
        count -= 1

        if (res.success) {
            $("#nonFinalHandIns").html(res.html)
            $(".acceptNonFinal").click(function () {
                const ass = $(this).parent().attr("assignment")
                socket.emit('handleNonFinal', true, ass)
                $(".nonFinalHandin#" + ass).remove()
                hideAlert()
            })
            $(".declineNonFinal").click(function () {
                const ass = $(this).parent().attr("assignment")
                socket.emit('handleNonFinal', false, ass)
                $(".nonFinalHandin#" + ass).remove()
                hideAlert()
            })
        }

        if (count == 0) DateHelper.initDate()
    }

    function hideAlert() {
        if ($(".nonFinalHandin").get().length == 0) {
            $("#nonFinalAlert").remove()
        }
    }
}

$(document).ready(Hub.init)