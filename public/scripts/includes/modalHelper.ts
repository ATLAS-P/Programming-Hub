$(document).ready(() => {
    $(".manipulate").click(handleData)
})

function handleData() {
    const base = $(this)
    const target = $(base.attr("target"))

    const data = base.attr("attr-data")
    const text = base.attr("text-data")

    if(data && data.length > 0) loop(JSON.parse(data), (key, value) => target.attr(key, value))
    if(text && text.length > 0) target.text(text)
}

function loop(data: {}, f:(key, value) => void) {
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            f(key, data[key])
        }
    }
}

function fixError(error: any): string {
    if (typeof error == 'string') return error
    else if (error.message) return error.message
    else {
        console.log(error)
        return "An error occured, but it could not be displayed properly. See the console of the browser for more information."
    }
}

class Dict<A> {
    objs: {} = {}

    put(id: string, a: A) {
        this.objs[id] = a
    }

    get(id: string): A {
        return this.objs[id]
    }

    keys(): A[] {
        return this.toArr((key, value) => key)
    }

    values(): A[] {
        return this.toArr((key, value) => value)
    }

    toArr<B>(f:(key, value) => B):B[] {
        const collection = []
        loop(this.objs, (key, value) => {
            collection.push(f(key, value))
        })
        return collection
    }
}

//this way values are calculated way to often, just lazy and reset when renew
class Field {
    name: string
    id: string
    value: () => any
    value_raw: (jq:any) => any
    jq: any

    constructor(id: string, name: string, jq: any, value: (jq: any) => any) {
        this.id = id
        this.name = name
        this.jq = jq

        this.value = () => value(jq)
        this.value_raw = value
    }
}

class Validator {
    targets: string[]
    f: (modal: ModalFormValidator, ...Field: any[]) => string[]
    error:boolean = true

    constructor(f: (modal: ModalFormValidator, ...Field: any[]) => string[], ...targets: string[]) {
        this.targets = targets
        this.f = f
    }

    disableErrors(): Validator {
        this.error = false
        return this
    }

    exec(modal: ModalFormValidator): string[] {
        const targets = this.targets.map(t => modal.fields.get(t))
        const error = this.f(modal, ...targets)

        if (error.length > 0 && this.error) targets.forEach(t => t.jq.parent().addClass("has-error"))

        return error
    }

    static validate(modal: ModalFormValidator, ...vals: Validator[]): string[] {
        const errors = []
        for (let val of vals) {
            const error = val.exec(modal)
            if (error.length > 0) errors.push(...error)
        }
        return errors
    }
}

class ModalFormValidator {
    private sendId: string

    private validators: Validator[] = []
    private values: any[] = []
    fields: Dict<Field> = new Dict<Field>()
    private openListners: ((m: ModalFormValidator) => void)[] = []

    modal: any
    private errorMessage: any
    private errorContainer: any

    constructor(id: string, send: string, receive: string, multiUse: boolean = false) {
        this.modal = $(id)
        this.sendId = send

        this.errorMessage = this.modal.find(".errors")
        this.errorContainer = this.modal.find(".errorContainer")

        this.modal.find(".modal-run").click(() => this.run())
        this.modal.on("show.bs.modal", () => this.modalOpened(multiUse))
        socket.on(receive, (success, error) => this.response(success, error))
    }

    private response(success: boolean, error?: any) {
        if (success) location.reload()
        else {
            this.showError()
            this.clearError()
            this.addError(fixError(error))
        }
    }

    private modalOpened(multiUse: boolean) {
        console.log("openend")
        if (multiUse) {
            this.clearError()
            this.hideError()

            loop(this.fields.objs, (key, value: Field) => {
                value.jq.parent().removeClass("has-error")
            })
        }

        const instance = this
        this.openListners.forEach(l => l(instance))
    }

    onOpen(f: (m: ModalFormValidator) => void) {
        this.openListners.push(f)
    }

    copyFrom(other: ModalFormValidator, id: string, validators:boolean = true) {
        loop(other.fields.objs, (key, value: Field) => {
            this.registerField(key, value.name, "#" + id + value.id.substr(1), value.value_raw)
        })

        this.addValues(...other.values)

        if (validators) for (let val of other.validators) this.addValidation(val)
    }

    run() {
        const errors = []

        loop(this.fields.objs, (key, value: Field) => {
            value.jq.parent().removeClass("has-error")
        })

        for (let val of this.validators) {
            const error = val.exec(this)
            if (error.length > 0) errors.push(...error)
        }

        if (errors.length > 0) {
            this.clearError()
            this.showError()

            errors.forEach((e) => this.addError(e))
        } else {
            this.hideError()
            socket.emit(this.sendId, ...this.values, ...this.fields.values().map(f => f.value()))
        }
    }

    clearError() {
        this.errorMessage.html("")
    }

