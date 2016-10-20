import * as mongoose from 'mongoose'
import { Table, Tables } from '../Table'
import { Groups } from './Groups'

class User extends Table<Tables.User> {
    create(user: Tables.UserTemplate, done: () => void, err: Table.Err) {
        super.create(user, () => {
            user.groups.forEach((g: string) => Groups.instance.addUser(g, user.id, user.admin, false, done, err))
        }, err)
    }

    addToGroup(s: string, g: string, admin:boolean, updateGroup: boolean, done: () => void, fail: Table.Err) {
        this.updateOne(s, (a: Tables.User) => {
            if (a.groups.indexOf(g) == -1) a.groups.push(g)
        }, a => {
            if (updateGroup) Groups.instance.addUser(g, s, admin, false, done, fail)
            else done()
        }, fail)
    }

    inGroup(g: string, sort: boolean, suc: Table.Suc<Tables.User>, err: Table.Err) {
        this.get({ groups: { $eq: g } }, sort ? { name: 1 } : {}, suc, err)
    }

    getGroups(s: string, suc: Table.Suc<Tables.Group>, err: Table.Err) {
        this.getByID(s, u => Groups.instance.getByIDs(u.groups, suc, err), err)
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

    export const instance = new User(mongoose.model<Tables.User>('user', Tables.user))

    export function getByGProfile(p: GoogleProfile, suc: (u: Tables.UserTemplate) => void, err: Table.Err) {
        const id = getIDByGProfile(p)

        //TODO not sure if getByID (findOne) will return successfully if no were found, test
        instance.getByID(id, user => returnOrCreate(id, p, user, suc, err), err)
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