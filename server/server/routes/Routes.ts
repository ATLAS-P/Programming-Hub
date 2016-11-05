import * as express from "express"
import * as socket from 'socket.io'
import * as passport from 'passport'
import * as fs from 'fs'

import {Miniprojects} from '../../autograder/Miniprojects'
import {Groups} from '../../database/tables/Groups'
import {Users} from '../../database/tables/Users'
import {Files} from '../../database/tables/Files'
import {Tables, Table} from '../../database/Table'
import {Future} from '../../functional/Future'
import {IOMap} from '../../functional/IOMap'
import {List} from '../../functional/List'
import {Result, TestJSON} from '../../autograder/Result'
import {Render} from './Render'
import {Sockets} from './Sockets'

//cleanups needed below
export namespace Routes {
    export type Req = express.Request
    export type Res = express.Response

    type Route = (req: Req, res: Res) => void

    interface ResultSession extends Express.Session {
        result: {}
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
        app.post(FILE_UPLOAD, fileUpload(app, root))

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
        req.session.destroy(function (err) {
            if (err) console.log(err);
            res.redirect('/');
        });
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
        (req.session as ResultSession).result = null
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
            const sess = req.session as ResultSession

            if (sess.result && assignment && assignment.project._id == data.project) {
                if (assignment.due > date) {
                    const result = sess.result[data.project]

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

                                res.redirect("/result/" + assignment._id)
                                students.toArray().forEach(s => {
                                    //if non final exisits override it
                                    let file = Tables.mkFile(s._id, assignment._id, time, studentIDs, result, s._id == req.user.id, data[s._id])
                                    Files.instance.create(file, () => { }, Table.error)
                                })
                            }
                        }, r => res.send("Unexpected error during validation of hand-in request!"))
                    } else res.send("No result found for assignment: " + assignment.project.name)
                } else res.send("The deadline has passed!")
            } else res.send("Illigal assignment!")
        }, Table.error)
    }

    function fileUpload(app: express.Express, root: string): Route {
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
                const newName = filename + (new Date()).getTime()

                let filepath = root + '/uploads/' + newName
                let fstream = fs.createWriteStream(filepath);

                file.pipe(fstream);
                fstream.on('close', function () {

                    project.then((project: string) => {
                        Miniprojects.gradeProject(project, newName, function (r) {
                            if (!sess.result || typeof sess.result == "undefined" || sess.result == null) sess.result = {}

                            sess.result[project] = r
                            Render.results(app, "result", r.toJSONList().toArray(), html => {
                                res.json({ success: true, html:html })
                            }, fail => {
                                res.json({ success: false, err: fail.message })
                                })

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