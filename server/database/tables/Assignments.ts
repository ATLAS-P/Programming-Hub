import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'
import { Future } from '../../functional/Future'

class Assignment extends Table<Tables.Assignment> {
    addFile(assignment: string, file: string): Future<Tables.Assignment> {
        return this.updateOne(assignment, s => {
            if (s.files.indexOf(file) < 0) s.files.push(file)
        })
    }

    populateFiles<B>(query: Assignments.QueryA<B>): Assignments.QueryA<B> {
        return query.populate({
            path: "files",
            populate: {
                path: "students.name students.surename"
            }
        })
    }
}

export namespace Assignments {
    export type Query = mongoose.DocumentQuery<Tables.Assignment[], Tables.Assignment>
    export type QueryOne = mongoose.DocumentQuery<Tables.Assignment, Tables.Assignment> 
    export type QueryA<A> = mongoose.DocumentQuery<A, Tables.Assignment> 

    export const instance = new Assignment(Tables.Assignment)
}