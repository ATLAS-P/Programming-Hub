import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'
import { Users } from './Users'
import { Assignments } from './Assignments'
import { Projects } from './Projects'
import { Files } from './Files'
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

    addAssignment(g: string, ass: string, success: Table.SucOne<Tables.Group>, fail: Table.Err) {
        Groups.instance.updateOne(g, a => a.assignments.push(ass), success, fail)
    }

    getAndPopulate(query: {}, deep: boolean, users: boolean, success: Table.Suc<Tables.PopulatedGroup>, fail: Table.Err, sort: {} = {}) {
        const pop = deep ? {
            path: users ? "assignments students admins" : "assignments",
            options: {
                populate: {
                    path: "project"
                },
                sort: { due: 1 }
            }
        } : {
            path: "assignments", options: {
                sort: { due: 1 }
            }
        }

        this.do(this.model.find(query).populate(pop).sort(sort), g => {
            success((g as {}[]) as Tables.PopulatedGroup[])
        }, fail)
    }



    getStudents(g: string, success: Table.Suc<Tables.User>, fail: Table.Err) {
        this.populateStudents(g, g => success((g.students as any) as Tables.User[]), fail)
    }

    isAdmin(g: string, user: string, success: Table.SucOne<boolean>, fail: Table.Err) {
        this.getByID(g, g => success(g.admins.indexOf(user) >= 0), fail)
    }

    populateStudents(g: string, success: Table.SucOne<Tables.Group>, fail: Table.Err) {
        this.do(this.model.find({ _id: g }).populate({
            path: "students",
            options: {
                sort: {
                    name: 1,
                    surename: 1,
                    _id: 1
                }
            }
        }), g => success(g[0]), fail)
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
        admins: string[],
        openAssignments: Open[],
        closedAssignments: Closed[],
        doneAssignments: Tables.PopulatedAssignment[]
    }

    export const instance = new Group(Tables.Group)

    //expensive... perhaps better to not show upcomming deadlines per group this way... although with this it is easy to extract upcomming deadlines and those can also be given then
    export function getOverviewForUser(user: string, success: Table.Suc<GroupOverview>, fail: Table.Err) {
        Users.instance.getGroups(user, false, (gs) => {
            const lg = List.apply(gs)
            const assignments = List.concat(lg.map(g => List.apply(g.assignments.map(a => a._id)))).toArray()
            Files.instance.getAssignmentsFinal(user, assignments, files => {
                success(groupsToOverview(lg.map(g => {
                    const open = g.assignments.filter(a => files.find(f => f.assignment == a._id) ? false : true)
                    g.assignments = open
                    return g
                }).toArray()))
            }, fail)
        }, fail)
    }

    export function getGroupDetails(s:string, g: string, success: Table.SucOne<GroupDetails>, fail: Table.Err) {
        instance.getAndPopulate({ _id: g }, true, false, g => {
            let assignments = List.apply(g[0].assignments)

            Files.instance.getAssignmentsFinal(s, assignments.map(a => a._id).toArray(), files => {
                let split = assignments.filter2(a => files.find(f => f.assignment == a._id)? true:false)

                let doneAss = split._1.map(a => {
                    a.due = files.find(f => f.assignment == a._id).timestamp
                    return a
                })
                const openClosed: DetailsData = List.apply(split._2.toArray()).foldLeft(new Tuple(List.apply([]), List.apply([])), foldAssignmentDetails)

                success(mkGroupDetails(g[0]._id, g[0].name, g[0].admins as any as string[], openClosed._1.toArray(), openClosed._2.toArray(), doneAss.toArray()))
            }, fail)
        }, fail)
    }

    function groupsToOverview(g: Tables.PopulatedGroup[]): GroupOverview[] {
        return List.apply(g).map(groupToOverview).toArray()
    }

    function groupToOverview(g: Tables.PopulatedGroup): GroupOverview {
        const data: OverviewData = List.apply((g.assignments as {}[]) as Tables.AssignmentTemplate[]).foldLeft(new Tuple3(0, "", new Date()), foldAssignmentOverview)
        return mkGroupOverview(g._id, g.name, data._1, data._2, data._3)
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

    function mkGroupDetails(id: string, name: string, admins:string[], open: Open[], closed: Closed[], done: Tables.PopulatedAssignment[]): GroupDetails {
        return {
            id: id,
            name: name,
            admins: admins,
            openAssignments: open,
            closedAssignments: closed,
            doneAssignments: done
        }
    }
}