import * as mongoose from 'mongoose'
import { List } from '../functional/List'
import { Future } from '../functional/Future'
import { IOMap } from '../functional/IOMap'
import { MkTables } from './MkTables'

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
                if (err) reject(err.message)
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
        files: [refrence("File")],
        due: Date,
        group: refrence("Group"),
        name: String,
        link: String,
        typ: String,
        project: String
    })

    export const group = new mongoose.Schema({
        name: String,
        assignments: [refrence("Assignment")],
        students: [refrence("User")],
        admins: [refrence("User")],
        start: Date,
        end: Date
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
        urls: [String],
        name: String
    })

    function refrence(to: string): {} {
        return { type: String, ref: to }
    }

    export interface User extends mongoose.Document, MkTables.UserTemplate { }
    export interface Assignment extends mongoose.Document, MkTables.AssignmentTemplate { }
    export interface Group extends mongoose.Document, MkTables.GroupTemplate { }
    export interface File extends mongoose.Document, MkTables.FileTemplate { }

    export const User = mongoose.model<User>('User', user)
    export const Assignment = mongoose.model<Assignment>('Assignment', assignment)
    export const File = mongoose.model<File>('File', file)
    export const Group = mongoose.model<Group>('Group', group)
}