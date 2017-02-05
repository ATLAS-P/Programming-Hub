import { Routes } from './Routes'
import { Render } from './Render'
import { TestJSON } from '../../autograder/Result'
import { Groups } from '../../database/tables/Groups'
import { Users } from '../../database/tables/Users'
import { Assignments } from '../../database/tables/Assignments'
import { MkTables } from '../../database/MkTables'
import { Future } from '../../functional/Future'
import { List } from '../../functional/List'
import { IOMap } from '../../functional/IOMap'
import { Tuple } from '../../functional/Tuple'

import { Files } from '../../database/tables/Files'

import * as express from "express"
import * as azure from 'azure-storage'

export namespace Sockets {
    type Handler = (socket: SocketIO.Socket) => void
    type SimpleCall = () => void
    type StringCall = (data: string) => void
    type AddUsersCall = (users: string[], group: string, role: string) => void
    type UploadCall = (assignment:string, handInName: string, comments:string, partners: string[], files: string[]) => void
    type StringArrCall = (data: string[]) => void
    type GroupCall = (group: string) => void
    type CreateCourse = (name: string, start: Date, end: Date) => void
    type UpdateCourse = (course:string, name: string, start: Date, end: Date) => void
    type CreateAssignment = (group:string, name: string, type: string, due: Date, link:string) => void
    type FeedbackCall = (file:string, feedback: string) => void
    type FinalCall = (accept: boolean, group:string, file:string) => void

    const ON_CONNECTION = "connection"
    const ON_CREATE_COURSE = "createCourse"
    const ON_REMOVE_COURSE = "removeCourse"
    const ON_CREATE_ASSIGNMENT = "createAssignment"
    const ON_REMOVE_ASSIGNMENT = "removeAssignment"
    const ON_GET_USERS = "getUsers"
    const ON_ADD_USERS = "addUsers"
    const ON_UPLOAD_FILES = "uploadFiles"
    const ON_FEEDBACK = "updateFeedback"
    const ON_SET_FINAL = "manageFinal"
    const ON_UPDATE_COURSE = "updateCourse"

    const RESULT_CREATE_COURSE = "courseCreated"
    const RESULT_CREATE_ASSIGNMENT = "assignmentCreated"
    const RESULT_REMOVE_COURSE = "courseRemoved"
    const RESULT_REMOVE_ASSIGNMENT = "assignmentRemoved"
    const RESULT_GET_USERS = "usersGot"
    const RESULT_ADD_USERS = "usersAdded"
    const RESULT_UPLOAD_FILES = "fileUplaoded"
    const RESULT_FEEDBACK = "feedbacked"
    const RESULT_FINAL = "doneFinal"
    const RESULT_UPDATE_COURSE = "courseUpdated"

    export function bindHandlers(app: express.Express, io: SocketIO.Server, storage: azure.FileService) {
        io.on(ON_CONNECTION, connection(app, storage))
    }

    export function connection(app: express.Express, storage: azure.FileService): Handler {
        return socket => {
            socket.on(ON_CREATE_COURSE, createCourse(app, socket))
            socket.on(ON_REMOVE_COURSE, removeCourse(app, socket))
            socket.on(ON_UPDATE_COURSE, updateCourse(app, socket))
            socket.on(ON_CREATE_ASSIGNMENT, createAssignment(app, socket))
            socket.on(ON_REMOVE_ASSIGNMENT, removeAssignment(app, socket))
            socket.on(ON_GET_USERS, getUsers(app, socket))
            socket.on(ON_ADD_USERS, addUsers(app, socket))
            socket.on(ON_UPLOAD_FILES, uploadFile(app, socket, storage))
            socket.on(ON_FEEDBACK, updateFeedback(app, socket))
            socket.on(ON_SET_FINAL, manageFinal(app, socket))
        }
    }

    export function createCourse(app: express.Express, socket: SocketIO.Socket): CreateCourse {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_CREATE_COURSE, success, error && (error as any).message ? (error as any).message : error)

