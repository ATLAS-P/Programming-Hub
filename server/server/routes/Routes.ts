import * as express from "express"
import * as socket from 'socket.io'
import * as passport from 'passport'
import * as fs from 'fs'
import * as azure from 'azure-storage'

import {Projects} from '../../autograder/Projects'
import {Groups} from '../../database/tables/Groups'
import {Users} from '../../database/tables/Users'
import {Files} from '../../database/tables/Files'
import {Future} from '../../functional/Future'
import {IOMap} from '../../functional/IOMap'
import {List} from '../../functional/List'
import {Result, TestJSON} from '../../autograder/Result'
import {Render} from './Render'
import {Sockets} from './Sockets'
import {Config} from '../Config'

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
    const PRIVACY = INDEX + "legal/privacy"
    const AUTH = INDEX + "auth/google"
    const AUTH_CALLBACK = AUTH + "/callback"
    const GROUP = INDEX + "group"
    const GROUP_ANY = GROUP + "/*"
    //const FILE = INDEX + "results/*/*"
    //const FILE_OF = FILE + "/*"
    //const FILE_UPLOAD = GROUP + "/file-upload"
    //const SUBMIT_RESULTS = GROUP + "/sendResults"
    //const DATABASE = GROUP_ANY + "database"
    //const FILES = DATABASE + "/files"
    //const USERS = DATABASE + "/users"
    //const USER = USERS + "/*"
    //const OVERVIEW = INDEX + "overview/*"

    let storage: azure.FileService

    export function addRoutes(app: express.Express, root: string, fileService: azure.FileService) {
        app.get(INDEX, index)
        app.get(LOGOUT, logout)
        app.get(PRIVACY, showPrivacy)

        //app.get(FILES, files)
        //app.get(USERS, users)
        //app.get(USER, showResults("user", 5, 2))
        //app.get(OVERVIEW, showResults("overview", 3, 2))
        app.get(GROUP_ANY, group)
        //app.get(FILE_OF, showResultOf)
        //app.get(FILE, showResult)

        //app.post(SUBMIT_RESULTS, submitResults)
        //app.post(FILE_UPLOAD, fileUpload(app, root))

        app.get(AUTH, passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.profile.emails.read',
                'https://www.googleapis.com/auth/userinfo.profile']
        }))

        app.get(AUTH_CALLBACK, passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/'
        }))

        storage = fileService
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
        if (req.user) Groups.getGroups(req.user.id).then(lg => Render.withUser(req, res, "hub", { groups: lg }), e => Render.error(req, res, e.toString()))
        else Render.withUser(req, res, "hub")
    }

    function group(req: Req, res: Res) {
        const group = req.url.split("/")[2]

        if (!req.user) res.redirect("/")
        else Groups.getGroup(group).then(g => Render.withUser(req, res, "group/overview", {group: g}), e => Render.error(req, res, e.toString()))
    }

    //function users(req: Req, res: Res) {
    //    const group = req.url.split("/")[2]
    //    Groups.instance.populateStudents(group, g => {
    //        const students = g.students as any as Tables.User[]
    //        const admins = g.admins

    //        if (admins.indexOf(req.user.id) >= 0) Render.withUser(req, res, "users", { users: students })
    //        else Render.error(req, res, "You have insufficient rights to view this page")
    //    }, error => Render.error(req, res, error))
    //}

    //function files(req: Req, res: Res) {
    //    const group = req.url.split("/")[2]
    //    Files.getAllForGroup(group, g => {
    //        Render.withUser(req, res, "files", { group: g })
    //    }, e => Render.error(req, res, e))
    //}

    //function showResults(location: string, user_index:number, group_index:number): (Req, Res) => void {
    //    return (req: Req, res: Res) => {
    //        const user = req.url.split("/")[user_index]
    //        const group = req.url.split("/")[group_index]

    //        Files.getForStudent(user, group, g => {
    //            const asses = g.assignments as any as Tables.Assignment[]
    //            Users.instance.getByID(user, student => {
    //                Render.userResults(req, res, location, asses, g, student)
    //            }, e => Render.error(req, res, e))
    //        }, e => Render.error(req, res, e))
    //    }
    //}

    //function showResult(req: Req, res: Res) {
    //    const data = req.url.split("/")

    //    const group = data[2]
    //    const assignment = data[3]

    //    if (!req.user) res.redirect("/")
    //    else Files.instance.getDeepAssignment(req.user.id, assignment, f => {
    //        let ext = f.extension
    //        let token = azureStorage.generateSharedAccessSignature("handins", "projects/" + group + "/" + req.user.id, (f.assignment as any).project.id + "." + (typeof ext == "undefined" ? ".py" : ext), { AccessPolicy: { Permissions: "r", Expiry: azure.date.minutesFromNow(10) } })

    //        Render.file(req, res, "file", f, group, token, false)
    //    }, e => res.send(e))
    //}

    //function showResultOf(req: Req, res: Res) {
    //    const data = req.url.split("/")

    //    const group = data[2]
    //    const assignment = data[3]
    //    const user = data[4]

    //    //check if req.user == admin for the group (not not possible though..., change design)
    //    Files.instance.getDeepAssignment(user, assignment, f => {
    //        let ext = f.extension
    //        let token = azureStorage.generateSharedAccessSignature("handins", "projects/" + group + "/" + user, (f.assignment as any).project.id + "." + (typeof ext == "undefined" ? ".py" : ext), { AccessPolicy: { Permissions: "r", Expiry: azure.date.minutesFromNow(10) } })

    //        Render.file(req, res, "file", f, group, token, true)
    //    }, e => res.send(e))
    //}

    //function submitResults(req: Req, res: Res) {
    //    const data = req.body
    //    const date = new Date()
    //    date.setHours(date.getHours() - 1)

    //    //show error on hand in page not res.send new page
    //    Groups.instance.getAndPopulate({ _id: data.group }, true, true, g => {
    //        let group = g[0]
    //        let assignment = group.assignments.find(a => a._id == data.assignment)

    //        if (assignment && assignment.project._id == data.project) {
    //            if (assignment.due > date) {
                    
    //                let students: List<Tables.UserTemplate> = List.apply([])

    //                group.students.forEach(s => {
    //                    let ref = data[s._id]
    //                    if (ref) students = students.add(s)
    //                })

    //                let studentIDs = students.map(s => s._id).toArray()

    //                const handedIn = (s: Tables.UserTemplate) => new Future<boolean>((res, rej) => {
    //                    Files.instance.getAssignment(s._id, assignment._id, f => res(f.final), rej => res(false))
    //                })

    //                const traverse = IOMap.traverse(students, IOMap.apply)
    //                const someoneHandedIn = IOMap.ListHelper.foldLeft(traverse, (b, bi: boolean) => b || bi, false).run(handedIn)
    //                someoneHandedIn.then(nogo => {
    //                    if (nogo) res.send("This assignment was alreaday handed in by you or your parnters!")
    //                    else {
    //                        function handleGrading() {
    //                            const sess = req.session as ResultSession

    //                            if (sess.result && sess.result[data.project]) {
    //                                upload(sess.result[data.project], "py")
    //                            } else res.send("No result found for assignment: " + assignment.project.name)
    //                        }

    //                        function handleFiles() {
    //                            upload([], data.extension)
    //                        }

    //                        function upload(result: TestJSON<any>[], extension:string) {
    //                            const time = new Date()
    //                            const dir = "projects"
    //                            const pending = "https://atlasprogramming.file.core.windows.net/handins/pending/" + req.user.id + "/" + data.project + "." + extension

    //                            azureStorage.createDirectoryIfNotExists('handins', dir, (error, resu, response) => {
    //                                const dir2 = dir + "/" + data.group

    //                                azureStorage.createDirectoryIfNotExists('handins', dir2, (error, resu, response) => {
    //                                    students.toArray().forEach((s, i) => {
    //                                        let file = Tables.mkFile(s._id, assignment._id, time, studentIDs, result, s._id == req.user.id, extension, data[s._id])
    //                                        Files.instance.create(file, () => {
    //                                            azureStorage.createDirectoryIfNotExists('handins', dir2 + "/" + s._id, (error, resu, response) => {
    //                                                azureStorage.startCopyFile(pending, "handins", dir2 + "/" + s._id, data.project + "." + extension, (error, resu, response) => {
    //                                                    if (s._id == req.user.id) res.redirect("/results/" + group._id + "/" + assignment._id)
    //                                                    if (i == students.length() - 1) {
    //                                                        azureStorage.deleteFile("handins", "pending" + "/" + req.user.id, data.project + "." + extension, (e, r) => {
    //                                                            if (e) console.log(e)
    //                                                        })
    //                                                    }
    //                                                })
    //                                            })
    //                                        }, Table.error)
    //                                    })
    //                                })
    //                            })
    //                        }

    //                        let type = data.projectType

    //                        switch (type) {
    //                            case "auto_code":
    //                                handleGrading()
    //                                break
    //                            case "files":
    //                                handleFiles()
    //                                break
    //                            default:
    //                                res.send("No handler available for project with type: " + type)
    //                                break
    //                        }
    //                    }
    //                }, r => res.send("Unexpected error during validation of hand-in request!"))
    //            } else res.send("The deadline has passed!")
    //        } else res.send("Illigal assignment!")
    //    }, Table.error)
    //}

    //function fileUpload(app: express.Express, root: string): Route {
    //    //cleanups required below
    //    return (req, res) => {
    //        const sess = req.session as ResultSession
    //        const busboy = (req as any).busboy

    //        let projectData = new Future<[string, string]>((resolve, reject) => {
    //            let project = ""
    //            let type = ""

    //            busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
    //                if (fieldname == "project") project = val
    //                else if (fieldname == "type") type = val

    //                if (project.length > 0 && type.length > 0) resolve([project, type])
    //            })
    //        })

    //        busboy.on('file', function (fieldname, file, filename) {
    //            const newName = filename + "_" + req.user.id

    //            let filepath = root + '/uploads/' + newName
    //            let fstream = fs.createWriteStream(filepath);

    //            function handleGrading(project: string) {
    //                Projects.gradeProject(project, newName, r => {
    //                    if (!sess.result || typeof sess.result == "undefined" || sess.result == null) sess.result = {}

    //                    upload(project, () => {
    //                        sess.result[project] = r.toJSONList().toArray()
    //                        Render.results(app, "result", project, r.toJSONList().toArray(), html => {
    //                            res.json({ success: true, html: html })
    //                        }, fail => {
    //                            res.json({ success: false, err: fail.message })
    //                        })
    //                    })
    //                }, (err: string) => {
    //                    res.json({ success: false, err: err })
    //                    fs.unlink(filepath)
    //                })
    //            }

    //            function handleFiles(project: string) {
    //                upload(project, () => {
    //                    Render.upload(app, "simpleUpload", project, filename, html => {
    //                        res.json({ success: true, html: html })
    //                    }, fail => {
    //                        res.json({ success: false, err: fail.message })
    //                    })
    //                })
    //            }

    //            function upload(project: string, success:()=>void) {
    //                const dir = "pending"
    //                azureStorage.createDirectoryIfNotExists('handins', dir, (error, result, response) => {
    //                    azureStorage.createDirectoryIfNotExists('handins', dir + "/" + req.user.id, (error, result, response) => {
    //                        const extension = filename.split(".").pop()
    //                        azureStorage.createFileFromLocalFile('handins', dir + "/" + req.user.id, project + "." + extension, filepath, (error, result, response) => {
    //                            if (error) {
    //                                res.json({ success: false, err: error.message })
    //                                fs.unlink(filepath)
    //                            } else {
    //                                success()
    //                                fs.unlink(filepath)
    //                            }
    //                        })
    //                    })
    //                })
    //            }

    //            file.pipe(fstream);
    //            fstream.on('close', function () {

    //                projectData.then((data: [string, string]) => {
    //                    let project = data[0]
    //                    let type = data[1]

    //                    switch(type) {
    //                        case "auto_code":
    //                            handleGrading(project)
    //                            break
    //                        case "files":
    //                            handleFiles(project)
    //                            break
    //                        default:
    //                            res.json({ success: false, err: "No handler available for project with type: " + type })
    //                            break
    //                    }
    //                }, () => console.log("the impossible happend"))
    //            });
    //        });

    //        req.pipe(busboy);
    //    }
    //}
}