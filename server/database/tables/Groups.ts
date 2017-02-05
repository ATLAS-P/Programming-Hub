import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'
import { MkTables } from '../MkTables'
import { Users } from './Users'
import { Assignments } from './Assignments'
import { Files } from './Files'
import { List } from '../../functional/List'
import { Tuple, Tuple3 } from '../../functional/Tuple'
import { Future } from '../../functional/Future'
import { IOMap } from '../../functional/IOMap'

class Group extends Table<Tables.Group> {
    create(g: MkTables.GroupTemplate): Future<Tables.Group> {
        return super.create(g).flatMap(group => {
            const addToGroup = (s: string) => Future.lift(Users.instance.addToGroup(s, group._id, false, false).then(user =>
                List.mk<string>(), (err) =>
                    List.mk<string>(err)))

            const users = List.apply(group.students as string[]).append(List.apply(group.admins as string[]))
            const error = IOMap.traverse<string, List<string>, List<string>>(users, IOMap.apply).run(addToGroup).map(s => List.concat(s))

            return error.flatMap(errors => {
                if (errors.length() == 0) return Future.unit(group)
                else return Future.reject(new Tuple(group, errors))
            })
        })
    }

    addUser(g: string, s: string, admin: boolean, updateStudent: boolean): Future<Tables.Group> {
        return this.updateOne(g, (a: Tables.Group) => {
            if (admin) if ((a.admins as string[]).indexOf(s) == -1) (a.admins as string[]).push(s)
            else if ((a.students as string[]).indexOf(s) == -1) (a.students as string[]).push(s)
        }).flatMap(a => {
            if (updateStudent) return Users.instance.addToGroup(s, g, admin, false).map(u => a)
            else return Future.unit(a)
        })
    }

    addUsers(g: string, users: string[], admin: boolean): Future<Tables.Group> {
        const addToGroup = (s: string) => Future.lift(Users.instance.addToGroup(s, g, false, false).then(user =>
            List.mk<string>(), (err) =>
                List.mk<string>(err)))

        const error = IOMap.traverse<string, List<string>, List<string>>(List.apply(users), IOMap.apply).run(addToGroup).map(s => List.concat(s))
        return this.updateOne(g, group => {
            users.forEach(u => {
                const coll = admin ? group.admins as string[] : group.students as string[]
                if (coll.indexOf(u) == -1) coll.push(u)
            })
        }).flatMap(group => error.flatMap(e => {
            if (e.length() == 0) return Future.unit(group)
            else return Future.reject(e.foldLeft('', (acc, next) => acc + next + ""))
        }))
    }

    removeUser(g: string, s: string, admin: boolean, updateStudent: boolean): Future<Tables.Group> {
        return this.updateOne(g, (a: Tables.Group) => {
            const collection = (admin ? a.admins : a.students) as string[]
            const index = collection.indexOf(s)
            if (index >= 0) collection.splice(index, 1)
        }).flatMap(a => {
            if (updateStudent) return Users.instance.removeFromGroup(s, g, admin, false).map(u => a)
            else return Future.unit(a)
        })
    }

    removeAssignment(g: string, assignment: string, destrory:boolean = false): Future<Tables.Group> {
        return this.updateOne(g, group => {
            const index = (group.assignments as string[]).indexOf(assignment)
            if (index >= 0) (group.assignments as string[]).splice(index, 1)
        }).flatMap(group => {
            if (destrory) return Assignments.instance.removeAssignment(assignment, false).map(a => group)
            else return Future.unit(group)
        })
    }

    mkAndAddAssignment(g: string, assignment: MkTables.AssignmentTemplate): Future<Tables.Assignment> {
        return Assignments.instance.create(assignment).flatMap(a => this.addAssignment(g, a._id).map(g => a))
    }

    addAssignment(g: string, ass: string): Future<Tables.Group> {
        return this.updateOne(g, a => (a.assignments as string[]).push(ass))
    }

    populateAssignments<B>(query: Groups.QueryA<B>): Groups.QueryA<B> {
        const pop = {
            path: "assignments",
            options: {
                sort: { due: 1 }
            }
        }

        return query.populate(pop)
    }

    populateStudents<B>(query: Groups.QueryA<B>): Groups.QueryA<B> {
        return this.populateUserType(query, "students") //only return name and surename, not all
    }

    populateAdmins<B>(query: Groups.QueryA<B>): Groups.QueryA<B> {
        return this.populateUserType(query, "admins") //only return name and surename, not all
    }

    populateUsers<B>(query: Groups.QueryA<B>): Groups.QueryA<B> {
        return this.populateStudents(this.populateAdmins(query))
    }

    populateFiles<B>(query: Groups.QueryA<B>, fileFileter: {} = {}): Groups.QueryA<B> {
        return query.populate({
            path: "assignments",
            populate: {
                path: "files",
                match: fileFileter,
                populate: {
                    path: "students",
                    select: "name surename"
                }
            }
        })
    }

    private populateUserType<B>(query: Groups.QueryA<B>, typ: string): Groups.QueryA<B> {
        return query.populate({
            path: typ,
            options: {
                sort: { name: 1, surename: 1, _id: 1 }
            }
        })
    }

    getStudents(g: string): Future<Tables.User[]> {
        return this.map(this.populateStudents(this.getByID(g)), g => g.students as Tables.User[])
    }

    getAdmins(g: string): Future<Tables.User[]> {
        return this.map(this.populateAdmins(this.getByID(g)), g => g.admins as Tables.User[])
    }

    isAdmin(g: string, user: string): Future<boolean> {
        return this.map(this.getByID(g), g => (g.admins as string[]).indexOf(user) >= 0)
    }
}

export namespace Groups {
    export type QueryA<A> = mongoose.DocumentQuery<A, Tables.Group>
    export type Query = mongoose.DocumentQuery<Tables.Group[], Tables.Group>
    export type QueryOne = mongoose.DocumentQuery<Tables.Group, Tables.Group> 

    export const instance = new Group(Tables.Group)

    export function getGroups(user: string): Future<Tables.Group[]> {
        return Users.instance.getGroups(user)
    }

    export function getGroup(group: string): Future<Tables.Group> {
        return instance.exec(instance.populateUsers(instance.populateAssignments(instance.getByID(group))))
    }

    export function removeGroup(group: string): Future<void> {
        return instance.exec(instance.getByID(group), true).flatMap(g => {
            const removeFromGroup = (s: string) => Future.lift(Users.instance.removeFromGroup(s, g._id, false, false).then(user =>
                List.mk<string>(), (err) =>
                    List.mk<string>(err)))

            const users = List.apply(g.students as string[]).append(List.apply(g.admins as string[]))
            const error = IOMap.traverse<string, List<string>, List<string>>(users, IOMap.apply).run(removeFromGroup).map(s => List.concat(s))

            return Future.lift(g.remove()).flatMap(g => error).flatMap(errors => {
                if (errors.length() == 0) return Future.unit(null)
                else return Future.reject<void>(errors.foldLeft("", (acc, e) => acc + e + " "))
            })
        })
    }
}