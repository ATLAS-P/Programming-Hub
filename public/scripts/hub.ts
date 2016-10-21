namespace Hub {
    export function init() {
        socket.emit('getGroups')
        socket.on('setGroups', setGroups)
    }

    function setGroups(res: HtmlResponse) {
        if (res.success) {
            $("#classes").html(res.html)
            $(".group").click(function () { href("group/" + $(this).attr("group")) })

            DateHelper.initDate()
        } else $("#classes").html(res.err)
    }
}

$(document).ready(Hub.init)