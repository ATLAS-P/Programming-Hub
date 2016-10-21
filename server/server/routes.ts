import * as express from "express"
import * as socket from 'socket.io'
import * as passport from 'passport'
import * as fs from 'fs'
import * as process from 'child_process'
import * as grader from '../autograder/AutoGrader'

import {Groups} from '../database/tables/Groups'
import {Users} from '../database/tables/Users'
import {Tables, Table} from '../database/Table'
import {Future} from '../functional/Future'
import {Result, Fail} from '../autograder/Result'
import {IOMap} from '../functional/IOMap'

//split up in more files
export namespace Routes {
    export type Req = express.Request
    export type Res = express.Response

    type Route = (req: Req, res: Res) => void

    interface ResultSession extends Express.Session {
        bestResult: {}
    }

    const INDEX             =           "/"
    const LOGOUT            = INDEX +   "logout"
    const AUTH              = INDEX +   "auth/google"
    const AUTH_CALLBACK     = AUTH  +   "/callback"
    const GROUP             = INDEX +   "group"
    const GROUP_ANY         = GROUP +   "/*"
    const FILE_UPLOAD       = GROUP +   "/file-upload"
    const SUBMIT_RESULTS    = GROUP +   "/sendResults"

    export function addRoutes(app: express.Express, root: string) {
        app.get(GROUP_ANY, group)
        app.get(INDEX, index)
        app.get(LOGOUT, logout)

        app.post(SUBMIT_RESULTS, submitResults)
        app.post(FILE_UPLOAD, fileUpload(root))

        //use differnet scopes for only baisc profile info: https://developers.google.com/identity/protocols/googlescopes
        app.get(AUTH, passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/plus.profile.emails.read']
        }))

        app.get(AUTH_CALLBACK, passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }))
    }

    function logout(req: Req, res: Res) {
        req.logout()
        res.redirect('/')
    }

    function index(req: Req, res: Res) {
        Render.withUser(req, res, "hub")
    }

    function group(req: Req, res: Res) {
        (req.session as ResultSession).bestResult = null
        const group = req.url.split("/")[2]

        Groups.getGroupDetails(group, g => Render.groupDetails(req, res, "group", g), e => res.send(e))
    }

    function submitResults(req: Req, res: Res) {
        const data = req.body
        const project = data.project
        const group = data.group
        const assignment = data.assignment
        const result = (req.session as ResultSession).bestResult[project]

        res.end()

        Groups.instance.getAndPopulate({ _id: group }, true, true, g => console.log(g), Table.error)

        //check if assignment.project == project
            //check if assignment is in group
                //check if all students are in same group, and the group.id is equal to group
                    //check if students did not hand in already (only if final)
                        //hand in for main student, and hand in non final for others -- only if test passed

        //if passed for main student then redirect to result of assignment page
        //else show error on submit page
    }

    function fileUpload(root: string): Route {
        //cleanups required below
        return (req, res) => {
            const sess = req.session as ResultSession
            const busboy = (req as any).busboy

            let project = new Future<string>((resolve, reject) => {
                busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
                    if (fieldname == "project") {
                        resolve(val)
                    }
                })
            })

            busboy.on('file', function (fieldname, file, filename) {
                console.log("fhew")
                let filepath = root + '/uploads/' + filename
                let fstream = fs.createWriteStream(filepath);

                file.pipe(fstream);
                fstream.on('close', function () {
                    //simpleio (mk one for n io and only use that one)
                    let simpleio = (s: string) => new Future<string>((resolve, reject) => {
                        let running = true
                        let py = process.spawn("python3", ['uploads/' + filename])
                        let output = []

                        py.stdout.on('data', function (data) {
                            var buff = new Buffer(data as Buffer)
                            output.push(buff.toString("utf8"))
                        });

                        py.stderr.on('data', function (err) {
                            var buff = new Buffer(err as Buffer)
                            reject(buff.toString("utf8"))
                        });

                        py.on('close', function () {
                            running = false
                            if (output.length == 0) reject("No output received!")
                            else {
                                resolve((output[0] as string).replace(/\r?\n|\r/, ""))
                            }
                        });

                        py.stdin.write(s)
                        py.stdin.end()

                        setTimeout(function () {
                            if (running) {
                                py.kill()
                                reject("Max runtime of 10s exeeded!")
                            }
                        }, 10000)
                    })

                    project.then((project: string) => {
                        //remove file in both cases


                        grader.gradeProject(project, simpleio, function (r) {
                            if (!sess.bestResult || typeof sess.bestResult == "undefined" || sess.bestResult == null) sess.bestResult = {}

                            sess.bestResult[project] = r.best(sess.bestResult[project])
                            res.json({ success: true, tests: r.totalTests(), passed: r.totalSuccess(), failed: (r instanceof Fail) ? r.getFailed().toArray() : [] })
                        }, (err: string) => res.json({ success: false, err: err }))
                    }, () => console.log("the impossible happend"))
                });
            });

            req.pipe(busboy);
        }
    }
}

