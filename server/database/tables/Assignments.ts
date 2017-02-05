import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'
import { Groups } from './Groups'
import { Future } from '../../functional/Future'

class Assignment extends Table<Tables.Assignment> {
    addFile(assignment: string, file: string): Future<Tables.Assignment> {
        return this.updateOne(assignment, s => {
            if ((s.files as string[]).indexOf(file) < 0) (s.files as string[]).push(file)
        })
    }

    populateFiles<B>(query: Assignments.QueryA<B>): Assignments.QueryA<B> {
        return query.populate({
            path: "files",
            populate: {
                path: "students",
                select: "name surename"
            }
        }).populate({
            path: "group",
            select: "name"
        })
    }

    removeAssignment(assignment: string, removeRef: boolean): Future<Tables.Assignment> {
        return this.exec(this.getByID(assignment)).flatMap(a => a.remove()).flatMap(a => {
            if (removeRef) return Groups.instance.removeAssignment(a.group as string, a._id).map(g => a)
            else return Future.unit(a)
        })
    }
}

export namespace Assignments {
    export type Query = mongoose.DocumentQuery<Tables.Assignment[], Tables.Assignment>
    export type QueryOne = mongoose.DocumentQuery<Tables.Assignment, Tables.Assignment> 
    export type QueryA<A> = mongoose.DocumentQuery<A, Tables.Assignment> 

    export const instance = new Assignment(Tables.Assignment)
}