        return (name, start, end) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.create(MkTables.mkGroup(name, start, end)).flatMap(g =>
                        Groups.instance.addUser(g._id, user.id, true, true)).then(g => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficent rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function updateCourse(app: express.Express, socket: SocketIO.Socket): UpdateCourse {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_UPDATE_COURSE, success, error && (error as any).message ? (error as any).message : error)

        return (course, name, start, end) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.updateOne(course, g => {
                        g.name = name
                        g.start = start
                        g.end = end
                    }).then(g => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficent rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function createAssignment(app: express.Express, socket: SocketIO.Socket): CreateAssignment {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_CREATE_ASSIGNMENT, success, error && (error as any).message ? (error as any).message : error)

        return (group, name, type, due, link) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.isAdmin(group, user.id).flatMap(isAdmin => {
                        if (isAdmin) return Groups.instance.mkAndAddAssignment(group, MkTables.mkAssignment(name, group, due, type, link))
                        else return Future.reject("You have insufficent rights to perform this action.")
                    }).then(a => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficent rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function removeCourse(app: express.Express, socket: SocketIO.Socket): StringCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_REMOVE_COURSE, success, error && (error as any).message ? (error as any).message : error)

        return (course) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.isAdmin(course, user.id).flatMap(isAdmin => {
                        if (isAdmin) return Groups.removeGroup(course)
                        else Future.reject("You have insufficent rights to perform this action.")
                    }).then(v => emitResult(true), errors => emitResult(false, errors))
                } else emitResult(false, "You have insufficent rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    //TODO still needs an isAdmin check!!!
    export function removeAssignment(app: express.Express, socket: SocketIO.Socket): StringCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_REMOVE_ASSIGNMENT, success, error && (error as any).message ? (error as any).message : error)

        return (assignment) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Assignments.instance.removeAssignment(assignment, true).then(v => emitResult(true), errors => emitResult(false, errors))
                } else emitResult(false, "You have insufficent rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function getUsers(app: express.Express, socket: SocketIO.Socket): StringArrCall {
        const emitResult = (users: MkTables.UserTemplate[]) => socket.emit(RESULT_GET_USERS, users)

        return (usersNot: string[]) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Users.instance.exec(Users.instance.model.find({ "_id": { $nin: usersNot } }).sort({ "name": 1, "surename": 1 }).select("-groups"), false).then(users => {
                        emitResult(users), e => console.log(e)
                    })
                }
            }
        }
    }

    export function updateFeedback(app: express.Express, socket: SocketIO.Socket): FeedbackCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_FEEDBACK, success, error && (error as any).message ? (error as any).message : error)

        return (file: string, feedback: string) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user

                if (user.admin) {
                    Files.instance.updateFeedback(file, feedback).then(f => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficent rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    //TODO still needs an isAdmin check!!!
    export function addUsers(app: express.Express, socket: SocketIO.Socket): AddUsersCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_ADD_USERS, success, error)

        return (users: string[], group: string, role: string) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.addUsers(group, users, role == "admin").then(g => emitResult(true), e => emitResult(false, e))
                } else emitResult(false, "You have insufficent rights to perform this action.")
            } else emitResult(false, "The session was lost, please login again.")
        }
    }

    export function manageFinal(app: express.Express, socket: SocketIO.Socket): FinalCall {
        const emitResult = () => socket.emit(RESULT_FINAL)

        return (accept: boolean, group: string, file: string) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                Users.instance.updateOne(user.id, u => {
                    const files = u.groups.find(g => g.group == group).files
                    const fileInst = files.find(f => f.file == file)

                    if (accept) fileInst.final = true
                    else files.splice(files.indexOf(fileInst), 1)
                }).then(u => {
                    if (accept) emitResult()
                    else Files.instance.updateOne(file, f => {
                        const students = f.students as string[]
                        const userIndex = students.indexOf(u._id)
                        students.splice(userIndex, 1)
                    }).then(f => emitResult(), e => emitResult())
                }, e => emitResult())
            } else emitResult()
        }
    }

    //still remove old pending
    export function uploadFile(app: express.Express, socket: SocketIO.Socket, storage: azure.FileService): UploadCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_UPLOAD_FILES, success, error)

        return (assignment: string, handInName:string, comments: string, students: string[], files: string[]) => {
            if (socket.request.session.passport) {
                let groupId = ""
                const user = socket.request.session.passport.user
                students.push(user.id)
                const properHandin = Assignments.instance.exec(Assignments.instance.populateFiles(Assignments.instance.getByID(assignment))).flatMap(ass => Groups.instance.exec(Groups.instance.getByID(ass.group as string)).map(g => new Tuple(ass, g))).flatMap(data => {
                    groupId = data._2._id

                    for (let s in students) if ((data._2.students as string[]).indexOf(s) >= 0) return Future.reject("Student: '" + s + "' is not part of the course!")
                    if (data._1.typ == "open") return Future.unit(true)
                    else {
                        for (let file of data._1.files) {
                            for (let s of students) if (((file as MkTables.FileTemplate).students as MkTables.UserTemplate[]).find(st => st._id == s)) return Future.reject("Student: '" + s + "' already handed in this file!")
                        }
                        return Future.unit(true)
                    }
                })

                const upload = (success) => {
                    if (!success) emitResult(false, "We were not able to validate your hand-in!")
                    else {
                        const root = "https://atlasprogramming.file.core.windows.net/handins/"
                        const pending = root + "pending/" + user.id + "/" + assignment + "/"
                        Files.instance.create(MkTables.mkFile(assignment, handInName, students, [], comments)).then(file => {
                            const id = file._id

                            storage.createDirectoryIfNotExists('handins', "files", (error, resu, response) => {
                                storage.createDirectoryIfNotExists('handins', "files/" + id, (error, resu, response) => {

                                    const fileToLink = (fileName: string) => new Future<string>((res, rej) => {
                                        storage.startCopyFile(pending + fileName, "handins", "files/" + id, fileName, (error, resu, response) => {
                                            if (error) rej(error.message)
                                            else res(root + "files/" + id + "/" + fileName + "?" + storage.generateSharedAccessSignature("handins", "files/" + id, fileName, {
                                                    AccessPolicy: {
                                                        Permissions: "r",
                                                        Expiry: azure.date.daysFromNow(1000)
                                                    }
                                                }))
                                        })
                                    }) 

                                    IOMap.traverse<string, string, string>(List.apply(files), IOMap.apply).run(fileToLink).flatMap(links => {
                                        file.urls = links.toArray()
                                        return file.save()
                                    }).flatMap(file => Users.instance.makeFinal(user.id, groupId, file._id)).then(() => emitResult(true), e => emitResult(false, e))
                                })
                            })
                        }, e => emitResult(false, e))
                    }
                }

                properHandin.then(upload, (err) => emitResult(false, err))
            }
        }
    }
    //export function getNonFinalFiles(app: express.Express, socket: SocketIO.Socket): SimpleCall {
    //    const send = (success: boolean, data: string | Error) => emitHtml(socket, SEND_NON_FINAL, success, data)

    //    return () => {
    //        if (socket.request.session.passport) {
    //            const user = socket.request.session.passport.user.id
    //            Files.instance.getNonFinalFor(user, fl => {
    //                Render.files(app, "nonFinal", fl, html => send(true, html), err => send(false, err))
    //            }, e => send(false, e))
    //        }
    //    }
    //}

    //export function handleNonFinal(app: express.Express, socket: SocketIO.Socket): NonFinalCall {
    //    return (accept, ass) => {
    //        if (socket.request.session.passport) {
    //            const user = socket.request.session.passport.user.id

    //            if (accept) Files.instance.mkFinal(user, ass)
    //            else Files.instance.removeNonFinal(user, ass)
    //        }
    //    }
    //}
}