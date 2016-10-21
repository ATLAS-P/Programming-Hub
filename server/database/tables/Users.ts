import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'
import { Groups } from './Groups'

class User extends Table<Tables.User> {
    addToGroup(s: string, g: string, updateGroup: boolean, admin: boolean, done: () => void, fail: Table.Err) {
        this.updateOne(s, (a: Tables.User) => {
            if (a.groups.indexOf(g) == -1) a.groups.push(g)
        }, a => {
            if (updateGroup) Groups.instance.addUser(g, s, admin, false, done, fail)
            else done()
        }, fail)
    }

    inGroup(g: string, query: {}, sort: boolean, suc: Table.Suc<Tables.User>, err: Table.Err) {
        query['groups'] = { $eq: g }
        this.get(query, sort ? { name: 1 } : {}, suc, err)
    }

    getGroups(s: string, deep:boolean, suc: Table.Suc<Tables.PopulatedGroup>, err: Table.Err) {
        this.getByID(s, u => Groups.instance.getAndPopulate({ _id: { $in: u.groups } }, false, deep, suc, err), err)
    }
}

export namespace Users {
    export interface GoogleProfile {
        email: string,
        name: {
            familyName: string,
            givenName: string
        },
        _json: {
            domain: string
        }
    }

    export interface SimpleUser {
        id: string, 
        name: string,
        surename: string
    }

    export const instance = new User(Tables.User)

    export function getByGProfile(p: GoogleProfile, suc: (u: Tables.UserTemplate) => void, err: Table.Err) {
        const id = getIDByGProfile(p)

        //TODO not sure if getByID (findOne) will return successfully if no were found, test
        instance.getByID(id, user => returnOrCreate(id, p, user, suc, err), err)
    }

    export function simplify(u: Tables.UserTemplate): SimpleUser {
        return mkSimpleUser(u._id, u.name, u.surename)
    }

    export function mkSimpleUser(id:string, name:string, surename: string) {
        return {
            id: id,
            name: name,
            surename: surename
        }
    }

    export function getIDByGProfile(p: GoogleProfile): string {
        return p.email.split("@")[0]
    }

    export function returnOrCreate(id: string, p: GoogleProfile, user: Tables.User, suc: (u: Tables.UserTemplate) => void, err: Table.Err) {
        if (user) suc(user)
        else {
            const user = Tables.mkUser(id, p.name.givenName, p.name.familyName)
            instance.create(user, () => suc(user), Table.error)
        }
    }
}