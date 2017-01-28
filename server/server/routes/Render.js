"use strict";
var Render;
(function (Render) {
    function withUser(req, res, loc, data = {}) {
        const sendData = data;
        sendData['user'] = req.user;
        res.render(loc, sendData);
    }
    Render.withUser = withUser;
    function error(req, res, err) {
        res.render("error", {
            user: req.user,
            error: err
        });
    }
    Render.error = error;
})(Render = exports.Render || (exports.Render = {}));
