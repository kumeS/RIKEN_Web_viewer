$(function(){var o=void 0,n=void 0;$("#controller__button").children("input").on("mousedown",function(){o=$(this).attr("class"),n=$("#controller__window ."+o),"none"===n.css("display")?($(".controller__window").hide(),n.show()):n.hide()}),$('input[value="Hide all"]').on("mousedown",function(){$(this).toggleClass("on"),"Hide all"===$(this).val()?$(this).val("Show all"):$(this).val("Hide all")}),$('#controller__button > input[type="button"]').on("mousedown",function(){n=$("#controller__window ."+$(this).attr("class")),$(this).hasClass("on")?($(this).removeClass("on"),$(".controller__window").hide(),n.hide()):($('#controller__button > input[type="button"]').removeClass("on"),$(this).addClass("on"),$(".controller__window").hide(),n.show()),$("#stick-pin__add-point, #stick-pin__move-point").removeClass("on"),$("#waypoint-area").css("pointer-events","none")}),$('input[value="Cansel"]').on("mousedown",function(){$(this).closest(".window-box").hide(),$(this).removeClass("on")}),$('input[value="yes"]').on("mousedown",function(){$(this).css("background-color","lightblue"),$(this).next('input[value="no"]').css("background-color","white")}),$('input[value="no"]').on("mousedown",function(){$(this).css("background-color","lightblue"),$(this).prev('input[value="yes"]').css("background-color","white")}),$("#measurement__delete-all").on("mousedown",function(){$("#measurement__delete-all__confirm").show()}),$("#measurement__delete-all__confirm input").on("mousedown",function(){$("#measurement__delete-all__confirm").hide()}),$(".measurement-tools").on("mousedown",function(){$(this).hasClass("on")?$(this).removeClass("on"):($(".measurement-tools").removeClass("on"),$(this).addClass("on"))}),$("#stick-pin__delete-all").on("mousedown",function(){$("#stick-pin__delete-all__confirm").show()}),$("#stick-pin__delete-all__confirm input").on("mousedown",function(){$("#stick-pin__delete-all__confirm").hide(),"Yes"===$(this).val()&&$("#stick-pin__hide-all").val("Hide all")}),$("#stick-pin__add-point").on("mousedown",function(){$(this).toggleClass("on"),$("#stick-pin__move-point").removeClass("on")}),$("#stick-pin__move-point").on("mousedown",function(){$(this).toggleClass("on"),$("#stick-pin__add-point").removeClass("on"),$("#waypoint-area").css("pointer-events","none")}),$('#controller__button > input[type="button"]').on("mousedown",function(){$("#stick-pin__add-point, #stick-pin__move-point").removeClass("on"),$("#waypoint-area").css("pointer-events","none"),$(".pinned-list").removeClass("on"),$("#stick-pin__delete-all__confirm").hide()});var e=$("#crosshair .crosshair");$("#controll-window__button > .crosshair").on("mousedown",function(){$("#crosshair .crosshair").toggleClass("show")}),$("#save-fov-button").on("mousedown",function(){$(this).hasClass("on")?($(this).removeClass("on"),$("#save-fov-window").hide(),$("#save-fov-image").empty()):($(this).addClass("on"),$("#save-fov-window").show())}),$('#save-fov-window input[value="Done"]').on("mousedown",function(){$("#save-fov-button").removeClass("on"),$("#save-fov-window").hide(),$("#save-fov-image").empty()}),$("#image-caption-button").on("mousedown",function(){$("#image-caption-window").text($("#image-caption-text").val()),""===$("#image-caption-text").val()?$("#image-caption-window").css("padding","0"):$("#image-caption-window").css("padding","10px 10px")}),$("#color-setting-box").find('input[value="OK"]').on("mousedown",function(){$("#color-setting-box").hide()}),$(".settings.controller__window").find('input[value="Cansel"]').on("mousedown",function(){$(".settings.on").removeClass("on"),$("#color-setting-box").hide()}),$(".settings.controller__window").find('input[value="OK"]').last().on("mousedown",function(){$(".settings.controller__window").hide(),$(".settings.on").removeClass("on"),$("#color-setting-box").hide()}),$("#delete-all-view-button").on("mousedown",function(){$("#delete-all-view-confirm").show()}),$("#delete-all-view-confirm input").on("mousedown",function(){$("#delete-all-view-confirm").hide()})});