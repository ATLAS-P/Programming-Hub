$(document).ready(() => {
    $(".manipulate").click(handleData);
});
function handleData() {
    const base = $(this);
    const target = $(base.attr("target"));
    const data = base.attr("attr-data");
    const text = base.attr("text-data");
    if (data && data.length > 0)
        loop(JSON.parse(data), (key, value) => target.attr(key, value));
    if (text && text.length > 0)
        target.text(text);
}
function loop(data, f) {
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            f(key, data[key]);
        }
    }
}
function fixError(error) {
    if (typeof error == 'string')
        return error;
    else if (error.message)
        return error.message;
    else {
        console.log(error);
        return "An error occured, but it could not be displayed properly. See the console of the browser for more information.";
    }
}
class Dict {
    constructor() {
        this.objs = {};
    }
    put(id, a) {
        this.objs[id] = a;
    }
    get(id) {
        return this.objs[id];
    }
    keys() {
        return this.toArr((key, value) => key);
    }
    values() {
        return this.toArr((key, value) => value);
    }
    toArr(f) {
        const collection = [];
        loop(this.objs, (key, value) => {
            collection.push(f(key, value));
        });
        return collection;
    }
}
class Field {
    constructor(id, name, jq, value) {
        this.id = id;
        this.name = name;
        this.jq = jq;
        this.value = () => value(jq);
        this.value_raw = value;
    }
}
class Validator {
    constructor(f, ...targets) {
        this.error = true;
        this.targets = targets;
        this.f = f;
    }
    disableErrors() {
        this.error = false;
        return this;
    }
    exec(modal) {
        const targets = this.targets.map(t => modal.fields.get(t));
        const error = this.f(modal, ...targets);
        if (error.length > 0 && this.error)
            targets.forEach(t => t.jq.parent().addClass("has-error"));
        return error;
    }
    static validate(modal, ...vals) {
        const errors = [];
        for (let val of vals) {
            const error = val.exec(modal);
            if (error.length > 0)
                errors.push(...error);
        }
        return errors;
    }
}
class ModalFormValidator {
    constructor(id, send, receive, multiUse = false) {
        this.validators = [];
        this.values = [];
        this.fields = new Dict();
        this.openListners = [];
        this.modal = $(id);
        this.sendId = send;
        this.errorMessage = this.modal.find(".errors");
        this.errorContainer = this.modal.find(".errorContainer");
        this.modal.find(".modal-run").click(() => this.run());
        this.modal.on("show.bs.modal", () => this.modalOpened(multiUse));
        socket.on(receive, (success, error) => this.response(success, error));
    }
    response(success, error) {
        if (success)
            location.reload();
        else {
            this.showError();
            this.clearError();
            this.addError(fixError(error));
        }
    }
    modalOpened(multiUse) {
        console.log("openend");
        if (multiUse) {
            this.clearError();
            this.hideError();
            loop(this.fields.objs, (key, value) => {
                value.jq.parent().removeClass("has-error");
            });
        }
        const instance = this;
        this.openListners.forEach(l => l(instance));
    }
    onOpen(f) {
        this.openListners.push(f);
    }
    copyFrom(other, id, validators = true) {
        loop(other.fields.objs, (key, value) => {
            this.registerField(key, value.name, "#" + id + value.id.substr(1), value.value_raw);
        });
        this.addValues(...other.values);
        if (validators)
            for (let val of other.validators)
                this.addValidation(val);
    }
    run() {
        const errors = [];
        loop(this.fields.objs, (key, value) => {
            value.jq.parent().removeClass("has-error");
        });
        for (let val of this.validators) {
            const error = val.exec(this);
            if (error.length > 0)
                errors.push(...error);
        }
        if (errors.length > 0) {
            this.clearError();
            this.showError();
            errors.forEach((e) => this.addError(e));
        }
        else {
            this.hideError();
            socket.emit(this.sendId, ...this.values, ...this.fields.values().map(f => f.value()));
        }
    }
    clearError() {
        this.errorMessage.html("");
    }
    showError() {
        this.errorContainer.removeClass("hidden");
    }
    hideError() {
        this.errorContainer.addClass("hidden");
    }
    addError(error) {
        const li = document.createElement("li");
        li.innerText = error;
        this.errorMessage.append(li);
    }
    setTextValue(field, value) {
        this.getJq(field).text(value);
    }
    setValue(field, value) {
        this.getJq(field).val(value);
    }
    getValue(field) {
        return this.actField(field, f => f.value());
    }
    getName(field) {
        return this.actField(field, f => f.name);
    }
    getJq(field) {
        return this.actField(field, f => f.jq);
    }
    actField(field, f) {
        const val = this.fields.get(field);
        if (val)
            return f(val);
        else
            "";
    }
    registerField(shortHand, name, id, value, insideModal = true) {
        const jq = insideModal ? this.modal.find(id) : $(id);
        this.fields.put(shortHand, new Field(id, name, jq, value));
    }
    addValues(...values) {
        this.values.push(...values);
    }
    addValidation(valid) {
        this.validators.push(valid);
    }
}
var ModalValues;
(function (ModalValues) {
    function value(target) {
        return target.val();
    }
    ModalValues.value = value;
    function attr(atr) {
        return (target) => target.attr(atr);
    }
    ModalValues.attr = attr;
    function date(target) {
        return target.parent().datepicker("getDate");
    }
    ModalValues.date = date;
})(ModalValues || (ModalValues = {}));
var ModalValidators;
(function (ModalValidators) {
    function atLeast(length) {
        return (modal, field) => {
            const value = field.value();
            if (value.length >= length)
                return [];
            else
                return ["The " + field.name + " must be at least " + length.toString() + " characters long!"];
        };
    }
    ModalValidators.atLeast = atLeast;
    function minSize(length) {
        return (modal, field) => {
            const value = field.value();
            console.log(value);
            if (value.length >= length)
                return [];
            else
                return ["At least " + length + " should be selected from " + field.name + "!"];
        };
    }
    ModalValidators.minSize = minSize;
    function equals(...list) {
        return (modal, field) => {
            const value = field.value();
            for (let val of list) {
                if (value == val)
                    return [];
            }
            return ["Field " + field.name + " has an invalid value!"];
        };
    }
    ModalValidators.equals = equals;
    function or(pred, error) {
        return (modal, ...fields) => {
            for (let field of fields) {
                if (pred(field.value()))
                    return [];
            }
            return [error];
        };
    }
    ModalValidators.or = or;
    function exists() {
        return (modal, field) => {
            if (!field.value())
                return ["The " + field.name + " format is incorrect!"];
            else
                return [];
        };
    }
    ModalValidators.exists = exists;
    function not(data, error) {
        return (modal, field) => {
            if (field.value() == data)
                return [error];
            else
                return [];
        };
    }
    ModalValidators.not = not;
    function ifthen(pred, ...then) {
        return (modal, field) => {
            if (pred(field.value()))
                return Validator.validate(modal, ...then);
            else
                return [];
        };
    }
    ModalValidators.ifthen = ifthen;
    function ifValid(pred, ...then) {
        return (modal, field) => {
            const error = pred.exec(modal);
            if (error.length == 0)
                return Validator.validate(modal, ...then);
            else
                return error;
        };
    }
    ModalValidators.ifValid = ifValid;
    function dateOrder() {
        return (modal, start, end) => {
            const startDate = start.value();
            const endDate = end.value();
            if (!!startDate && !!endDate && startDate >= endDate)
                return ["The " + start.name + " has to be before the " + end.name + "!"];
            else
                return [];
        };
    }
    ModalValidators.dateOrder = dateOrder;
    function inbetweenDates(start, end) {
        return (modal, date) => {
            const dateDate = date.value();
            if (dateDiff(start, dateDate) < 0)
                return ["The " + date.name + " has to be after " + dateString(start, start.getFullYear() != dateDate.getFullYear()) + "!"];
            else if (dateDiff(dateDate, end) < 0)
                return ["The " + date.name + " has to be before " + dateString(end, end.getFullYear() != dateDate.getFullYear()) + "!"];
            else
                return [];
        };
    }
    ModalValidators.inbetweenDates = inbetweenDates;
    function validURL() {
        return (modal, field) => {
            if (!URLValid(field.value()))
                return ["The url of " + field.name + " is not valid!"];
            else
                return [];
        };
    }
    ModalValidators.validURL = validURL;
    function idNotExists(id, error) {
        return (field) => {
            if ($("#" + id).size() > 0)
                return [error];
            else
                return [];
        };
    }
    ModalValidators.idNotExists = idNotExists;
    function dateDiff(begin, end) {
        const diff = end.getTime() - begin.getTime();
        return Math.floor(diff / (1000 * 3600 * 24));
    }
    function dateString(date, year) {
        const str = (date.getDate()) + " " + months[date.getMonth()];
        if (year)
            return str + " " + date.getFullYear().toString().substr(2, 2);
        else
            return str;
    }
})(ModalValidators || (ModalValidators = {}));
function URLValid(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' +
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
        '((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
        '(\\?[;&a-z\\d%_.~+=-]*)?' +
        '(\\#[-a-z\\d_]*)?$', 'i');
    if (!pattern.test(str))
        return false;
    else
        return true;
}
$(".date").datepicker().on('show.bs.modal', (event) => event.stopPropagation());
