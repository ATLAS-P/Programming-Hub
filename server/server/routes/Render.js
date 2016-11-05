"use strict";
var Render;
(function (Render) {
    function withUser(req, res, loc) {
        res.render(loc, {
            user: req.user
        });
    }
    Render.withUser = withUser;
    function groupDetails(req, res, loc, data) {
        res.render(loc, {
            user: req.user,
            a_open: data.openAssignments,
            a_close: data.closedAssignments,
            a_done: data.doneAssignments,
            group: {
                id: data.id,
                name: data.name
            }
        });
    }
    Render.groupDetails = groupDetails;
    function file(req, res, loc, data) {
        res.render(loc, {
            user: req.user,
            file: data
        });
    }
    Render.file = file;
    function groupsOverview(app, loc, data, success, fail) {
        render(app, loc, {
            groups: data
        }, success, fail);
    }
    Render.groupsOverview = groupsOverview;
    function users(app, loc, data, success, fail) {
        render(app, loc, {
            users: data
        }, success, fail);
    }
    Render.users = users;
    function files(app, loc, data, success, fail) {
        render(app, loc, {
            files: data
        }, success, fail);
    }
    Render.files = files;
    function render(app, loc, data, success, fail) {
        app.render(loc, data, (err, suc) => {
            if (err)
                fail(err);
            else
                success(suc);
        });
    }
    Render.render = render;
    function results(app, loc, data, success, fail) {
        render(app, loc, {
            tests: data
        }, success, fail);
    }
    Render.results = results;
})(Render = exports.Render || (exports.Render = {}));
//# sourceMappingURL=Render.js.map