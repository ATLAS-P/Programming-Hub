import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'

export namespace Projects {
    export const instance = new Table(Tables.Project)
}