    showError() {
        this.errorContainer.removeClass("hidden")
    }

    hideError() {
        this.errorContainer.addClass("hidden")
    }

    addError(error: string) {
        const li = document.createElement("li")
        li.innerText = error
        this.errorMessage.append(li)
    }

    setTextValue(field: string, value: string) {
        this.getJq(field).text(value)
    }

    setValue(field: string, value: string) {
        this.getJq(field).val(value)
    }

    getValue(field: string): string {
        return this.actField(field, f => f.value())
    }

    getName(field: string): string {
        return this.actField(field, f => f.name)
    }

    getJq(field: string): any {
        return this.actField(field, f => f.jq)
    }

    private actField(field: string, f: (field: Field) => string): string {
        const val = this.fields.get(field)

        if (val) return f(val)
        else ""
    }

    registerField(shortHand: string, name: string, id: string, value: (jq) => any, insideModal: boolean = true) {
        const jq = insideModal ? this.modal.find(id) : $(id)
        this.fields.put(shortHand, new Field(id, name, jq, value))
    }

    addValues(...values: any[]) {
        this.values.push(...values)
    }

    addValidation(valid: Validator) {
        this.validators.push(valid)
    }
}

namespace ModalValues {
    export function value(target): string {
        return target.val()
    }

    export function attr(atr: string): (target: any) => string {
        return (target) => target.attr(atr)
    }

    export function date(target): Date {
        return target.parent().datepicker("getDate") as Date
    }
}

namespace ModalValidators {
    export function atLeast(length: number): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, field) => {
            const value = field.value()

            if (value.length >= length) return []
            else return ["The " + field.name + " must be at least " + length.toString() + " characters long!"]
        }
    }

    export function minSize(length: number): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, field) => {
            const value = field.value()

            console.log(value)
            if (value.length >= length) return []
            else return ["At least " + length + " should be selected from " + field.name + "!"]
        }
    }

    export function equals(...list: string[]): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, field) => {
            const value = field.value()

            for (let val of list) {
                if(value == val) return []
            }

            return ["Field " + field.name + " has an invalid value!"]
        }
    }

    export function or(pred: (any) => boolean, error: string): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, ...fields) => {
            for (let field of fields) {
                if (pred(field.value())) return []
            }
            return [error]
        }
    }

    export function exists(): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, field) => {
            if (!field.value()) return ["The " + field.name + " format is incorrect!"]
            else return []
        }
    }

    export function not(data: string, error: string): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, field) => {
            if (field.value() == data) return [error]
            else return []
        }
    }

    export function ifthen(pred: (string: string) => boolean, ...then: Validator[]): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, field) => {
            if (pred(field.value())) return Validator.validate(modal, ...then)
            else return []
        }
    }

    export function ifValid(pred: Validator, ...then: Validator[]): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, field) => {
            const error = pred.exec(modal)

            if (error.length == 0) return Validator.validate(modal, ...then)
            else return error
        }
    }

    export function dateOrder(): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, start, end) => {
            const startDate = start.value()
            const endDate = end.value()

            if (!!startDate && !!endDate && startDate >= endDate)
                return ["The " + start.name + " has to be before the " + end.name + "!"]
            else return []
        }
    }

    export function inbetweenDates(start:Date, end:Date): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, date) => {
            const dateDate = date.value() as Date
            if (dateDiff(start, dateDate) < 0) return ["The " + date.name + " has to be after " + dateString(start, start.getFullYear() != dateDate.getFullYear()) + "!"]
            else if (dateDiff(dateDate, end) < 0) return ["The " + date.name + " has to be before " + dateString(end, end.getFullYear() != dateDate.getFullYear()) + "!"]
            else return []
        }
    }

    export function validURL(): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (modal, field) => {
            if (!URLValid(field.value())) return ["The url of " + field.name + " is not valid!"]
            else return []
        }
    }

    export function idNotExists(id:string, error:string): (modal: ModalFormValidator, ...field: Field[]) => string[] {
        return (field) => {
            if ($("#" + id).size() > 0) return [error]
            else return []
        }
    }

    function dateDiff(begin: Date, end: Date): number {
        const diff = end.getTime() - begin.getTime()
        return Math.floor(diff / (1000 * 3600 * 24))
    }

    function dateString(date: Date, year: boolean): string {
        const str = (date.getDate()) + " " + months[date.getMonth()]

        if (year) return str + " " + date.getFullYear().toString().substr(2, 2)
        else return str
    }
}

function URLValid(str: string) {
    var pattern = new RegExp('^(https?:\\/\\/)?' +
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
        '((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
        '(\\?[;&a-z\\d%_.~+=-]*)?' +
        '(\\#[-a-z\\d_]*)?$', 'i')
    if (!pattern.test(str)) return false
    else return true
}

$(".date").datepicker().on('show.bs.modal', (event) => event.stopPropagation())