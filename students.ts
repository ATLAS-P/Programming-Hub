import * as mongoose from "mongoose"
import * as futuremap from "./Autograder"
import * as projects from "./miniprojects"

const AC = futuremap.AutoChecker

const student = new mongoose.Schema({
    name: String,
    surename: String,
    email: String,
    groups: [String],
})
const Student = mongoose.model('students', student)

const group = new mongoose.Schema({
    id: String,
    name: String,
    assignments: [String],
})
const Group = mongoose.model('groups', group)

const assignments = new mongoose.Schema({
    name: String,
    project: String,
    id: String,
    due: Date,
    files: [String]
})
const Task = mongoose.model('assignments', assignments)

const file = new mongoose.Schema({
    student: String,
    assignment: String,
    timestamp: Date,
    partners: [String],
    html: String,
    reflection: String,
    feedback: String
})
const Files = mongoose.model('files', file)

export interface Profile {
    email: String,
    name: {
        familyName: String,
        givenName: String
    }
}

export function getUser(profile: Profile, fail, success: (student) => void) {
    Student.find({ email: profile.email.split("@")[0] }, (err, students: mongoose.Document[]) =>
        err ? fail(err.toString()) : createProfile(profile, students, fail, success))
}

export function getStudentsInGroup(query: {}, group: string, success: (s:mongoose.Document[]) => void, fail) {  

    Student.find({ groups: { $eq: group } }).find(query).sort({ name: 1 }).exec(function (err, res) {
        if (err) fail(err)
        else success(res)
    })
}

function createProfile(profile: Profile, current: mongoose.Document[], fail, success: (student) => void) {
    const done = (student: mongoose.Document) => success({
        email: student.get("email"),
        name: student.get("name"),
        surename: student.get("surename")
    })

    if (current.length > 0) done(current[0])
    else {
        const student = new Student({ email: profile.email.split("@")[0], name: profile.name.givenName, surename: profile.name.familyName, groups: [], files: [] })
        student.save((err, student) => err ? fail(err.toString()) : done(student))
    }
}

function getGroups(user: string, success, fail) {
    Student.find({ email: user }, function (err, student) {
        if (err) fail(err.toString())
        else Group.find({ id: { $in: student[0].get("groups") } }, function (err, groups) {
            if (err) fail(err.toString())
            else success(groups)
        })
    })
}

interface Group {
    id: string,
    name: string,
    open: number,
    nextp: string,
    nextd: string
}

interface GroupSimple {
    id: string,
    name: string
}

interface Assignment {
    name: string,
    due: string,
    level: string,
    id: string,
    link: string
}

export function getSimpleGroups(user: string, success, fail) {
    getGroups(user, (groups) => orderGroups(groups, success, fail), fail)
}

function orderGroups(groups: mongoose.Document[], success, fail) {
    const runner = (group: mongoose.Document) => new Promise<mongoose.Document[]>(function (resolve, reject) {
        Task.find({ id: { $in: group.get("assignments") } }, function (err, ass: mongoose.Document[]) {
            if (err) reject(err)
            else resolve(ass)
        })
    })

    const collector = AC.list(groups, AC.unit)
    collector.run(runner).then(function (assignments: mongoose.Document[][]) {
        const final = futuremap.ArrayHelper.map2(groups, assignments, mapGroup)
        success(final)
    }, fail)
}

function mapGroup(group: mongoose.Document, assignments: mongoose.Document[]): Group {
    const today = new Date()
    const next = futuremap.ArrayHelper.foldLeft<mongoose.Document, [number, mongoose.Document]>(assignments, [0, null], function (acc: [number, mongoose.Document], next: mongoose.Document): [number, mongoose.Document] {
        const nextDate = (next.get("due") as Date)
        const open = nextDate > today

        if (!acc[1]) {
            if (open) return [1, next]
            else return acc
        } else if (open && nextDate < (acc[1].get("due") as Date)) return [acc[0] + 1, next]
        else return [acc[0] + (open ? 1 : 0), acc[1]]
    })
    const open = next[0]
    return {
        id: group.get("id"),
        name: group.get("name"),
        open: open,
        nextd: open > 0? next[1].get("due") : null,
        nextp: open > 0? next[1].get("name") : null
    }
}

export function collectAssignments(group: string, success: (ao: Assignment[], ac: Assignment[], g: GroupSimple) => void, fail) {
    Group.find({ id: group }, function (err, theGroup: mongoose.Document[]) {
        if (err) fail(err)
        else if (theGroup.length == 0) fail("The group does not exsit!")
        else {
            let assignments = theGroup[0].get("assignments")
            Task.find({ id: { $in: assignments } }).sort({ due: -1 }).exec(function (err, asses: mongoose.Document[]) {
                const runnerGetProject = (ass: mongoose.Document) => new Promise<mongoose.Document>(function (resolve, reject) {
                    projects.getFull({ id: ass.get("project") }, (data: mongoose.Document[]) => resolve(data[0]), reject)
                })

                const collector = futuremap.AutoChecker.list(asses, futuremap.AutoChecker.unit)
                collector.run(runnerGetProject).then(function (projects: mongoose.Document[]) {
                    let assignments = futuremap.ArrayHelper.map2(asses, projects, buildAssignment)
                    let openClosed = splitOpenClosed(assignments)
                    success(openClosed[0], openClosed[1], mapGroupSimple(theGroup[0]))
                }, fail)
            })
        }
    })
}

function splitOpenClosed(ass: Assignment[]): [Assignment[], Assignment[]] {
    return futuremap.ArrayHelper.foldLeft<Assignment, [Assignment[], Assignment[]]>(ass, [[], []], function (acc: [Assignment[], Assignment[]], next: Assignment) {
        if (new Date(next.due) > new Date()) {
            return [acc[0].concat(next), acc[1]]
        } else {
            return [acc[0], acc[1].concat(next)]
        }
    })
}

function mapGroupSimple(g: mongoose.Document): GroupSimple {
    return {
        id: g.get("id"),
        name: g.get("name")
    }
}

function buildAssignment(task: mongoose.Document, project: mongoose.Document): Assignment {
    console.log(task, project)
    return {
        name: project.get("name"),
        due: task.get("due"),
        level: project.get("level"),
        id: project.get("id"),
        link: project.get("id") + ".py" //remove and just do it in js
    }
}