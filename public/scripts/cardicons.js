$(document).ready(() => {
    $(".btn-card").hover(function () { cardHover($(this), true); }, function () { cardHover($(this), false); });
});
function cardHover(card, hover) {
    const parent = card.parent().parent().parent().parent().get(0);
    const text = hover ? card.attr("data") : "";
    parent.lastChild.firstChild.textContent = text;
}
