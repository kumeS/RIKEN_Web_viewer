$(function(){var e=document.getElementById("canvas2"),o=void 0;e.getContext&&(o=e.getContext("2d")),e.width=$("#map-image-area").width(),e.height=$("#map-image-area").height();var n=[],t=[],a=0,i=256,m=void 0,d=void 0,v=0,s=0,r=0,g=new Image,c=function(){g.src="generate-tiling-image/160408RatLiver_x7500_tiling01/tile-group"+v+"/"+v+"-"+s+"-"+r+".jpg",n=256*s,t=256*r,g.onload=function(){if(o.drawImage(g,n,t),g.height<256)if(g.width<256){r=0,s=0;var a=!1;downX=void 0,downY=void 0,moveX=0,moveY=0,movedX=0,movedY=0;var i=1;$(e).on({dblclick:function(){i+=.1,$(this).css({transition:"0.5s",transform:"translate3d("+movedX+"px, "+movedY+"px, 0) scale("+i+")"})},mousedown:function(e){a=!0,downX=e.pageX,downY=e.pageY},wheel:function(){i-=.1,$(this).css({transition:"0s",transform:"translate3d("+movedX+"px, "+movedY+"px, 0) scale("+i+")"})}}),$(window).on({mousemove:function(o){a&&(moveX=movedX+o.pageX-downX,moveY=movedY+o.pageY-downY,$(e).css({transition:"0.5s",transform:"translate3d("+moveX+"px, "+moveY+"px, 0) scale("+i+")"}))},mouseup:function(){a&&(movedX=moveX,movedY=moveY,moveX=0,moveY=0,a=!1)}})}else r=0,s++,c();else r++,c()}};c()});