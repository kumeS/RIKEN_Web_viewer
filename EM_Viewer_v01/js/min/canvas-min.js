$(function(){var t=document.getElementById("canvas"),e=void 0;t.getContext&&(e=t.getContext("2d")),t.width=$("#map-image-area").width(),t.height=$("#map-image-area").height(),$(window).on("resize",function(){t.width=$("#map-image-area").width(),t.height=$("#map-image-area").height()});var i=[],a=[],o=0,h=256,d=void 0,n=void 0,s=void 0,g=void 0,w=void 0,m=void 0,r=void 0,p=function(){d=t.toDataURL(),n=new Image,n.src=d,1===g?(n.width=s.height()-20,n.height=n.width*t.height/t.width,$("#delete-all-view-button").addClass("store"),m=(s.height()-n.height)/2,w=$('<div class="photo-store-wrap"><div class="photo-delete-icon">x</div></div>'),w.appendTo(s).width(n.width),$(n).appendTo(w).css({top:m}),r=$(".photo-store-wrap").length,$("#stored-view-number").text(r)):2===g&&(n.width=s.width(),n.height=n.width*t.height/t.width,$(n).appendTo(s).css("display","inline-block")),e.clearRect(0,0,t.width,t.height)},v=new Image,c=function(){$thisImage=$(".map-image-pane img:eq("+o+")"),v.src=$thisImage.attr("src"),v.width=$thisImage.width(),v.height=$thisImage.height(),i=$thisImage.offset().left,a=$thisImage.offset().top,v.onload=function(){e.drawImage(v,i,a),o++,void 0!==$(".map-image-pane img:eq("+o+")").attr("src")?c():(o=0,p())}};$("#add-view-button").on("mousedown",function(){g=1,s=$("#photo-store-window-inner"),c()}),$("#save-fov-button").on("mousedown",function(){$(this).hasClass("on")||(g=2,s=$("#save-fov-image"),c())})});