export namespace Sockets {
    type Handler = (socket:SocketIO.Socket) => void
    type SimpleCall = () => void
    type GroupCall = (group:string) => void

    //on or get is for receiving, others can be used to emit
    const ON_CONNECTION = "connection"
    const GET_GROUPS = "getGroups"
    const GET_GROUP_USERS = "getUsersIn"

    const SEND_GROUPS = "setGroups"
    const SEND_GROUP_USERS = "setUsersIn"

    export function bindHandlers(app: express.Express, io: SocketIO.Server) {
        console.log("setting op io")

        io.on(ON_CONNECTION, connection(app))
    }

    export function connection(app: express.Express): Handler {
        return socket => {
            console.log("socket connected")

            socket.on(GET_GROUPS, getGroupsOverview(app, socket))
            socket.on(GET_GROUP_USERS, getOtherUsersIn(app, socket))
        }
    }

    //two below share too much, generalize
    export function getGroupsOverview(app: express.Express, socket: SocketIO.Socket): SimpleCall {
        const sendGroups = (success: boolean, data: string | Error) => emitHtml(socket, SEND_GROUPS, success, data)

        return () => {
            console.log("triggered")

            const user = socket.request.session.passport.user.id

            console.log(user)
            Groups.getOverviewForUser(user, lg => {
                console.log(lg)
                Render.groupsOverview(app, "groups", lg, data => sendGroups(true, data), err => sendGroups(false, err))
            }, e => socket.emit(SEND_GROUPS, { success: false, err: e }))
        }
    }

    export function getOtherUsersIn(app: express.Express, socket: SocketIO.Socket): GroupCall {
        const sendUsers = (success: boolean, data: string | Error) => emitHtml(socket, SEND_GROUP_USERS, success, data)

        return g => {
            const user = socket.request.session.passport.user.id
            Users.instance.inGroup(g, { _id: { $ne: user } }, true, lu => {
                Render.users(app, "userList", lu, html => sendUsers(true, html), err => sendUsers(false, err))
            }, e => socket.emit(SEND_GROUP_USERS, { success: false, err: e }))
        }
    }

    export function emitHtml(socket: SocketIO.Socket, to:string, success: boolean, data: string|Error) {
        if (success) socket.emit(to, { success: true, html: data as string })
        else socket.emit(to, { success: false, err: (data as Error).message })
    }
}

export namespace Render {
    export type Suc = (html: string) => void
    export type Err = (err: Error) => void

    export function withUser(req: Routes.Req, res: Routes.Res, loc: string) {
        res.render(loc, {
            user: req.user
        })
    }

    export function groupDetails(req: Routes.Req, res: Routes.Res, loc: string, data: Groups.GroupDetails) {
        res.render(loc, {
            user: req.user,
            a_open: data.openAssignments,
            a_close: data.closedAssignments,
            group: {
                id: data.id,
                name: data.name
            }
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

    export function render(app: express.Express, loc: string, data: {}, success: Suc, fail: Err) {
        app.render(loc, data, (err, suc) => {
            if (err) fail(err)
            else success(suc)
        })
    }
}