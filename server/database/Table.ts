import * as mongoose from 'mongoose'
import {List} from '../functional/List'

export class Table<A extends mongoose.Document> {
    model: mongoose.Model<A>

    constructor(m: mongoose.Model<A>) {
        this.model = m
    }

    get(query: {}, sort: {}, success: Table.Suc<A>, fail: Table.Err) {
        this.model.find(query).sort(sort).exec((err, res: A[]) => {
            if (err) fail(err)
            else success(res)
        })
    }

    getOne(query: {}, sort: {}, success: Table.SucOne<A>, fail: Table.Err) {
        this.model.findOne(query).sort(sort).exec((err, res: A) => {
            if (err) fail(err)
            else success(res)
        })
    }

    updateOne(id: string, update: (a: A) => void, success: Table.SucOne<A>, fail: Table.Err) {
        this.getByID(id, a => {
            if (a) {
                update(a)
                a.save((err, a: A, affect: number): void => {
                    if (err) fail(err)
                    else success(a)
                })
            } else fail("Query returned null, could not update")
        }, fail)
    }

    getByID(id: string, success: Table.SucOne<A>, fail: Table.Err) {
        this.getOne({ id: id }, {}, success, fail)
    }

    getByIDs(ids: string[], success: Table.Suc<A>, fail: Table.Err) {
        this.get({ id: { $in: ids } }, {}, success, fail)
    }

    getAll(success: Table.Suc<A>, fail: Table.Err) {
        this.get({}, {}, success, fail)
    }

    create(a: {}, done: () => void, fail: Table.Err) {
        this.model.create(a, (err, res) => {
            if (err) fail(err)
            else done()
        })
    }
}

export namespace Table {
    export type SucOne<A> = (res: A) => void
    export type Suc<A> = (res: A[]) => void
    export type Err = (err: any) => void

    export function error(err: any) {
        console.log(err)
    }

    export function done() {
        
    }
}

export namespace Tables {
    interface ProjectTemplate {
        name: string,
        id: string,
        level: number,
        info: string,
        type: string
    }
    export interface Project extends mongoose.Document, ProjectTemplate { }
    export function mkProject(id: string, name: string, level: number, info: string, type: string): ProjectTemplate {
        return {
            name: name,
            id: id,
            level: level,
            info: info,
            type: type
        }
    }

    export interface UserTemplate {
        name: string,
        surename: string,
        id: string,
        groups: string[],
        admin: boolean
    }
    export interface User extends mongoose.Document, UserTemplate { }
    export function mkUser(id: string, name: string, surename: string, admin: boolean = false, groups: string[] = []): UserTemplate {
        return {
            name: name,
            id: id,
            surename: surename,
            admin: admin,
            groups: groups
        }
    }

    export interface Assignment {
        project: string,
        due: Date
    }
    export interface GroupTemplate {
        id: string,
        name: string,
        students: string[],
        admins: string[],
        assignments: Assignment[]
    }
    export interface Group extends mongoose.Document, GroupTemplate { }
    export function mkGroup(id: string, name: string, students: string[] = [], admins: string[] = []): GroupTemplate {
        return {
            id: id,
            name: name,
            admins: admins,
            students: students,
            assignments: []
        }
    }

    export interface FileTemplate {
        student: string,
        assignment: string,
        timestamp: Date,
        partners: string[],
        html: string,
        final: boolean,
        reflection: string,
        feedback: string
    }
    export interface File extends mongoose.Document, FileTemplate { }
    export function mkFile(student: string, assignment: string, timestamp: Date, partners:string[], html:string, final:boolean, reflection:string, feedback:string = ""): FileTemplate {
        return {
            student: student,
            assignment: assignment,
            timestamp: timestamp,
            partners: partners,
            html: html,
            final: final,
            reflection: reflection,
            feedback: feedback
        }
    }

    export const project = new mongoose.Schema({
        name: String,
        id: String,
        level: Number,
        info: String,
        type: String
    })

    export const user = new mongoose.Schema({
        id: String,
        name: String,
        surename: String,
        groups: [String],
        admin: Boolean
    })

    export const group = new mongoose.Schema({
        id: String,
        name: String,
        assignments: [String],
        students: [String],
        admins: [String]
    }) 

    export const assignment = new mongoose.Schema({
        id: String,
        name: String,
        project: String,
        group: String,
        due: Date
    })

    export const file = new mongoose.Schema({
        student: String,
        assignment: String,
        timestamp: Date,
        partners: [String],
        html: String,
        final: Boolean,
        reflection: String,
        feedback: String
    })
}