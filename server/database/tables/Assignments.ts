import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'

export namespace Assignments {
    export const instance = new Table(Tables.Assignment)
}