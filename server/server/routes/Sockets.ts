import { Routes } from './Routes'
import { Render } from './Render'
import { TestJSON } from '../../autograder/Result'
import { Groups } from '../../database/tables/Groups'
import { Files } from '../../database/tables/Files'

import * as express from "express"

export namespace Sockets {
    type Handler = (socket: SocketIO.Socket) => void
    type SimpleCall = () => void
    type GroupCall = (group: string) => void
    type feedbackCall = (file:string, feedback: string) => void
    type ResultsCall = (data: TestJSON<any>[], project:string) => void
    type NonFinalCall = (accept: boolean, assignment: string) => void

    //on or get is for receiving, others can be used to emit
    const ON_CONNECTION = "connection"
    const GET_GROUPS = "getGroups"
    const GET_GROUP_USERS = "getUsersIn"
    const GET_RESULTS = "getResults"
    const ON_UPDATE_FEEDBACK = "updateFeedback"
    const GET_NON_FINAL = "getNonFinalHandIns"
    const ON_HANDLE_NON_FINAL = "handleNonFinal"

    const SEND_GROUPS = "setGroups"
    const SEND_GROUP_USERS = "setUsersIn"
    const SEND_NON_FINAL = "setNonFinalHandIns"
    const SEND_RESULTS = "setResults"
    const SEND_FEEDBACK = "feedbacked"

    export function bindHandlers(app: express.Express, io: SocketIO.Server) {
        io.on(ON_CONNECTION, connection(app))
    }

    export function connection(app: express.Express): Handler {
        return socket => {
            console.log("socket connected")

            socket.on(GET_GROUPS, getGroupsOverview(app, socket))
            socket.on(GET_GROUP_USERS, getOtherUsersIn(app, socket))
            socket.on(GET_NON_FINAL, getNonFinalFiles(app, socket))
            socket.on(ON_HANDLE_NON_FINAL, handleNonFinal(app, socket))
            socket.on(GET_RESULTS, buildResults(app, socket))
            socket.on(ON_UPDATE_FEEDBACK, updateFeedback(app, socket))
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
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user.id
                Groups.instance.getStudents(g, lu => {
                    Render.users(app, "userList", lu.filter(v => v._id != user), html => sendUsers(true, html), err => sendUsers(false, err))
                }, e => sendUsers(false, e))
            }
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
            if (socket.request.session.passport) {
                const user = socket.request.session.passport.user.id

                if (accept) Files.instance.mkFinal(user, ass)
                else Files.instance.removeNonFinal(user, ass)
            }
        }
    }

    export function buildResults(app: express.Express, socket: SocketIO.Socket): ResultsCall {
        return (data, project) => {
            Render.results(app, "result", project, data, html => emitHtml(socket, SEND_RESULTS, true, html), err => emitHtml(socket, SEND_RESULTS, false, err))
        }
    }

    export function updateFeedback(app: express.Express, socket: SocketIO.Socket): feedbackCall {
        return (file, feedback) => {
            console.log(file, feedback)
            Files.instance.updateFeedback(file, feedback, (file) => socket.emit(SEND_FEEDBACK, true), err => socket.emit(SEND_FEEDBACK, false, err))
        }
    }
    export function emitHtml(socket: SocketIO.Socket, to: string, success: boolean, data: string | Error) {
        if (success) socket.emit(to, { success: true, html: data as string })
        else socket.emit(to, { success: false, err: (data instanceof Error ? data.message : data) })
    }
}