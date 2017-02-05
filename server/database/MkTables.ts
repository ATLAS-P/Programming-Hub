import { TestJSON } from '../autograder/Result'

export namespace MkTables {
    export interface UserTemplate {
        _id: any,
        name: string,
        surename: string,
        groups: {
            group: string | GroupTemplate,
            files: {
                final: boolean,
                file: string | FileTemplate
            }[]
        }[],
        admin: boolean
    }

    export interface AssignmentTemplate {
        due: Date
        files: string[] | FileTemplate[]
        name: string
        group: string | GroupTemplate[]
        link: string
        project: string
        typ: string
    }

    export interface GroupTemplate {
        name: string,
        start: Date,
        end: Date
        assignments: string[] | AssignmentTemplate[],
        students: string[] | UserTemplate[],
        admins: string[] | UserTemplate[],
    }

    export interface FileTemplate {
        students: string[] | UserTemplate[],
        assignment: string | AssignmentTemplate[],
        timestamp: Date,
        autograder: Object[],
        notes: string,
        feedback: string,
        urls: string[],
        name: string
    }

    export function mkUser(id: string, name: string, surename: string): UserTemplate {
        return {
            name: name,
            _id: id,
            surename: surename,
            groups: [],
            admin: false
        }
    }

    export function mkAssignment(name: string, group: string, due: Date, typ: string, link: string = "", project: string = ""): AssignmentTemplate {
        return {
            name: name,
            due: due,
            files: [],
            typ: typ,
            project: project,
            link: link,
            group: group
        }
    }

    export function mkGroup(name: string, start: Date, end: Date, students: string[] = [], admins: string[] = []): GroupTemplate {
        return {
            name: name,
            admins: admins,
            students: students,
            assignments: [],
            start: start,
            end: end
        }
    }

    export function mkFile(assignment: string, name:string, students: string[], files: string[], notes: string, feedback: string = "", autograder: TestJSON<any>[] = []): FileTemplate {
        return {
            students: students,
            assignment: assignment,
            timestamp: new Date(),
            autograder: autograder,
            notes: notes,
            feedback: feedback,
            urls: files,
            name: name
        }
    }
}