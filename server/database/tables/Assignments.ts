import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'

class Assignment extends Table<Tables.Assignment> {
    addFile(assignment: string, file: string, success: () => void, fail: Table.Err) {
        this.updateOne(assignment, s => {
            if (s.files.indexOf(file) < 0) s.files.push(file)
        }, a => success(), fail)
    }
}

export namespace Assignments {
    export const instance = new Assignment(Tables.Assignment)
}