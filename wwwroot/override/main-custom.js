/* src/assets/js/nav.js */
$(".side-nav__close").click(function(){
	$(this).parent().parent().parent().toggleClass("show-nav")
});
$(".side-nav__body--close").click(function(){
		$(".side-nav").toggleClass("open")
});
$(".side-nav__opener").click(function(){
		$(".side-nav").toggleClass("open")
});
	$(".side-nav .nav-link").click(function(){
		$(".side-nav .nav-link").removeClass("active"),
		$(".side-nav__modal").removeClass("show-nav");
		var e=$(this);
		e.addClass("active");
		var t=e.attr("data-modal-target");
		$("."+t).toggleClass("show-nav")
	});
	$(document).click(function(e){
		e.stopPropagation(),0===$(".side-nav,.side-nav__modal").has(e.target).length&&($(".side-nav .nav-link").removeClass("active"),$(".side-nav__modal").removeClass("show-nav"))
	});

$('[data-toggle="datepicker"]').datepicker();
$('[data-toggle="tooltip"]').tooltip();


/*
$("#toggleAccordion").click(function(){
    
    if ($(this).data("closedAll")) {
        $("#QRAccordion .collapse").collapse("show");
    }
    else {
        $("#QRAccordion .collapse").collapse("hide");
    }
    
    // save last state
    $(this).data("closedAll",!$(this).data("closedAll")); 
});

// init with all closed
$("#toggleAccordion").data("closedAll",true);
*/