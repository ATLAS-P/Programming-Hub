import * as express from "express"
import * as socket from 'socket.io'
import * as passport from 'passport'
import * as fs from 'fs'
import * as process from 'child_process'
import * as grader from '../autograder/AutoGrader'

import {Groups} from '../database/tables/Groups'
import {Users} from '../database/tables/Users'
import {Files} from '../database/tables/Files'
import {Tables, Table} from '../database/Table'
import {Future} from '../functional/Future'
import {List} from '../functional/List'
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

    const INDEX = "/"
    const LOGOUT = INDEX + "logout"
    const AUTH = INDEX + "auth/google"
    const AUTH_CALLBACK = AUTH + "/callback"
    const GROUP = INDEX + "group"
    const GROUP_ANY = GROUP + "/*"
    const FILE = INDEX + "results/*"
    const FILE_UPLOAD = GROUP + "/file-upload"
    const SUBMIT_RESULTS = GROUP + "/sendResults"
    const PRIVACY = INDEX + "legal/privacy"

    export function addRoutes(app: express.Express, root: string) {
        app.get(GROUP_ANY, group)
        app.get(INDEX, index)
        app.get(LOGOUT, logout)
        app.get(FILE, showResult)
        app.get(PRIVACY, showPrivacy)

        app.post(SUBMIT_RESULTS, submitResults)
        app.post(FILE_UPLOAD, fileUpload(root))

        app.get(AUTH, passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.profile.emails.read',
                'https://www.googleapis.com/auth/userinfo.profile']
        }))

        app.get(AUTH_CALLBACK, passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }))
    }

    function showPrivacy(req: Req, res: Res) {
        Render.withUser(req, res, "privacy")
    }

    function logout(req: Req, res: Res) {
        req.logout()
        res.redirect('/')
    }

    function index(req: Req, res: Res) {
        Render.withUser(req, res, "hub")
    }

    function showResult(req: Req, res: Res) {
        const assignment = req.url.split("/")[2]

        if (!req.user) res.redirect("/")
        else Files.instance.getDeepAssignment(req.user.id, assignment, f => Render.file(req, res, "file", f), e => res.send(e))
    }

    function group(req: Req, res: Res) {
        (req.session as ResultSession).bestResult = null
        const group = req.url.split("/")[2] 

        if (!req.user) res.redirect("/")
        else Groups.getGroupDetails(req.user.id, group, g => Render.groupDetails(req, res, "group", g), e => res.send(e))
    }

    function submitResults(req: Req, res: Res) {
        const data = req.body
        const date = new Date()
        date.setHours(date.getHours() - 1)

        //show error on hand in page not res.send new page
        Groups.instance.getAndPopulate({ _id: data.group }, true, true, g => {
            let group = g[0]
            let assignment = group.assignments.find(a => a._id == data.assignment)

            if (assignment && assignment.project._id == data.project) {
                if (assignment.due > date) {
                    const result = (req.session as ResultSession).bestResult[data.project]

                    if (result) {
                        let students: List<Tables.UserTemplate> = List.apply([])

                        group.students.forEach(s => {
                            let ref = data[s._id]
                            if (ref) students = students.add(s)
                        })

                        let studentIDs = students.map(s => s._id).toArray()

                        const handedIn = (s: Tables.UserTemplate) => new Future<boolean>((res, rej) => {
                            Files.instance.getAssignment(s._id, assignment._id, f => res(f.final), rej => res(false))
                        })

                        const traverse = IOMap.traverse(students, IOMap.apply)
                        const someoneHandedIn = IOMap.ListHelper.foldLeft(traverse, (b, bi: boolean) => b || bi, false).run(handedIn)
                        someoneHandedIn.then(nogo => {
                            if (nogo) res.send("This assignment was alreaday handed in by you or your parnters!")
                            else {
                                const time = new Date()

                                //change to this if finished
                                //res.redirect("/result/" + assignment._id)
                                //now is
                                res.redirect('/')
                                students.toArray().forEach(s => {
                                    let file = Tables.mkFile(s._id, assignment._id, time, studentIDs, (result as Result), s._id == req.user.id, data[s._id])
                                    //remove old if available
                                    Files.instance.create(file, () => { }, Table.error)
                                })
                            }
                        }, r => res.send("Unexpected error during validation of hand-in request!"))
                    } else res.send("No result found for assignment: " + assignment.project.name)
                } else res.send("The deadline has passed!")
            } else res.send("Illigal assignment!")
        }, Table.error)
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
                        grader.gradeProject(project, simpleio, function (r) {
                            if (!sess.bestResult || typeof sess.bestResult == "undefined" || sess.bestResult == null) sess.bestResult = {}

                            sess.bestResult[project] = r.best(sess.bestResult[project])
                            res.json({ success: true, tests: r.totalTests(), passed: r.totalSuccess(), failed: (r instanceof Fail) ? r.getFailed().toArray() : [] })
                            fs.unlink(filepath)
                        }, (err: string) => {
                                res.json({ success: false, err: err })
                                fs.unlink(filepath)
                            }
                        )
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
    type GroupCall = (group: string) => void
    type NonFinalCall = (accept: boolean, assignment:string) => void

    //on or get is for receiving, others can be used to emit
    const ON_CONNECTION = "connection"
    const GET_GROUPS = "getGroups"
    const GET_GROUP_USERS = "getUsersIn"
    const GET_NON_FINAL = "getNonFinalHandIns"
    const ON_HANDLE_NON_FINAL = "handleNonFinal"

    const SEND_GROUPS = "setGroups"
    const SEND_GROUP_USERS = "setUsersIn"
    const SEND_NON_FINAL = "setNonFinalHandIns"

    export function bindHandlers(app: express.Express, io: SocketIO.Server) {
        console.log("setting op io")

        io.on(ON_CONNECTION, connection(app))
    }

    export function connection(app: express.Express): Handler {
        return socket => {
            console.log("socket connected")

            socket.on(GET_GROUPS, getGroupsOverview(app, socket))
            socket.on(GET_GROUP_USERS, getOtherUsersIn(app, socket))
            socket.on(GET_NON_FINAL, getNonFinalFiles(app, socket))
            socket.on(ON_HANDLE_NON_FINAL, handleNonFinal(app, socket))
        }
    }

    //three below share too much, generalize
    export function getGroupsOverview(app: express.Express, socket: SocketIO.Socket): SimpleCall {
        const sendGroups = (success: boolean, data: string | Error) => emitHtml(socket, SEND_GROUPS, success, data)

        return () => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user.id

                Groups.getOverviewForUser(user, lg => {
                    Render.groupsOverview(app, "groups", lg, data => sendGroups(true, data), err => sendGroups(false, err))
                }, e => sendGroups(false, e))
            }
        }
    }

    export function getOtherUsersIn(app: express.Express, socket: SocketIO.Socket): GroupCall {
        const sendUsers = (success: boolean, data: string | Error) => emitHtml(socket, SEND_GROUP_USERS, success, data)

        return g => {
            const user = socket.request.session.passport.user.id
            Groups.instance.getStudents(g, lu => {
                Render.users(app, "userList", lu.filter(v => v._id != user), html => sendUsers(true, html), err => sendUsers(false, err))
            }, e => sendUsers(false, e))
        }
    }

    export function getNonFinalFiles(app: express.Express, socket: SocketIO.Socket): SimpleCall {
        const send = (success: boolean, data: string | Error) => emitHtml(socket, SEND_NON_FINAL, success, data)

        return () => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user.id
                Files.instance.getNonFinalFor(user, fl => {
                    Render.files(app, "nonFinal", fl, html => send(true, html), err => send(false, err))
                }, e => send(false, e))
            }
        }
    }

    export function handleNonFinal(app: express.Express, socket: SocketIO.Socket): NonFinalCall {
        return (accept, ass) => {
            const user = socket.request.session.passport.user.id

            if (accept) Files.instance.mkFinal(user, ass)
            else Files.instance.removeNonFinal(user, ass)
        }
    }

    export function emitHtml(socket: SocketIO.Socket, to: string, success: boolean, data: string | Error) {
        if (success) socket.emit(to, { success: true, html: data as string })
        else socket.emit(to, { success: false, err: (data instanceof Error ? data.message : data )})
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
            a_done: data.doneAssignments,
            group: {
                id: data.id,
                name: data.name
            }
        })
    }

    export function file(req: Routes.Req, res: Routes.Res, loc: string, data: Tables.File) {
        res.render(loc, {
            user: req.user,
            file: data
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
}