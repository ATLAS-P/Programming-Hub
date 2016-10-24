import * as mongoose from 'mongoose'
import {List} from '../functional/List'

//change all to use promise no callback
export class Table<A extends mongoose.Document> {
    model: mongoose.Model<A>

    constructor(m: mongoose.Model<A>) {
        this.model = m
    }

    get(query: {}, sort: {}, success: Table.Suc<A>, fail: Table.Err) {
        this.model.find(query).sort(sort).exec((err, res: A[]) => {
            if (err) fail(err)
            else if (res.length == 0) fail("No entries found")
            else success(res)
        })
    }

    getOne(query: {}, sort: {}, success: Table.SucOne<A>, fail: Table.Err, safe:boolean = true) {
        this.model.findOne(query).sort(sort).exec((err, res: A) => {
            if (err) fail(err)
            else if (!res && safe) fail("No entries found")
            else success(res)
        })
    }

    updateOne(id: string, update: (a: A) => void, success: Table.SucOne<A>, fail: Table.Err) {
        this.getByID(id, a => {
            update(a)
            a.save((err, a: A, affect: number): void => {
                if (err) fail(err)
                else success(a)
            })
        }, fail)
    }

    do(query: mongoose.DocumentQuery<A[], A>, success: Table.Suc<A>, fail: Table.Err) {
        query.exec((err, res) => {
            if (err) fail(err)
            else if (res.length == 0) fail("No entries found")
            else success(res)
        })
    }

    doOne(query: mongoose.DocumentQuery<A, A>, success: Table.SucOne<A>, fail: Table.Err) {
        query.exec((err, res) => {
            if (err) fail(err)
            else if (!res) fail("No entries found")
            else success(res)
        })
    }

    getByID(id: string, success: Table.SucOne<A>, fail: Table.Err, safe:boolean = true) {
        this.getOne({ _id: id }, {}, success, fail, safe)
    }

    getByIDs(ids: string[], success: Table.Suc<A>, fail: Table.Err) {
        this.get({ _id: { $in: ids } }, {}, success, fail)
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
        console.log("done!")
    }
}

export namespace Tables {
    interface ProjectTemplate {
        _id: any,
        name: string,
        level: number,
        info: string,
        type: string
    }
    export interface Project extends mongoose.Document, ProjectTemplate { }
    export function mkProject(id: string, name: string, level: number, info: string, type: string): ProjectTemplate {
        return {
            name: name,
            _id: id,
            level: level,
            info: info,
            type: type
        }
    }

    export interface UserTemplate {
        _id: any,
        name: string,
        surename: string,
        groups: string[],
    }
    export interface User extends mongoose.Document, UserTemplate { }
    export function mkUser(id: string, name: string, surename: string): UserTemplate {
        return {
            name: name,
            _id: id,
            surename: surename,
            groups: []
        }
    }

    interface GenericAssignment {
        _id: any
        due: Date
    }
    export interface AssignmentTemplate extends GenericAssignment {
        project: string
    }
    export interface PopulatedAssignment extends GenericAssignment {
        project: ProjectTemplate,
    }
    export interface Assignment extends mongoose.Document, AssignmentTemplate { }
    export function mkAssignment(id: string, project: string, due: Date): AssignmentTemplate {
        return {
            _id: id,
            project: project,
            due: due
        }
    }

    interface GenericGroup {
        _id: any,
        name: string
    }
    export interface GroupTemplate extends GenericGroup {
        assignments: string[],
        students: string[],
        admins: string[],
    }
    export interface PopulatedGroup extends GenericGroup {
        assignments: PopulatedAssignment[]
        students: UserTemplate[],
        admins: UserTemplate[]
    }
    export interface Group extends mongoose.Document, GroupTemplate { }
    export function mkGroup(id: string, name: string, students: string[] = [], admins: string[] = []): GroupTemplate {
        return {
            _id: id,
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
        html: Object,
        final: boolean,
        reflection: string,
        feedback: string
    }
    export interface File extends mongoose.Document, FileTemplate { }
    export function mkFile(student: string, assignment: string, timestamp: Date, partners: string[], json: Object, final:boolean, reflection:string, feedback:string = ""): FileTemplate {
        return {
            student: student,
            assignment: assignment,
            timestamp: timestamp,
            partners: partners,
            html: json,
            final: final,
            reflection: reflection,
            feedback: feedback
        }
    }

    export const project = new mongoose.Schema({
        _id: String,
        name: String,
        level: Number,
        info: String,
        type: String
    })

    export const user = new mongoose.Schema({
        _id: String,
        name: String,
        surename: String,
        groups: [refrence("Group")],
        admin: Boolean
    })

    export const assignment = new mongoose.Schema({
        _id: String,
        project: refrence("Project"),
        due: Date
    })

    export const group = new mongoose.Schema({
        _id: String,
        name: String,
        assignments: [refrence("Assignment")],
        students: [refrence("User")],
        admins: [refrence("User")]
    }) 

    export const file = new mongoose.Schema({
        student: refrence("User"),
        assignment: refrence("Assignment"),
        timestamp: Date,
        partners: [refrence("User")],
        html: Object,
        final: Boolean,
        reflection: String,
        feedback: String
    })

    function refrence(to: string): {} {
        return { type: String, ref: to }
    }

    export const Assignment = mongoose.model<Tables.Assignment>('Assignment', Tables.assignment)
    export const File = mongoose.model<Tables.File>('File', Tables.file)
    export const Group = mongoose.model<Group>('Group', Tables.group)
    export const User = mongoose.model<User>('User', Tables.user)
    export const Project = mongoose.model<Project>('Project', Tables.project)
}