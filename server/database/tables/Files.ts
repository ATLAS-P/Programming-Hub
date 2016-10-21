import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'

class File extends Table<Tables.File> {
    getByID(id: string, success: Table.SucOne<Tables.File>, fail: Table.Err) {
        fail("Get by ID function not supported for file, use getForStudent instead")
    }

    getForStudent(s: string, g: string, success: Table.Suc<Tables.File>, fail: Table.Err) {
        super.get({ student: s, group: s }, {}, success, fail)
    }
}

export namespace Files {
    export const instance = new File(Tables.File)
}