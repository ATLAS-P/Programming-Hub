import * as mongoose from 'mongoose'
import { List } from '../functional/List'
import { TestJSON } from '../autograder/Result'
import { Future } from '../functional/Future'
import { IOMap } from '../functional/IOMap'

//change all to use promise no callback
export class Table<A extends mongoose.Document> {
    model: mongoose.Model<A>

    constructor(m: mongoose.Model<A>) {
        this.model = m
    }

    exec<B>(query: mongoose.DocumentQuery<B, A>, alwaysOne: boolean = true): Future<B> {
        const exists = res => {
            if (!res) return false
            else if ((res as A[]).length) {
                return (res as A[]).length > 0
            } else return true
        }

        return new Future<B>((resolve, reject) => {
            query.exec((err, res: B) => {
                if (err) reject(err)
                else if (alwaysOne && !exists(res)) reject("No entries found")
                else resolve(res)
            })
        })
    } 

    get(query: {}): mongoose.DocumentQuery<A[], A> {
        return this.model.find(query)
    }

    getByIDs(ids: string[]): mongoose.DocumentQuery<A[], A> {
        return this.get({ _id: { $in: ids } })
    }

    getAll(): mongoose.DocumentQuery<A[], A> {
        return this.get({})
    }

    getOne(query: {}): mongoose.DocumentQuery<A, A> {
        return this.model.findOne(query)
    }

    getByID(id: string): mongoose.DocumentQuery<A, A> {
        return this.getOne({ _id: id })
    }

    updateOne(id: string, update: (a: A) => void): Future<A> {
        return this.exec(this.getByID(id)).flatMap(a => {
            update(a)
            return a.save()
        })
    }

    update(ids: string[], update: (a: A) => void): Future<A[]> {
        return this.exec(this.getByIDs(ids)).flatMap(a => {
            return IOMap.traverse<A, A, A>(List.apply(a), IOMap.apply).run(a2 => {
                update(a2)
                return Future.lift(a2.save())
            }).map(la => la.toArray())
        })
    }

    create(a: {}): Future<A> {
        return Future.lift(this.model.create(a))
    }

    map<B>(query: mongoose.DocumentQuery<A, A>, f: (a: A) => B): Future<B> {
        return this.exec(query, true).map(f)
    }
}

export namespace Tables {
    export interface UserTemplate {
        _id: any,
        name: string,
        surename: string,
        groups: {
            group: string,
            files: {
                final: boolean,
                file: string
            }[]
        }[],
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

    export interface AssignmentTemplate {
        _id: any
        due: Date
        files: string[]
        name: string
        group: string
        link: string
        project: string
        typ: string
    }
    export interface Assignment extends mongoose.Document, AssignmentTemplate { }
    export function mkAssignment(id: string, name: string, group: string, due: Date, typ:string, link:string = "", project:string = ""): AssignmentTemplate {
        return {
            _id: id,
            name: name,
            due: due,
            files: [],
            typ: typ,
            project: project,
            link: link,
            group: group
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
        assignments: AssignmentTemplate[]
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
        students: string[],
        assignment: string,
        group: string,
        timestamp: Date,
        autograder: Object[],
        notes: string,
        feedback: string,
        urls: string[]
    }
    export interface File extends mongoose.Document, FileTemplate { }
    export function mkFile(assignment: string, group: string, timestamp: Date, students: string[], files: string[], notes: string, feedback: string = "", autograder: TestJSON<any>[]): FileTemplate {
        return {
            students: students,
            assignment: assignment,
            timestamp: timestamp,
            autograder: autograder,
            notes: notes,
            feedback: feedback,
            group: group,
            urls: files
        }
    }

    export const user = new mongoose.Schema({
        _id: String,
        name: String,
        surename: String,
        groups: [{
            group: refrence("Group"),
            files: [{
                final: Boolean,
                file: refrence("File")
            }]
        }],
        admin: Boolean
    })

    export const assignment = new mongoose.Schema({
        _id: String,
        files: [refrence("File")],
        due: Date,
        group: String,
        name: String,
        link: String,
        typ: String,
        project: String
    })

    export const group = new mongoose.Schema({
        _id: String,
        name: String,
        assignments: [refrence("Assignment")],
        students: [refrence("User")],
        admins: [refrence("User")]
    }) 

    export const file = new mongoose.Schema({
        assignment: refrence("Assignment"),
        timestamp: Date,
        students: [refrence("User")],
        autograder: [{
            input: Object,
            success: Boolean,
            message: String
        }],
        notes: String,
        feedback: String,
        urls: [String]
    })

    function refrence(to: string): {} {
        return { type: String, ref: to }
    }

    export const Assignment = mongoose.model<Tables.Assignment>('Assignment', Tables.assignment)
    export const File = mongoose.model<Tables.File>('File', Tables.file)
    export const Group = mongoose.model<Group>('Group', Tables.group)
    export const User = mongoose.model<User>('User', Tables.user)
}