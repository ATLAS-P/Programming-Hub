import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'
import { Users } from './Users'
import { Assignments } from './Assignments'
import { List } from '../../functional/List'
import { Tuple, Tuple3 } from '../../functional/Tuple'

class Group extends Table<Tables.Group> {
    create(group: Tables.GroupTemplate, done: () => void, err: Table.Err) {
        super.create(group, () => {
            const addToGroup = (s: string) => Users.instance.addToGroup(s, group._id, false, false, done, err)

            group.students.forEach(addToGroup)
            group.admins.forEach(addToGroup)
        }, err)
    }

    addUser(g: string, s: string, admin: boolean, updateStudent: boolean, done: () => void, fail: Table.Err) {
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

    mkAndAddAssignment(g: string, assignment: Tables.AssignmentTemplate, success: Table.SucOne<Tables.Group>, fail: Table.Err) {
        Assignments.instance.create(assignment, () => Groups.instance.addAssignment(g, assignment._id, success, fail), fail)
    }

    addAssignment(g: string, ass:string, success: Table.SucOne<Tables.Group>, fail: Table.Err) {
        Groups.instance.updateOne(g, a => a.assignments.push(ass), success, fail)
    }

    getAndPopulate(query: {}, deep: boolean, users:boolean, success: Table.Suc<Tables.PopulatedGroup>, fail: Table.Err) {
        const pop = deep ? {
            path: users ? "assignments students admins" :"assignments",
            populate: {
                path: "project"
            }
        } : { path: "assignments" }

        this.do(this.model.find(query).populate(pop), g => {
            success((g as {}[]) as Tables.PopulatedGroup[])
        }, fail)
    }
}

export namespace Groups {
    type OverviewData = Tuple3<number, string, Date>
    type Open = Tables.PopulatedAssignment
    type Closed = Tables.PopulatedAssignment
    type DetailsData = Tuple<List<Open>, List<Closed>>

    export interface GroupOverview {
        id: string,
        name: string,
        openAssignments: number,
        nextProject: string,
        nextDeadline: Date
    }

    export interface GroupDetails {
        id: string,
        name: string,
        openAssignments: Open[],
        closedAssignments: Closed[]
    }

    export const instance = new Group(Tables.Group)

    export function getOverviewForUser(user: string, success: Table.Suc<GroupOverview>, fail: Table.Err) {
        Users.instance.getGroups(user, false, (gs) => success(groupsToOverview(gs)), fail)
    }

    export function getGroupDetails(g: string, success: Table.SucOne<GroupDetails>, fail: Table.Err) {
        instance.getAndPopulate({ _id: g }, true, false, g => {
            success(groupToDetails(g[0]))
        }, fail)
    }

    function groupsToOverview(g: Tables.PopulatedGroup[]): GroupOverview[] {
        return List.apply(g).map(groupToOverview).toArray()
    }

    function groupToOverview(g: Tables.PopulatedGroup): GroupOverview {
        const data: OverviewData = List.apply((g.assignments as {}[]) as Tables.AssignmentTemplate[]).foldLeft(new Tuple3(0, "", new Date()), foldAssignmentOverview)
        return mkGroupOverview(g._id, g.name, data._1, data._2, data._3)
    }   

    function groupToDetails(g: Tables.PopulatedGroup): GroupDetails {
        const data: DetailsData = List.apply(g.assignments).foldLeft(new Tuple(List.apply([]), List.apply([])), foldAssignmentDetails)
        return mkGroupDetails(g._id, g.name, data._1.toArray(), data._2.toArray())
    }

    function foldAssignmentOverview(data: OverviewData, a: Tables.AssignmentTemplate): OverviewData {
        if (a.due > new Date()) {
            if (data._3 < a.due) return new Tuple3(data._1 + 1, a.project, a.due)
            else return new Tuple3(data._1 + 1, data._2, data._3)
        } else return data
    }

    function foldAssignmentDetails(data: DetailsData, a: Tables.PopulatedAssignment): DetailsData {
        if (a.due > new Date()) return new Tuple(data._1.add(a), data._2)
        else return new Tuple(data._1, data._2.add(a))
    }

    function mkGroupOverview(id: string, name: string, openAssignments: number, nextProject: string, nextDeadline: Date): GroupOverview {
        return {
            id: id,
            name: name,
            openAssignments: openAssignments,
            nextProject: nextProject,
            nextDeadline: nextDeadline
        }
    }

    function mkGroupDetails(id: string, name: string, open: Tables.PopulatedAssignment[], closed: Tables.PopulatedAssignment[]): GroupDetails {
        return {
            id: id,
            name: name,
            openAssignments: open,
            closedAssignments: closed
        }
    }
}