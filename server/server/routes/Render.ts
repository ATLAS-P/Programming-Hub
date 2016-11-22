import {Routes} from './Routes'
import {Groups} from '../../database/tables/Groups'
import {Tables} from '../../database/Table'
import {TestJSON} from '../../autograder/Result'

import * as express from "express"

export namespace Render {
    export type Suc = (html: string) => void
    export type Err = (err: Error) => void

    export function withUser(req: Routes.Req, res: Routes.Res, loc: string, data: {} = {}) {
        const sendData = data
        sendData['user'] = req.user

        res.render(loc, sendData)
    }

    export function error(req: Routes.Req, res: Routes.Res, err:string) {
        res.render("error", {
            user: req.user,
            error: err
        })
    }

    export function groupDetails(req: Routes.Req, res: Routes.Res, loc: string, data: Groups.GroupDetails) {
        console.log(data.admins)
        res.render(loc, {
            user: req.user,
            admin: data.admins.indexOf(req.user.id) >= 0,
            a_open: data.openAssignments,
            a_close: data.closedAssignments,
            a_done: data.doneAssignments,
            group: {
                id: data.id,
                name: data.name
            }
        })
    }

    export function file(req: Routes.Req, res: Routes.Res, loc: string, data: Tables.File, admin:boolean) {
        res.render(loc, {
            user: req.user,
            file: data,
            admin: admin
        })
    }

    export function groupsOverview(app: express.Express, loc: string, data: Groups.GroupOverview[], success: Suc, fail: Err) {
        render(app, loc, {
            groups: data
        }, success, fail)
    }

    export function users(app: express.Express, loc: string, data: Tables.User[], success: Suc, fail: Err) {
        render(app, loc, {
            users: data
        }, success, fail)
    }

    export function files(app: express.Express, loc: string, data: Tables.File[], success: Suc, fail: Err) {
        render(app, loc, {
            files: data
        }, success, fail)
    }

    export function render(app: express.Express, loc: string, data: {}, success: Suc, fail: Err) {
        app.render(loc, data, (err, suc) => {
            if (err) fail(err)
            else success(suc)
        })
    }

    export function results(app: express.Express, loc: string, project:string, data: TestJSON<any>[], success: Suc, fail: Err) {
        render(app, loc, {
            tests: data,
            project: project
        }, success, fail)
    }
}