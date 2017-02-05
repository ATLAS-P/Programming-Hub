$(document).ready(() => {
    const modCreate = new ModalFormValidator("#addCourse", "createCourse", "courseCreated");
    modCreate.registerField("name", "course name", "#courseName", ModalValues.value);
    modCreate.registerField("start", "start date", "#courseStart", ModalValues.date);
    modCreate.registerField("end", "end date", "#courseEnd", ModalValues.date);
    modCreate.addValidation(ModalValidators.atLeast(8), "name");
    modCreate.addValidation(ModalValidators.exists(), "start");
    modCreate.addValidation(ModalValidators.exists(), "end");
    modCreate.addValidation(ModalValidators.dateOrder(), "start", "end");
    const modUpdate = new ModalFormValidator("#updateCourse", "updateCourse", "courseUpdated");
    modUpdate.registerField("course", "course id", "#update_courseName", ModalValues.attr("course"));
    modUpdate.copyFrom(modCreate, "update_");
    modUpdate.onOpen((mod) => {
        const name = mod.getJq("name");
        const start = name.attr("start");
        const end = name.attr("end");
        mod.getJq("start").parent().datepicker('setDate', new Date(start));
        mod.getJq("end").parent().datepicker('setDate', new Date(end));
    });
    const modDelete = new ModalFormValidator("#removeCourse", "removeCourse", "courseRemoved");
    modDelete.registerField("course", "course id", "#removeCourseName", ModalValues.attr("course"));
});
