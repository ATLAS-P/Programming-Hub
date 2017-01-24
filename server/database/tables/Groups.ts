import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'
import { Users } from './Users'
import { Assignments } from './Assignments'
import { Files } from './Files'
import { List } from '../../functional/List'
import { Tuple, Tuple3 } from '../../functional/Tuple'
import { Future } from '../../functional/Future'
import { IOMap } from '../../functional/IOMap'

class Group extends Table<Tables.Group> {
    create(g: Tables.GroupTemplate): Future<Tables.Group> {
        return super.create(g).flatMap(group => {
            const addToGroup = (s: string) => Future.lift(Users.instance.addToGroup(s, group._id, false, false).then(user =>
                List.mk<string>(), (err) =>
                    List.mk<string>(err)))

            const users = List.apply(group.students).append(List.apply(group.admins))
            const error = IOMap.traverse<string, List<string>, List<string>>(users, IOMap.apply).run(addToGroup).map(s => List.concat(s))

            return error.flatMap(errors => {
                if (errors.length() == 0) return Future.unit(group)
                else return Future.reject(new Tuple(group, errors))
            })
        })
    }

    addUser(g: string, s: string, admin: boolean, updateStudent: boolean): Future<Tables.Group> {
        return this.updateOne(g, (a: Tables.Group) => {
            if (admin) if (a.admins.indexOf(s) == -1) a.admins.push(s)
            else if (a.students.indexOf(s) == -1) a.students.push(s)
        }).flatMap(a => {
            if (updateStudent) return Users.instance.addToGroup(s, g, admin, false).map(u => a)
            else return Future.unit(a)
        })
    }

    mkAndAddAssignment(g: string, assignment: Tables.AssignmentTemplate): Future<Tables.Assignment> {
        return Assignments.instance.create(assignment).flatMap(a => this.addAssignment(g, a._id).map(g => a))
    }

    addAssignment(g: string, ass: string): Future<Tables.Group> {
        return this.updateOne(g, a => a.assignments.push(ass))
    }

    populateAssignments<B>(query: Groups.QueryA<B>, deep: boolean): Groups.QueryA<B> {
        const pop = {
            path: "assignments",
            options: deep ? {
                populate: {
                    path: "project"
                },
                sort: { due: 1 }
            } : {
                sort: { due: 1 }
            }
        }

        return query.populate(pop)
    }

    populateStudents<B>(query: Groups.QueryA<B>): Groups.QueryA<B> {
        return this.populateUserType(query, "students.name students.surename")
    }

    populateAdmins<B>(query: Groups.QueryA<B>): Groups.QueryA<B> {
        return this.populateUserType(query, "admins.name admins.surename")
    }

    populateUsers<B>(query: Groups.QueryA<B>): Groups.QueryA<B> {
        return this.populateStudents(this.populateAdmins(query))
    }

    populateAll<B>(query: Groups.QueryA<B>, deep:boolean): Groups.QueryA<B> {
        return this.populateAssignments(this.populateUsers(query), deep)
    }

    populateFiles<B>(query: Groups.QueryA<B>, fileFileter: {} = {}): Groups.QueryA<B> {
        return query.populate({
            path: "assignments",
            populate: {
                path: "files",
                match: fileFileter,
                populate: {
                    path: "students.name students.surename"
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
        return this.map(this.populateStudents(this.getByID(g)), g => (g.students as any) as Tables.User[])
    }

    getAdmins(g: string): Future<Tables.User[]> {
        return this.map(this.populateAdmins(this.getByID(g)), g => (g.admins as any) as Tables.User[])
    }

    isAdmin(g: string, user: string): Future<boolean> {
        return this.map(this.getByID(g), g => g.admins.indexOf(user) >= 0)
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
        return instance.exec(instance.getByID(group))
    }
}