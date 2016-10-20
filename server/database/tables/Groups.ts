import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'
import { Users } from './Users'
import { List } from '../../functional/List'
import { Tuple, Tuple3 } from '../../functional/Tuple'

class Group extends Table<Tables.Group> {
    create(group: Tables.GroupTemplate, done: () => void, err: Table.Err) {
        super.create(group, () => {
            const addToGroup = (s: string) => Users.instance.addToGroup(s, group.id, false, false, done, err)

            group.students.forEach(addToGroup)
            group.admins.forEach(addToGroup)
        }, err)
    }

    addUser(g: string, s: string, admin:boolean, updateStudent: boolean, done: () => void, fail: Table.Err) {
        this.updateOne(g, (a: Tables.Group) => {
            if (admin) {
                if (a.admins.indexOf(s) == -1) a.admins.push(s)
            }
            else {
                if (a.students.indexOf(s) == -1) a.students.push(s)
            }
        }, a => {
            if (updateStudent) Users.instance.addToGroup(s, g, admin, false, done, fail)
            else done()
        }, fail)
    }

    addAssignment(g: string, project: string, deadline:Date, success: Table.SucOne<Tables.Group>, fail: Table.Err) {
        this.updateOne(g, (a: Tables.Group) => {
            a.assignments.push({ project: project, due: deadline })
        }, success, fail)
    }
}

export namespace Groups {
    type OverviewData = Tuple3<number, string, Date>
    type Open = Tables.Assignment
    type Closed = Tables.Assignment
    type DetailsData = Tuple<List<Open>, List<Closed>>

    interface GroupOverview {
        id: string,
        name: string,
        openAssignments: number,
        nextProject: string,
        nextDeadline: Date
    }

    interface GroupDetails {
        id: string,
        name: string,
        openAssignments: Open[],
        closedAssignments: Closed[]
    }

    export const instance = new Group(mongoose.model<Tables.Group>('group', Tables.group))

    export function getOverviewForUser(user: string, success: Table.Suc<GroupOverview>, fail: Table.Err) {
        Users.instance.getGroups(user, (gs) => success(groupsToOverview(gs)), fail)
    }

    export function getGroupDetails(g: string, success: Table.SucOne<GroupDetails>, fail: Table.Err) {
        instance.getByID(g, g => success(groupToDetails(g)), fail)
    }

    export function groupsToOverview(g: Tables.Group[]): GroupOverview[] {
        return List.apply(g).map(groupToOverview).toArray()
    }

    export function groupToOverview(g: Tables.Group): GroupOverview {
        const data: OverviewData = List.apply(g.assignments).foldLeft(new Tuple3(0, "", new Date()), foldAssignmentOverview)
        return mkGroupOverview(g.id, g.name, data._1, data._2, data._3)
    }   

    export function groupToDetails(g: Tables.Group): GroupDetails {
        const data: DetailsData = List.apply(g.assignments).foldLeft(new Tuple(List.apply([]), List.apply([])), foldAssignmentDetails)
        return mkGroupDetails(g.id, g.name, data._1.toArray(), data._2.toArray())
    }

    function foldAssignmentOverview(data: OverviewData, a: Tables.Assignment): OverviewData {
        if (a.due > new Date()) {
            if (data._3 < a.due) return new Tuple3(data._1 + 1, a.project, a.due)
            else return new Tuple3(data._1 + 1, data._2, data._3)
        } else return data
    }

    function foldAssignmentDetails(data: DetailsData, a: Tables.Assignment): DetailsData {
        if (a.due > new Date()) return new Tuple(data._1.add(a), data._2)
        else return new Tuple(data._1, data._2.add(a))
    }

    export function mkGroupOverview(id: string, name: string, openAssignments: number, nextProject: string, nextDeadline: Date): GroupOverview {
        return {
            id: id,
            name: name,
            openAssignments: openAssignments,
            nextProject: nextProject,
            nextDeadline: nextDeadline
        }
    }

    export function mkGroupDetails(id: string, name: string, open: Tables.Assignment[], closed: Tables.Assignment[]): GroupDetails {
        return {
            id: id,
            name: name,
            openAssignments: open,
            closedAssignments: closed
        }
    }
}