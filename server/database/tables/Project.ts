import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'

export namespace Project {
    export const instance = new Table(mongoose.model<Tables.Project>('project', Tables.project))
}