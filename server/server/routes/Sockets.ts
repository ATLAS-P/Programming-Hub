import { Routes } from './Routes'
import { Render } from './Render'
import { TestJSON } from '../../autograder/Result'
import { Groups } from '../../database/tables/Groups'
import { Users } from '../../database/tables/Users'
import { Assignments } from '../../database/tables/Assignments'
import { MkTables } from '../../database/MkTables'
import { Future } from '../../functional/Future'

import { Files } from '../../database/tables/Files'

import * as express from "express"

export namespace Sockets {
    type Handler = (socket: SocketIO.Socket) => void
    type SimpleCall = () => void
    type StringCall = (data: string) => void
    type AddUsersCall = (users: string[], group:string, role:string) => void
    type StringArrCall = (data: string[]) => void
    type GroupCall = (group: string) => void
    type CreateCourse = (name: string, start: Date, end: Date) => void
    type CreateAssignment = (group:string, name: string, type: string, due: Date, link:string) => void
    type feedbackCall = (file:string, feedback: string) => void
    type ResultsCall = (data: TestJSON<any>[], project:string) => void
    type NonFinalCall = (accept: boolean, assignment: string) => void

    //on or get is for receiving, others can be used to emit
    const ON_CONNECTION = "connection"
    const ON_CREATE_COURSE = "createCourse"
    const ON_REMOVE_COURSE = "removeCourse"
    const ON_CREATE_ASSIGNMENT = "createAssignment"
    const ON_REMOVE_ASSIGNMENT = "removeAssignment"
    const ON_GET_USERS = "getUsers"
    const ON_ADD_USERS = "addUsers"

    //const GET_GROUPS = "getGroups"
    //const GET_GROUP_USERS = "getUsersIn"
    //const GET_RESULTS = "getResults"
    //const ON_UPDATE_FEEDBACK = "updateFeedback"
    //const GET_NON_FINAL = "getNonFinalHandIns"
    //const ON_HANDLE_NON_FINAL = "handleNonFinal"

    const RESULT_CREATE_COURSE = "courseCreated"
    const RESULT_CREATE_ASSIGNMENT = "assignmentCreated"
    const RESULT_REMOVE_COURSE = "courseRemoved"
    const RESULT_REMOVE_ASSIGNMENT = "assignmentRemoved"
    const RESULT_GET_USERS = "usersGot"
    const RESULT_ADD_USERS = "usersAdded"
    //const SEND_GROUPS = "setGroups"
    //const SEND_GROUP_USERS = "setUsersIn"
    //const SEND_NON_FINAL = "setNonFinalHandIns"
    //const SEND_RESULTS = "setResults"
    //const SEND_FEEDBACK = "feedbacked"

    export function bindHandlers(app: express.Express, io: SocketIO.Server) {
        io.on(ON_CONNECTION, connection(app))
    }

    export function connection(app: express.Express): Handler {
        return socket => {
            socket.on(ON_CREATE_COURSE, createCourse(app, socket))
            socket.on(ON_REMOVE_COURSE, removeCourse(app, socket))
            socket.on(ON_CREATE_ASSIGNMENT, createAssignment(app, socket))
            socket.on(ON_REMOVE_ASSIGNMENT, removeAssignment(app, socket))
            socket.on(ON_GET_USERS, getUsers(app, socket))
            socket.on(ON_ADD_USERS, addUsers(app, socket))
            //socket.on(GET_GROUPS, getGroupsOverview(app, socket))
            //socket.on(GET_GROUP_USERS, getOtherUsersIn(app, socket))
            //socket.on(GET_NON_FINAL, getNonFinalFiles(app, socket))
            //socket.on(ON_HANDLE_NON_FINAL, handleNonFinal(app, socket))
            //socket.on(GET_RESULTS, buildResults(app, socket))
            //socket.on(ON_UPDATE_FEEDBACK, updateFeedback(app, socket))
        }
    }

    //three below share too much, generalize
    //export function getGroupsOverview(app: express.Express, socket: SocketIO.Socket): SimpleCall {
    //    const sendGroups = (success: boolean, data: string | Error) => emitHtml(socket, SEND_GROUPS, success, data)

    //    return () => {
    //        if (socket.request.session.passport) {
    //            const user = socket.request.session.passport.user.id

    //            Groups.getOverviewForUser(user, lg => {
    //                Render.groupsOverview(app, "groups", lg, data => sendGroups(true, data), err => sendGroups(false, err))
    //            }, e => sendGroups(false, e))
    //        }
    //    }
    //}

    //export function getOtherUsersIn(app: express.Express, socket: SocketIO.Socket): GroupCall {
    //    const sendUsers = (success: boolean, data: string | Error) => emitHtml(socket, SEND_GROUP_USERS, success, data)

    //    return g => {
    //        if (socket.request.session.passport) {
    //            const user = socket.request.session.passport.user.id
    //            Groups.instance.getStudents(g, lu => {
    //                Render.users(app, "userList", lu.filter(v => v._id != user), html => sendUsers(true, html), err => sendUsers(false, err))
    //            }, e => sendUsers(false, e))
    //        }
    //    }
    //}

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

    //TODO still needs an isAdmin check!!!
    export function addUsers(app: express.Express, socket: SocketIO.Socket): AddUsersCall {
        const emitResult = (success: boolean, error?: string) => socket.emit(RESULT_ADD_USERS, success, error)

        return (users: string[], group:string, role:string) => {
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user
                if (user.admin) {
                    Groups.instance.addUsers(group, users, role == "admin").then(g => emitResult(true), e => emitResult(false, e))
                }
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

    //export function buildResults(app: express.Express, socket: SocketIO.Socket): ResultsCall {
    //    return (data, project) => {
    //        Render.results(app, "result", project, data, html => emitHtml(socket, SEND_RESULTS, true, html), err => emitHtml(socket, SEND_RESULTS, false, err))
    //    }
    //}

    //export function updateFeedback(app: express.Express, socket: SocketIO.Socket): feedbackCall {
    //    return (file, feedback) => {
    //        Files.instance.updateFeedback(file, feedback, (file) => socket.emit(SEND_FEEDBACK, true), err => socket.emit(SEND_FEEDBACK, false, err))
    //    }
    //}
    //export function emitHtml(socket: SocketIO.Socket, to: string, success: boolean, data: string | Error) {
    //    if (success) socket.emit(to, { success: true, html: data as string })
    //    else socket.emit(to, { success: false, err: (data instanceof Error ? data.message : data) })
    //}
}