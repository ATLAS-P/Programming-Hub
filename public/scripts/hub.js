var Hub;
(function (Hub) {
    function init() {
        socket.emit('getGroups');
        socket.on('setGroups', setGroups);
    }
    Hub.init = init;
    function setGroups(res) {
        if (res.success) {
            $("#classes").html(res.html);
            $(".group").click(function () { href("group/" + $(this).attr("group")); });
            DateHelper.initDate();
        }
        else
            $("#classes").html(res.err);
    }
})(Hub || (Hub = {}));
$(document).ready(Hub.init);
//# sourceMappingURL=hub.js.map