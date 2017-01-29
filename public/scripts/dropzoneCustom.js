let zone;
Dropzone.options.uploadedFiles = {
    createImageThumbnails: false,
    parallelUploads: 1,
    maxFilesize: 1,
    init: dropzoneInit,
    success: fileUploaded,
    error: fileError
};
function dropzoneInit() {
    zone = this;
    zone.on("sending", sending);
}
function sending(file, xhr, formData) {
    const ass = $("#assignmentUploadId");
    formData.append("assignment", ass.attr("assignment"));
    formData.append("group", ass.attr("group"));
}
function fileUploaded(file, response) {
    zone.removeFile(file);
    if (!response.success)
        showError(response.err);
    else {
        $("#errorContainerUpload").addClass("hidden");
        $("#errorsUpload").html("");
        const files = $("#uploadedFilesList");
        const li = document.createElement("li");
        li.innerText = file.name;
        li.classList.add("list-group-item");
        files.append(li);
        initListGroupItem($(li));
        $(li).click();
    }
}
function fileError(file, error) {
    zone.removeFile(file);
    showError(error);
}
function showError(error) {
    $("#errorContainerUpload").removeClass("hidden");
    const li = document.createElement("li");
    li.innerText = error;
    $("#errorsUpload").append(li);
}
