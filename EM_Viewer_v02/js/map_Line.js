
// こちらをdziが置かれるパスにすると動きます
var TILE_SOURCE = './DZI_images/';

// デフォルトのオプション
var prefixUrlPath = "./js/vendor/openseadragon/images/";
// CopyURIのベースのパス  "........" をうめる
var BASE_URL = "http://clst.multimodal.riken.jp/CLST_ViewerData/........./index.html";
// 1ピクセルあたりの マイクロメートル（デフォルト: 1px = 1/160 um = 0.00625 um = 6.25 nm）
// ここを更新すること
var PER_PIXEL_DEFAULT = 0.00625;
// 1K: x1000: 0.0943, x2000: 0.04715, x3000: 0.03143, x4000: 0.02358, x5000: 0.01886, x6000: 0.01572, x7000: 0.01347, x8000: 0.01179, x10000: 0.00943
// 2K: x1000: 0.0472, x2000: 0.02360, x3000: 0.01573, x4000: 0.01180, x5000: 0.00944, x6000: 0.00787, x7000: 0.00674, x8000: 0.00590, x10000: 0.00472
// 2.5K: x1000:	0.0413, x2000: 0.02065, x3000: 0.013765, x4000: 0.010325, x5000: 0.00826, x6000: 0.006885, x7000: 0.0058975, x8000: 0.0051625, x10000: 0.00413
//3K:	 x1000: 0.0354, x2000: 0.0177, x3000: 0.0118, x4000: 0.00885, x5000: 0.00708, x6000: 0.0059, x7000: 0.005055, x8000: 0.004425, x10000: 0.00354
// 4K: x1000: 0.0236, x2000: 0.01180, x3000: 0.00787, x4000: 0.00590, x5000: 0.00472, x6000: 0.00393, x7000: 0.00337, x8000: 0.00295, x10000: 0.00236
// dzi のデフォルトの画像名
var DZI_IMAGEID = "DZI_IMAGE";


$(function()
{ 
	// DOM onload
	$.cookie.json = true;

	//画面Lock
	//var isScreenLock = true;
	
	/*
	var screenLock = function()
	{
		isScreenLock = true;
		viewer.setMouseNavEnabled(false);
		viewer.gestureSettingsMouse.clickToZoom = false;
	};

	var screenUnLock = function()
	{
		isScreenLock = false;
		viewer.setMouseNavEnabled(true);
		viewer.gestureSettingsMouse.clickToZoom = true;
	};
	*/

	$("#map").on('click',function()
	{
		if(!measureManager.isEnable && !isPin)
		{
			//if(isScreenLock){
			//	screenUnLock();
			//}
		}

	});
	
	// ズーム時にRedrawが連続して呼ばれすぎて画面が固める対策
	var isRedrawProcessing = false;
	
	var dziImageID = DZI_IMAGEID;
	var pinKey = "pins_" + dziImageID;
	var pinDown = false;
	var isAnnotationMeasureMode = false;
			
	var downX, downY, movedX, movedY, isMove, $numberX, $numberY,
			targetPin, targetMenu, pinWidth, pinHeight, isPinMove,isPin = false;
				
	var startOffsetX,startOffsetY = 0.0;
	
	// $.cookie(dziImageID,null);
	// $.cookie(pinKey,null);
	var urlVars = (function(){
		var vars = new Object, params;
		var temp_params = window.location.search.substring(1).split('&');
		for(var i = 0; i <temp_params.length; i++) {
			params = temp_params[i].split('=');
			vars[params[0]] = params[1];
		}
		return vars;
	})();

	var tileSources = urlVars.image === undefined
				? TILE_SOURCE + DZI_IMAGEID + '.dzi'
				: TILE_SOURCE + urlVars.image + '.dzi';

	// 画像ID
	dziImageID =  urlVars.image === undefined
				? DZI_IMAGEID
				: urlVars.image;


	var perPixelWeight = urlVars.perpixel === undefined ? PER_PIXEL_DEFAULT : Number(urlVars.perpixel);
				
	var minZoomLevel = 0.005;
	var maxZoomLevel = 200;
	var defaultZoomLevel = 0.5;
				
	// viewer 定義
	var viewer = new OpenSeadragon({ // new OpenSeadragon's viewer
				id:							"map", // element's id viewer appends
				prefixUrl:			prefixUrlPath, // plugin's images folder
				tileSources:		tileSources, // dzi file's path (you make)
				constrainDuringPan: true, // not bounce back 
				showNavigator:	true, // show image navigator(small image and red rectangle)
				navigatorId: 'navigator-inner', // element's id navigator appends
				navigatorAutoFade:	false, // fade navigator by auto or not
				defaultZoomLevel: 0.5, // image's default zoom level
				minZoomLevel: minZoomLevel, // image's min zoom level
				maxZoomLevel: maxZoomLevel, // image's max zoom level
				toolbar:        "toolbar_box", // ツールボックス
				zoomInButton:   "zoom-in",
				zoomOutButton:  "zoom-out"
				//homeButton:     "home",
				//fullPageButton: "full-page"
				
				//collectionMode:     true,
                //collectionRows:     1, 
                //collectionTileSize: 1000,
                //collectionTileMargin: 0,
                //collectionColumns: 12,
                //viewportMargins: {top:0, left: 0, right: 0, bottom: 0},
			});
	


	// メニューの開閉
	function Menu()
	{
		this.shortCutOpened = false;
		this.$right = $("#right");//
		this.$right_shortcut = $("#right_shortcut");
		this.$menu_header = $("#menu_header"); 
		this.$shortcut_close_btn = $("#shortcut_close_btn");
		this.addEvents();
	}

// DZIのBRIGHTNESS調整　はじめに調整する
viewer.setFilterOptions({
    filters: {
        processors:    [ OpenSeadragon.Filters.BRIGHTNESS(0)]
    }
});

			/*
viewer.addTiledImage({
    tileSource: "DZI_images/DZI_IMAGE00001.dzi",
    x: 0/5120,
    y: 0/3840,
    width: 1
});   
    viewer.addTiledImage({
    tileSource: "DZI_images/DZI_IMAGE00002.dzi",
    x: 4297/5120,
    y: -16.74795660883906/3840,
    width: 1
});   
    viewer.addTiledImage({
    tileSource: "DZI_images/DZI_IMAGE00003.dzi",
    x: 1.0/5120,
    y: 0.75 - (2986.50392749368/3840 - 0.6),
    width: 1
});    
    viewer.addTiledImage({
    tileSource: "DZI_images/DZI_IMAGE00004.dzi",
    x: 4250/5120,
    y: 0.75 - (2923.738100131035/3840 - 0.595),
    width: 1
});    
			*/
	
	Menu.prototype.addEvents = function()
	{
		var self = this;
		this.$menu_header.on("click",function()
		{		
			// html2canvas
			/*
			html2canvas(document.body, {
				onrendered: function(canvas)
				{		  
				    var extra_canvas = document.createElement("canvas");
	                extra_canvas.setAttribute('width',70);
	                extra_canvas.setAttribute('height',70);
	                var ctx = extra_canvas.getContext('2d');
	                ctx.drawImage(canvas,0,0,canvas.width, canvas.height,0,0,70,70);
	                var dataURL = extra_canvas.toDataURL();
	                var img = $(document.createElement('img'));
	                img.attr('src', dataURL);
	                // insert the thumbnail at the top of the page
	                $('body').prepend(img);
	            }
			});
		    */
			
			if(self.shortCutOpened)
			{
				self.shortCutOpened = false;
				self.$right.show();
				self.$right_shortcut.hide();
					
			}else{
				self.shortCutOpened = true;
				self.$right.hide();
				self.$right_shortcut.show();
			}
		});
			
		this.$shortcut_close_btn.on("click",function()
		{	
			if(self.shortCutOpened)
			{
				self.shortCutOpened = false;
				self.$right.show();
				self.$right_shortcut.hide();
			
			}else
			{
				self.shortCutOpened = true;
				self.$right.hide();
				self.$right_shortcut.show();
			}
		});	
	};
	

	// セクションの開閉
	function SectionHeader(section_name)
	{
		var section_id = "#section_"+section_name;
		this.sectionOpened = false;
		
		this.$sectionTitleBox = $(section_id + " .section_title_box");
		
		this.$sectionTitle = $(section_id +" .section_title");
		this.$sectionContent = $(section_id +" .section_content");
		this.$sectionArrow = $(section_id + " .section_arrow");
		this.$sectionIcon = $(section_id + " .section_icon");
		
		this.iconActive = "images/title_icons_" + section_name + "_opened.svg";
		this.iconInActive = "images/title_icons_" + section_name + "_closed.svg";
		
		this.sectionOpened = true;

		this.addEvents();
	}
	
	SectionHeader.prototype.addEvents = function()
	{
		var self = this;
		
		this.$sectionTitleBox.on("click",function()
		{	
			if(self.sectionOpened)
			{

				self.inActive();
				
				//	self.$content.slideUp();
				//	self.$menu.animate({'padding-top': 0},200);
			}
			else
			{
			
				self.sectionOpened = true;
				self.$sectionTitle.removeClass("section_title_inactive");
				self.$sectionContent.slideDown(200);
				self.$sectionArrow.attr("src","images/title_icons_arrow_opened.svg");
				self.$sectionIcon.attr("src",self.iconActive);
			
				//	self.$content.slideDown();
				//	self.$menu.animate({'padding-top': 24},300);
			}
		});
	};

	SectionHeader.prototype.inActive = function()
	{
		this.sectionOpened = false;
		this.$sectionTitle.addClass("section_title_inactive");
		this.$sectionContent.slideUp(200);
		this.$sectionArrow.attr("src","images/title_icons_closed.svg");
		this.$sectionIcon.attr("src", this.iconInActive);
	};
	
	function SnapShot()
	{
		this.$contents = null;
		this.x = "";
		this.y = "";
		this.zoom = "";
		this.ID = "";
		this.dataURL = "";
	}
	
	SnapShot.prototype.createList = function(img)
	{
	    var list = $("<li>");
        var listBox = $('<div class="snapshot_list_box">');

        listBox.append(img);

        //images/ui_btns_picture.svg
        var copyURIBtn =$('<div  class="btn_box"><img src="images/ui_btns_copyuri.svg" class="ui_btn leftbtn"><div>copy URI</div></div>');
        var makeBtn = $('<div  class="btn_box"><img src="images/ui_btns_picture.svg" class="ui_btn"><div>make</div></div>');
        var deleteBtn = $('<div  class="btn_box"><img src="images/ui_btns_trash.svg" class="ui_btn"><div>delete</div></div>');
    
        var self = this;
        $(img).on("click",function()
        {
        	//screenLock();
        	//alert("ckicko");
        	var thumbnailPos = new OpenSeadragon.Point( Number(self.x),Number(self.y));
			viewer.viewport.zoomTo(Number(self.zoom),thumbnailPos, true); 
        	viewer.viewport.panTo(thumbnailPos,false);
        });

        copyURIBtn.on("click",function()
        {
	        var uri =  BASE_URL + "?zoom="+ self.zoom + "&x=" + self.x + "&y=" + self.y + "&perpixel=" + String(perPixelWeight); // + "&image=" + urlVars.image;
	        window.open().location.href = uri;

		});

		makeBtn.on("click",function()
		{
			//test
			exportImg();
		});
        
        deleteBtn.on("click",function()
        {
			$(this).parent().parent().remove();
			
			var cookieData = $.cookie(dziImageID); //画像IDにする
			var list = [];
			if(cookieData)
			{
				list = cookieData;
			}
			
			var deleteIdx = 0;
			var deleteFlg = false;
			
			for(var i = 0; i < list.length; i++)
			{
				var snapShot = list[i];
				if(snapShot.ID == self.ID)
				{
					deleteIdx = i;	
					deleteFlg = true;
				}
			}
			
			if(deleteFlg)
			{	
				list.splice(deleteIdx,1);
			}
			
			//上書き保存
			$.cookie(dziImageID,list);
		});
        
        listBox.append(copyURIBtn);
        listBox.append(makeBtn);
        listBox.append(deleteBtn);
        list.append(listBox);
                 
        return list;
	};
	
	function SnapShotManager()
	{	
		// viewer.viewport.getCenter(); 
		this.snapShotBtn = $('#snap_btn');
		this.snapList = [];
		
		this.addEvents();
	};
	
	SnapShotManager.prototype.loadData = function()
	{	
		//SnapShotsの読み込む
		this.snapList = $.cookie(dziImageID); //画像IDにする
		if(this.snapList)
		{
			for( var i =0; i < this.snapList.length; i++)
			{ 
				var snapData  = this.snapList[i];
				var snapShot = new SnapShot();
				snapShot.x = snapData.x;
				snapShot.y = snapData.y;
				snapShot.zoom = snapData.zoom;
				snapShot.ID = snapData.ID;
				
				var thumbnailID = dziImageID + "_" + snapShot.ID;
				var dataURL = window.localStorage[thumbnailID];
				
				var	img = $(document.createElement('img'));
				img.attr('src', dataURL);
		        img.addClass("snapshot_img");
				
				var list = snapShot.createList(img);
				$('#snapshot_list').append(list);
			} 
		}else{
			this.snapList = [];
		}
	};


	SnapShotManager.prototype.removeAllData = function()
	{
		this.snapList = [];
		$('#snapshot_list').empty();
	};

	// replace が trueのときは、全部置き換える
	SnapShotManager.prototype.loadJSONData = function(snapShotsData,replace)
	{
		//SnapShotsの読み込む
		//var cookieData = $.cookie(dziImageID); //画像IDにする
		if(snapShotsData)
		{
			if(replace)
			{
				this.snapList = snapShotsData;
				$('#snapshot_list').empty();

			}else
			{
				for (var i = 0;  i < snapShotsData.length ; i++) {
					var tmpData = snapShotsData[i];
					this.snapList.push(tmpData);
				}
			}

			for( var i =0; i < snapShotsData.length; i++)
			{ 
				var snapData  = snapShotsData[i];

				var snapShot = new SnapShot();
				snapShot.x = snapData.x;
				snapShot.y = snapData.y;
				snapShot.zoom = snapData.zoom;
				snapShot.ID = snapData.ID;
				snapShot.dataURL =  snapData.dataURL;
				
				var thumbnailID = dziImageID + "_" + snapShot.ID;
				var dataURL = snapShot.dataURL;
				//window.localStorage[thumbnailID];
				
				var	img = $(document.createElement('img'));
				img.attr('src', dataURL);
		        img.addClass("snapshot_img");
				
				var list = snapShot.createList(img);
				$('#snapshot_list').append(list);
			} 
		}
	};


	
	SnapShotManager.prototype.addEvents = function()
	{
		var self = this;
		
		this.snapShotBtn.on('mousedown', function()
		{
			self.snap();
		});
	};
	
	SnapShotManager.prototype.snap = function()
	{
		//効果音: シャッター
		document.getElementById("audio").play();	

		// wholeテスト
		//scaleToFit();
		var self = this;
		var center =  viewer.viewport.getCenter(); 
		var zoomLevel =  viewer.viewport.getZoom();
		var uri  =  "zoom"  + String(zoomLevel)  + "_x" +String(center.x) + "_y" + String(center.y);
		
		//var data_id  = "test1";
		var dataURL = viewer.drawer.canvas.toDataURL();
		
        var img = $(document.createElement('img'));
        img.attr('src', dataURL);
        img.addClass("snapshot_img");
        
        var id = new Date(); //
		id = id.getTime(); 
		
		var thumbnailID = dziImageID + "_" + String(id);
					
		//alert(thumbnailID);
		//window.localStorage[thumbnailID] = dataURL;
        // insert the thumbnail at the top of list

        var snapShot = new SnapShot();
        snapShot.zoom = String(zoomLevel);
        snapShot.x = String(center.x);
        snapShot.y = String(center.y);
        snapShot.ID = String(id);
        snapShot.dataURL = dataURL;

        //console.log(snapShot);
        
		var list = snapShot.createList(img);
        $('#snapshot_list').prepend(list);
		
		//var cookieData = $.cookie(dziImageID); //cookieのkey
		//alert(JSON.stringify(cookieData));
		/*
		var list = [];
		if(cookieData)
		{
        	list = cookieData;
    	}*/
       
		var snapShotData =  {"x":String(center.x),"y":String(center.y),"zoom":String(zoomLevel),"ID":String(id),"dataURL":dataURL};
		this.snapList.push(snapShotData);
		
		//alert(this.snapList.length);
		//上書き保存
		$.cookie(dziImageID,this.snapList);

		//デバッグ用
		//$("#test_display").html(uri);
		
		/*
		html2canvas(document.body, {
				onrendered: function(canvas)
				{	
					//document.body.appendChild(canvas);	
					var extra_canvas = document.createElement("canvas");
	                extra_canvas.setAttribute('width',document.body.clientWidth);
	                var canvasHeight = document.body.clientHeight;
	                extra_canvas.setAttribute('height',canvasHeight);
	                var ctx = extra_canvas.getContext('2d');
	               // ctx.drawImage(canvas,30,0,canvas.width-330, canvas.height-30,0,0,canvas.width-330,canvas.height-30);
	                //330以下の処理
	                ctx.drawImage(canvas,30,0,canvas.width-330, canvas.height,0,0,200,200 / (canvas.width-330) * canvas.height );
	               
	                
	                var dataURL = extra_canvas.toDataURL();
	                
	                
	                //var dataURL = canvas.toDataURL();
	                
	                var img = $(document.createElement('img'));
	                img.attr('src', dataURL);
	                img.addClass("snapshot_img");
	                
	                var id = new Date(); //
					id = id.getTime(); 
					
					
					var thumbnailID = dziImageID + "_" + String(id);
					
					//alert(thumbnailID);
					window.localStorage[thumbnailID] = dataURL;
	                
	                // insert the thumbnail at the top of list
	                var snapShot = new SnapShot();
	                snapShot.zoom = String(zoomLevel);
	                snapShot.x = String(center.x);
	                snapShot.y = String(center.y);
	                snapShot.ID = String(id);
	                
					var list = snapShot.createList(img);
	                $('#snapshot_list').prepend(list);
					
					
					var cookieData = $.cookie(dziImageID); //cookieのkey
					//alert(JSON.stringify(cookieData));
	               	               
					var list = [];
					if(cookieData)
					{
		            	list = cookieData;
	            	}
	               
					var snapShotData = {"x":String(center.x),"y":String(center.y),"zoom":String(zoomLevel),"ID":String(id)};
					list.push(snapShotData);
	
					//alert(snapShotData);
	               
					//上書き保存
					$.cookie(dziImageID,list);
		
				}
			});
			
			*/
	};


	$('#snapshot_shortcut').on('click',function(){
		snapShotManager.snap();
		exportImg();
	});
	
	/*
	SnapShotManager.prototype.getCookie= function( name )
	{
	    var result = null;
	    var cookieName = name + '=';
	    var allcookies = document.cookie;
	    var position = allcookies.indexOf( cookieName );
	
	    if( position != -1 )
	    {
	        var startIndex = position + cookieName.length;
	        var endIndex = allcookies.indexOf( ';', startIndex );

	        if( endIndex == -1 )
	        {
	            endIndex = allcookies.length;
	        }
	        
	        result = decodeURIComponent( allcookies.substring( startIndex, endIndex ) );
		}
		
		return result;
	}*/
	
	function PinManager()
	{
		this.pinsCookieData = [];
		this.pinImgs = [];
		this.annotations = [];
		this.pinKey = "pins_" + dziImageID;
	}
	
	PinManager.prototype.exportJSON = function()
	{
		var jsonTxt = JSON.stringify(this.pinsCookieData);
		setBlobUrl("download", jsonTxt);
		$("#download").click();
	};
	
	PinManager.prototype.showAnnotations = function(pinID)
	{
		var sIndex = 0;
		this.annotations = [];

		for(var i = 0; i < this.pinsCookieData.length; i++)
		{
			var pinData = this.pinsCookieData[i];
			if(String(pinID) === String(pinData.ID))
			{
				sIndex  = i;
				break;
			}
		}

		// Annotation のメジャーをプロット
		for(var j = 0; j < this.pinsCookieData.length; j++)
		{
			if(j != sIndex)
			{
				//alert(i);
				var sPinData = this.pinsCookieData[sIndex];
				var dPinData = this.pinsCookieData[j];
				var between = new MeasureBetweenAnnotation();
				between.drawAnnotations(sPinData,dPinData);
				this.annotations.push(between);
			}
		}
	};

	PinManager.prototype.removeAnnotations = function()
	{
		for(var i = 0; i < this.annotations.length; i++)
		{
			var annotations =  this.annotations[i];
			annotations.removeMarks();
		}
		this.annotations = [];
	};
	
	PinManager.prototype.addPin = function(pinImg,posx,posy,pinID)
	{	

		this.pinsCookieData.push({"x":posx,"y":posy,"ID":pinID,"label":""});
		this.pinImgs.push(pinImg);
		
		//alert(this.pinImgs.length);	
		//上書き保存
		$.cookie(this.pinKey,this.pinsCookieData);	
	};
	
	PinManager.prototype.updatePin = function(pinImg,posx,posy,pinID)
	{
		//this.pinsCookieData.push({"x":posx,"y":posy,"ID":pinID});
		//this.pinImgs.push(pinImg);
		//alert(pinID);
		
		for(var i = 0; i < this.pinsCookieData.length; i++)
		{
			
			var pinData = this.pinsCookieData[i];
			
			if(pinData.ID == pinID)
			{
				pinData.x = posx;
				pinData.y = posy;
				pinData.label = $("#al_"+String(pinData.ID)).val();
//				alert(pinData.label);

			}
			
			//alert(pinImg);
			//alert("call");
			//$(pinImg).remove();
			//this.drawPin(pos,pinID);
		}
		
		//alert(this.pinImgs.length);
		
		//上書き保存
		$.cookie(this.pinKey,this.pinsCookieData);
	};

	PinManager.prototype.updateLabel = function(pinID)
	{
		//this.pinsCookieData.push({"x":posx,"y":posy,"ID":pinID});
		//this.pinImgs.push(pinImg);
		//alert(pinID);
		
		for(var i = 0; i < this.pinsCookieData.length; i++)
		{
			
			var pinData = this.pinsCookieData[i];
			
			if(pinData.ID == pinID)
			{
				pinData.label = $("#al_"+String(pinData.ID)).val();
//				alert(pinData.label);

			}
			
			//alert(pinImg);
			//alert("call");
			//$(pinImg).remove();
			//this.drawPin(pos,pinID);
		}
		
		//alert(this.pinImgs.length);
		
		//上書き保存
		$.cookie(this.pinKey,this.pinsCookieData);
	};
	
	PinManager.prototype.removePin = function(pinID)
	{
		//this.pinsCookieData.push({"x":posx,"y":posy,"ID":pinID});
		//this.pinImgs.push(pinImg);

		var deleteIdx = 0;
		var deleteFlg = false;
		
		for(var i = 0; i < this.pinsCookieData.length; i++)
		{
			var pinData = this.pinsCookieData[i];
			
			if(pinData.ID == pinID)
			{
				deleteIdx = i;
				deleteFlg = true;
			}
			//alert(pinImg);
			//alert("call");
			//$(pinImg).remove();
			//this.drawPin(pos,pinID);
		}
	
		if(deleteFlg)
		{
			this.pinsCookieData.splice(deleteIdx, 1);				
		}
		
		//alert(this.pinImgs.length);
		
		//上書き保存
		$.cookie(this.pinKey,this.pinsCookieData);
		
	};
	
	PinManager.prototype.loadCookie = function()
	{
		//alert(this.pinKey);
		var data = $.cookie(this.pinKey);
		//console.log(data);
		if(data){
			this.pinsCookieData  = data;
		}else{
			
		}
	};
	
	PinManager.prototype.pinsOverride = function(data,replace)
	{
		if(data)
		{
			if(replace)
			{
				this.pinsCookieData  = data;
			}else
			{
				for(var i = 0; i < data.length; i++)
				{
					var tmpData = data[i];
					this.pinsCookieData.push(tmpData);
				}
			}
		}else
		{
		}
	};

	
	PinManager.prototype.removeAllData  =function()
	{
		
		for(var i = 0; i < this.pinImgs.length; i++)
		{
			
			var pinImg = this.pinImgs[i];
			//alert(pinImg);
			//alert("call");
			//$(pinImg).remove();
			viewer.removeOverlay(pinImg);
		}
		
		//配列初期化
		this.pinImgs = [];
		this.pinsCookieData  = [];

		this.removeAnnotations();
	};
	
	PinManager.prototype.draw = function()
	{
		// 全てのpinImgを消す操作
		//alert("draw");
		//var self = this;
		
		//alert(this.pinImgs.length);
		
		for(var i = 0; i < this.pinImgs.length; i++)
		{
			
			var pinImg = this.pinImgs[i];
			//alert(pinImg);
			//alert("call");
			//$(pinImg).remove();
			viewer.removeOverlay(pinImg);
		}
		
		//配列初期化
		this.pinImgs = [];
		
		//描画
		
		for(var i = 0; i < this.pinsCookieData.length; i++)
		{
			var pinData = this.pinsCookieData[i];
			var pos = new OpenSeadragon.Point(pinData.x,pinData.y);
			var pinID = pinData.ID;
			var labelTxt = pinData.label;
			//alert(pinImg);
			//alert("call");
			//$(pinImg).remove();
			this.drawPin(pos,pinID,labelTxt);	
		}
	};
	
	PinManager.prototype.drawPin = function(pos,pinID,labelTxt)
	{			
		
		var self = this;
		
		var id = pinID;
				
		var pin = new Image(); // pin 定義

		//これもpinのオブジェクトにもたせてしましたい。
		this.pinImgs.push(pin);

		//pin.src = './images/ui_annotation.svg';
		pin.src = './images/pin_mark.svg';
		
		$(pin).addClass('pin ' + id);
		$(pin).addClass('pin_mark'); //alert(String($(pin).height()));
		$(pin).attr('data-id',id);
		
		$(pin).draggable({
			
			revert:false,
			
			start:function(e)
			{
				console.log("pin draggable start");
							
				pinDown = true; // pinを押しました
				movedX = $(pin).offset().left - pin.width / 2; // ピンの座標
				movedY = $(pin).offset().top;
				downX = e.pageX; // mousedown座標
				downY = e.pageY;
				
				// console.log(e.offsetX);
				startOffsetX = e.offsetX;
				startOffsetY = e.offsetY;
				
				/*
				var webPoint =  new OpenSeadragon.Point(e.clientX, e.clientY); // pinned position
				var viewportPoint = viewer.viewport.pointFromPixel(webPoint); // viewport p
				viewer.updateOverlay(pin, viewportPoint); // pin の位置を更新
				*/

				//isMove = false; // pinをドラッグしたかどうか: off
				targetPin = pin; // 押したpin
				targetMenu = menu; // 押したmenu
				$numberX = $(menu).find('.number-x'); // menuのx座標描くところ
				$numberY = $(menu).find('.number-y');
				pinWidth = pin.width; // pin の幅
				pinHeight = pin.height; // pin の高さ
				
				// Menuを隠す
				setTimeout(function() { // 少し待ってから
					if(isMenuShow) { // pin に mouseover してなければ
						isMenuShow = false; // menu is hide
						$(menu).removeClass('show'); // menu を 隠す
					}
				
				}, 60);	
			},stop:function(e)
			{	
				//e.stopPropagation()
				console.log("drragable stop");		
							
				// ピンをドラッグしているとき
				// pinned position
				var x = e.pageX -40.0; // mousedown座標
				var y = e.pageY;
				
				// ドラッグ時に、ピン画像を触っている場所のoffset分をずらす。
				x = x + pinWidth/2.0 - startOffsetX;
				y = y + pinHeight - startOffsetY;

				var webPoint = new OpenSeadragon.Point(Number(x),Number(y));
				
				//console.log(webPoint);
				webPoint.x = x;
				webPoint.y = y;

				console.log(webPoint.x);							
				console.log(webPoint.y);

				viewer.setMouseNavEnabled(true);

				var viewportPoint = viewer.viewport.pointFromPixel(webPoint); // viewport point
				
				console.log(viewportPoint.x);							
				console.log(viewportPoint.y);

				viewer.updateOverlay(targetPin, viewportPoint); // pin の位置を更新
				viewer.updateOverlay(targetMenu, viewportPoint); // menu の位置を更新
				
				//$numberX = $(menu).find('.number-x'); // menuのx座標描くところ
				//$numberY = $(menu).find('.number-y');

				var realPosX = viewportPoint.x * (viewer.source.width * perPixelWeight);
				var realPosY = (viewer.source.height/viewer.source.width - viewportPoint.y) * (viewer.source.width * perPixelWeight);

				$numberX.text(Math.round(realPosX * 100) / 100); // menu の pinのx位置 を更新
				$numberY.text(Math.round(realPosY * 100) / 100); // menu の pinのy位置 を更新
				
				// cookie更新
				pinManager.updatePin(targetPin,viewportPoint.x,viewportPoint.y,$(targetPin).attr("data-id"));
				targetPin = null;
				pinDown = false;
			}
		});
		
		document.body.appendChild(pin); // append pin

		// pinned position
		var viewportPoint = pos; // viewport point
		viewer.addOverlay(pin, viewportPoint, 'BOTTOM'); // place pin to viewer
		
		var isMenu = false; // 
		var isPinOver = false; // is mouseover on the pin
		var isMenuShow = false; // is show the menu
		
		//Number(viewportPoint.x).toFixed(3)

		var menu = document.createElement('div'); // menu 定義
		/*
		$(menu).addClass('menu ' + id)
			.append('<input type="text" class="text" placeholder="label">') // pin の label
			.append('<div class="position-x">x:<span class="number-x">' +  (Math.round(viewportPoint.x * 1000) / 1000)  + "μm" + '</span></div>') // pin の x座標
			.append('<div class="position-y">y:<span class="number-y">' + (Math.round(viewportPoint.y * 1000) / 1000)  + "μm" + '</span></div>'); // pin の y座標
		*/	
		//pinData.label = $("#al_"+String(id)).val();


		var input =  '<input type="text"  value="'+labelTxt+'" class="annotation_input_text"'+ ' id="al_' + String(id) +'" placeholder="'+ labelTxt +'">';
					//var input =  '<input type="text" class="annotation_input_text"'+ ' id="test_input" placeholder="label">';
		
		var realPosX = viewportPoint.x * (viewer.source.width * perPixelWeight);
		var realPosY = (viewer.source.height/viewer.source.width - viewportPoint.y) * (viewer.source.width * perPixelWeight);


		$(menu).addClass('menu ' + id)
		.append(input) // pin の label
		.append('<div class="position-x">x:<span class="number-x">' + (Math.round(realPosX * 100) / 100) + "μm" + '</span></div>') // pin の x座標
		.append('<div class="position-y">y:<span class="number-y">' + (Math.round(realPosY * 100) / 100) + "μm" +  '</span></div>'); // pin の y座標
		
		var inputID = "#al_" + String(id);
		$(document).on('change',inputID,function()
		{
			pinManager.updateLabel(String(id));
		});

		var $removeBtn = $('<div class="btn_box annotation_menu_btn"><img src="images/ui_pin_trash.svg" class="ui_btn"><div>remove</div></div>');
		$removeBtn.on({'click':function()
		{
				self.removePin(pinID);
				viewer.removeOverlay(pin);
				viewer.removeOverlay(menu);
				$(menu).remove();
				$(pin).remove();

				viewer.setMouseNavEnabled(true);
				// pin を press してなければ
				pinManager.removeAnnotations();
		
				setTimeout(function()
				{ // 少し待ってから
					if(!isPinOver)
					{ 
						// pin に mouseover してなければ
						isMenuShow = false; // menu is hide
						$(menu).removeClass('show'); // menu を 隠す
					}
				}, 300);
			}
		});
		
		$(menu).append($removeBtn);
		viewer.addOverlay(menu, viewportPoint, 'BOTTOM'); // menu を viewer に配置
		
		$(pin).add($(menu)).on(
		{ // pin & menu のイベント
			'mouseover.pinMenu': function(e)
			{ // mouseover イベント
				isPinOver = true; // ピンにマウスオーバー
				//preventDefault
				//画面へのマウス操作を禁止
				viewer.setMouseNavEnabled(false);
				
				if(!pinDown && !isMenuShow)
				{
					if(measureManager.isEnable  && !measureManager.isMeasureMoving)
					{
						//alert(pinID);
						pinManager.showAnnotations(pinID);
					}

					setTimeout(function() {
						if(isPinOver && !measureManager.isEnable) {
							isMenuShow = true;
							$(menu).addClass('show');
						}
					}, 300);
				}
			},
			'mouseleave.pinMenu': function() { // pin からの mouseover が外れた時のイベント
				isPinOver = false; // is mouseover on the pin
				
				if(!pinDown)
				{ 
					viewer.setMouseNavEnabled(true);
					// pin を press してなければ
					pinManager.removeAnnotations();
					setTimeout(function() { // 少し待ってから
						if(!isPinOver) { // pin に mouseover してなければ
							isMenuShow = false; // menu is hide
							$(menu).removeClass('show'); // menu を 隠す
						}
					}, 300);
				}
			},
			'mousedown.pinMenu': function(e) { // pin, menu の上でclickした時にviewerが反応(拡大)しないようにする
				e.stopPropagation();
			}
		});
		
		/*
		$(pin).add($(menu)).on({ // pin & menu のイベント
			'mouseover.pinMenu': function(e) { // mouseover イベント
				isPinOver = true; //
				if(!pinDown && !isMenuShow) {
					setTimeout(function() {
						if(isPinOver) {
							isMenuShow = true;
							$(menu).addClass('show');
						}
					}, 300);
				}
			},
			'mouseleave.pinMenu': function() { // pin からの mouseover が外れた時のイベント
				isPinOver = false; // is mouseover on the pin
				if(!pinDown) { // pin を press してなければ
					setTimeout(function() { // 少し待ってから
						if(!isPinOver) { // pin に mouseover してなければ
							isMenuShow = false; // menu is hide
							$(menu).removeClass('show'); // menu を 隠す
						}
					}, 300);
				}
			},
			'mousedown.pinMenu': function(e) { // pin, menu の上でclickした時にviewerが反応(拡大)しないようにする
				e.stopPropagation();
			}
		});
		
		$(pin).on({
			'mousedown.pin': function(e) {
				if(isPin) { // pinボタンがon
					if(e.buttons === 1) { // 左mousedown
						pinDown = true; // pinを押しました
						movedX = $(pin).offset().left - pin.width / 2; // ピンの座標
						movedY = $(pin).offset().top;
						downX = e.pageX; // mousedown座標
						downY = e.pageY;
						isMove = false; // pinをドラッグしたかどうか: off
						targetPin = pin; // 押したpin
						targetMenu = menu; // 押したmenu
						$numberX = $(menu).find('.number-x'); // menuのx座標描くところ
						$numberY = $(menu).find('.number-y');
						pinWidth = pin.width; // pin の幅
						pinHeight = pin.height; // pin の高さ
					}
				}
			}
		});	*/
	};
	
	// 全削除
	$("#delete_all_btn").on(
				'click', function()
				{
					
					$.cookie(dziImageID,null);
					$.cookie(pinKey,null);
						
					window.localStorage.clear();
					
					pinManager.removeAllData();
					snapShotManager.removeAllData();
					//alert("");
				});
	
	PinManager.prototype.saveCookie = function()
	{

	};

	function zoomLockCheck()
	{
		//alert(isPin);
		if(measureManager.isEnable || isPin )
		{
			viewer.gestureSettingsMouse.clickToZoom = false;
		}

		if(!measureManager.isEnable && !isPin )
		{
			viewer.gestureSettingsMouse.clickToZoom = true;
		}
	}
	
	// Measure
	function MeasureManager(measureBtn,measureShortCutBtn)
	{
		this.$measureBtn = measureBtn;
		this.$measureShortCutBtn = measureShortCutBtn;
		this.measureLabel = null;
		
		this.isEnable = false;
		this.isMeasureMoving =false;
		
		this.markSource = null;
		this.markDestination = null;
		
		this.sx = 0.0;
		this.sy = 0.0;
		
		//measure_dot.svg
		this.measureDots = [];
		this.addEvents();
	}
	
	MeasureManager.prototype.addEvents = function()
	{
		var self = this;

		this.toggleStatus = function()
		{
			if(isPin)
			{
				$('#pin img').attr("src","images/ui_btns_annotation.svg");
				$('#pin_shortcut').attr("src","images/ui_btns_annotation.svg");
				$('#pin').removeClass('on');
				isPin = false;
			}

			self.isEnable = !self.isEnable;
			//viewer.gestureSettingsMouse.clickToZoom = !self.isEnable;
			

			if(self.isEnable)
			{
				//if(isScreenLock){
				//	screenUnLock();
				//}

				zoomLockCheck();

				$('#measure_btn img').attr("src","images/ui_btns_measure_active.svg");
				$('#measure_shortcut').attr("src","images/ui_btns_measure_active.svg");
			}else
			{
				$('#measure_btn img').attr("src","images/ui_btns_measure.svg");
				$('#measure_shortcut').attr("src","images/ui_btns_measure.svg");
				self.removeMarks();
				self.isMeasureMoving = false;
			}

		};
		
		this.$measureBtn.on('click',function()
		{
			self.toggleStatus();
		});

		this.$measureShortCutBtn.on('click',function()
		{
			self.toggleStatus();
		});
	};
	
	MeasureManager.prototype.removeMarks = function()
	{
		for(var i = 0; i < this.measureDots.length; i++)
		{
			var dot = this.measureDots[i];
			viewer.removeOverlay(dot);
			$(dot).remove();
		}
		
		viewer.removeOverlay(this.markSource);
		viewer.removeOverlay(this.markDestination);
		viewer.removeOverlay(this.measureLabel);
		
		$(this.markSource).remove();
		$(this.markDestination).remove();
		$(this.measureLabel).remove();
		
		this.markSource = null;
		this.markDestination = null;
		this.measureLabel = null;
		this.measureDots = [];

		//ここでやるとダメ
		//this.isMeasureMoving = false;
	};

	function MeasureBetweenAnnotation()
	{
		this.markSource = null;
		this.markDestination = null;
		this.measureLabel = null;
		this.measureDots = [];
	}

	MeasureBetweenAnnotation.prototype.drawLine = function(sPinData,dPinData)
	{

		//alert("draw");

		/*

		var line = document.createElement('div'); // menu 定義
		$(line).addClass('divline');
		document.body.appendChild(line);
		viewer.addOverlay(line, new OpenSeadragon.Point(0,0), 'BOTTOM');


		var x1 = sPinData.x;
        var x2 = dPinData.x;
       	
       	var y1 = sPinData.y;
        var y2 = dPinData.y;
 
        var hypotenuse = Math.sqrt((x1-x2)*(x1-x2) + (y1-y2)*(y1-y2));
        hypotenuse * 
        var angle = Math.atan2((y1-y2), (x1-x2)) *  (180/Math.PI);

        if(angle >= 90 && angle < 180){
            y1 = y1 - (y1-y2);
        }
        if(angle > 0 && angle < 90){
            x1 = x1 - (x1-x2);
            y1 = y1 - (y1-y2);
        }
        if(angle <= 0 && angle > -90){
            x1 = x1 - (x1-x2);
        }

        $(line).queue(function(){
            //$(line).offset({top: y1, left: x1});

            var pos = new OpenSeadragon.Point(sPinData.x + (dPinData.x - sPinData.x)/2.0, sPinData.y  + (dPinData.y - sPinData.y)/2.0 );

            viewer.addOverlay(line, pos, 'BOTTOM');
            $(line).dequeue();
        }).queue(function(){
            $(line).width(hypotenuse);
            $(line).dequeue();
        }).queue(function(){
           $(line).rotate(angle);
            $(line).dequeue();
        });*/
	}


	MeasureBetweenAnnotation.prototype.drawAnnotations = function(sPinData,dPinData)
	{

		var splitNumber = 10;

		for(var i = 0; i < splitNumber; i++)
		{
			var dot = new Image(); // pin 定義					
			dot.src = './images/measure_dot.svg';
			$(dot).addClass('measure_dot');
			document.body.appendChild(dot); // append pin
			viewer.addOverlay(dot, new OpenSeadragon.Point(0,0), 'BOTTOM');
			this.measureDots.push(dot);
		}	
					
		var label = document.createElement('div'); // menu 定義
		$(label).addClass('measure_label');
		$(label).text("10μm");
		document.body.appendChild(label);
		
		this.measureLabel = label;

		//var webPoint =new OpenSeadragon.Point( dPinData.x,dPinData.y); // pinned position
		//var viewportPoint = viewer.viewport.pointFromPixel(webPoint); // viewport point					
		//viewer.updateOverlay(this.markDestination, viewportPoint); // pla	
		var gradient = (dPinData.y - sPinData.y) / (dPinData.x - sPinData.x);
		var dx = (dPinData.x - sPinData.x) / (splitNumber+1.0);
		
		for(var i = 0; i < splitNumber; i++)
		{
			var dot = this.measureDots[i]; // pin 定義					
			//console.log(measureManager.sx + dx * (i+1));
			var pos = new OpenSeadragon.Point(sPinData.x + dx * (i+1), sPinData.y + gradient *  (dx * (i+1)) );
			viewer.updateOverlay(dot, pos);
		}

		var distanceValue = Math.sqrt(Math.pow((dPinData.y - sPinData.y),2) + Math.pow((dPinData.x - sPinData.x),2));

		var realWidth = viewer.source.width * perPixelWeight;
		distanceValue  = Number(distanceValue * realWidth).toFixed(3);

		// 1.0 あたり実寸をかけたい
		var pos = new OpenSeadragon.Point(sPinData.x + dx * ((splitNumber+1.0)/2.0), sPinData.y + gradient *  (dx * ((splitNumber+1.0)/2.0)) );
		//距離の表示
		viewer.addOverlay(label, new OpenSeadragon.Point(0,0), 'BOTTOM');
		viewer.updateOverlay(this.measureLabel, pos);
		$(this.measureLabel).text(String(distanceValue) + "μm");
		
	};

	MeasureBetweenAnnotation.prototype.removeMarks = function()
	{
		for(var i = 0; i < this.measureDots.length; i++)
		{
			var dot = this.measureDots[i];
			viewer.removeOverlay(dot);
			$(dot).remove();
		}
		
		viewer.removeOverlay(this.markSource);
		viewer.removeOverlay(this.markDestination);
		viewer.removeOverlay(this.measureLabel);
		
		$(this.markSource).remove();
		$(this.markDestination).remove();
		$(this.measureLabel).remove();
		
		this.markSource = null;
		this.markDestination = null;
		this.measureLabel = null;
		this.measureDots = [];			
	};
	
	// MetaData 仮
	// ここの""のなかには何も入力しなくて良いかも
	function MetaData()
	{
		this.labelData = "";
		this.derivesData = "";		
		this.taxData = "";				
		this.strain_data = "";						
	}
	
	MetaData.prototype.reloadMetadata = function()
	{
		$("#label_data").text(this.labelData);
		$("#derives_data").text(this.derivesData);
		$("#tax_data").text(this.taxData);
		$("#strain_data").text(this.strain_data);
	};

	function Color(red,green,blue)
	{
		this.red = red;
		this.green = green;
		this.blue = blue;
	}

	Color.prototype.getRgbText = function()
	{ 
		return 'rgb(' +  parseInt(this.red) + ',' + parseInt(this.green) +  ',' + parseInt(this.blue) + ')';
	};

	var menu = new Menu();
	var sectionOverview = new SectionHeader("overview");
	var sectionMetadata = new SectionHeader("metadata");		
	var sectionSnapshot = new SectionHeader("snapshot");
	var sectionAnnotation = new SectionHeader("annotation");
	var sectionMeasure = new SectionHeader("measure");
	var sectionFile = new SectionHeader("file");

	//Meta Data 更新 ここを更新すること
	// ここでメタデータを入力することもできるが。。まだしない
	var metaData = new MetaData();
	metaData.labelData = "";
	metaData.derivesData = "";		
	metaData.taxData = "";				
	metaData.strain_data = "";
	metaData.reloadMetadata();
	
	// Snap Btn
	var snapShotManager = new SnapShotManager();
	
	// Pinの管理
	var pinManager = new PinManager();

	var loadLocalData = function(){
		snapShotManager.loadData();
		pinManager.loadCookie();
		pinManager.draw();
	};
	
	// Measureの管理
	var measureManager = new MeasureManager($("#measure_btn"),$("#measure_shortcut"));

	var drawCompleteId, // id for setTimeout and clearTimeout
		isDrawComplete = false; // if drawing images is completed
	
	viewer.addHandler('tile-drawn', function()
	{ // run when each image has drawn
		
		if(isDrawComplete) { return; } // return if drawing images is completed
		


		clearTimeout(drawCompleteId); // clear setTimeout if drawing images is not completed
		
		drawCompleteId = setTimeout(function() { // do	if drawing images is completed
		
			console.log("draw complete");

			isDrawComplete = true; // drawing is completed
			
			var mapWidth = $('#map').width(),
				mapHeight = $('#map').height();

			var viewportMapPoint = viewer.viewport.pointFromPixel(new OpenSeadragon.Point(mapWidth, mapHeight)); // convert pixel point to viewport point
			var viewportMapWidth = viewportMapPoint.x,
				viewportMapHeight = viewportMapPoint.y;

			//	alert(viewportMapWidth);

			var minZoom = viewer.viewport.getMinZoom(), // equals to viewer's minZoomLevel
				maxZoom = viewer.viewport.getMaxZoom(); // equals to viewer's maxZoomLevel
			var minImageZoom = viewer.viewport.viewportToImageZoom(minZoom), // convert minZoomLevel to image-based zoom (image zoom displays 1 at full image size)
				maxImageZoom = viewer.viewport.viewportToImageZoom(maxZoom); // convert maxZoomLevel to iamge-based zoom
			var imageWidth = viewer.source.width * perPixelWeight, // 画像サイズを160 で割ると軸の単位がμmなので160pixel あたり1μmになる 
				imageHeight = viewer.source.height * perPixelWeight; // 
				
			var imageMapWidth = imageWidth * viewportMapWidth, // imageWidth に viewport Map Width をかけたもの
				imageMapHeight = imageHeight * viewportMapHeight; // 
			
			//d3 axis の表示
			var margin = {top: 0, right: 0, bottom: 0, left: 40}, 
					width = $('#map').width(),
					height = $('#map').height();
					
			//alert(viewportMapWidth);
			var dataset = [
				{x: 0, y: 0},
				{x: imageMapWidth, y: imageMapHeight}
			];
			
			var xScale = d3.scale.linear()
					.domain([0, d3.max(dataset, function(d){ return d.x; })])
					.range([0, width]);
					
			var yScale = d3.scale.linear()
				.domain([0, d3.max(dataset, function(d){ return d.y; })])
					.range([height, 0]);
			
			var xAxis = d3.svg.axis()
					.scale(xScale)
					.orient("bottom")
					.innerTickSize(-height)	// 目盛線の長さ（内側）
					.outerTickSize(0) // 目盛線の長さ（外側）
					.tickPadding(10); // 目盛線とテキストの間の長さ
			
			var yAxis = d3.svg.axis()
					.scale(yScale)
					.orient("left")
					.innerTickSize(-width)
					.outerTickSize(0)
					.tickPadding(10);
					
			var line = d3.svg.line()
					.x(function(d) { return xScale(d.x); })
					.y(function(d) { return yScale(d.y); });
					
			var axisSvg = d3.select("body").append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
				.append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					
			axisSvg.append("g")
			 		.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")") //x軸を下漬けに
					.call(xAxis);
				
				/*
					.append("text")
						.attr("x", width + 16)
						.attr("y", 0)
							.style("text-anchor", "end")
							.style("fill", "white")
							.style("font-size", "12px")
								.text("(μm)");
				*/
			
			axisSvg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
				//	.attr("x", 0)
				//	.attr("y", height) 
					.attr("x", 0-30)
					.attr("y", height+15) 
						.style("text-anchor", "start")
						.style("fill", "white")
						.style("font-size", "12px")
							.text("(μm)");

			/*		
					
		 	axisSvg.append("g")
		 		.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis)
				.append("text")
					.attr("x", width + 16)
					.attr("y", 34)
						.style("text-anchor", "end")
						.style("fill", "white")
						.style("font-size", "12px")
							.text("(μm)");
			axisSvg.append("g")
				.attr("class", "y axis")
				.call(yAxis)
				.append("text")
					.attr("x", -40)
					.attr("y", -10)
						.style("text-anchor", "start")
						.style("fill", "white")
						.style("font-size", "12px")
							.text("(μm)");
							
			*/
							
			//range
			var svgWidth = 300; // SVG領域の横幅
			var svgHeight = 30;		// SVG領域の縦幅
			
			var rangeLineWidth = 280;
			
			var rangeSvg = d3.select("#range").append("svg")
					.attr("width", svgWidth).attr("height", svgHeight);
					
			// 目盛りを表示するためにスケールを設定
			var rangeScale = d3.scale.linear()	// スケールを設定
					.domain([minImageZoom, maxImageZoom])	 // 元のサイズ
					.range([0, svgWidth]); // 実際の出力サイズ
			
			// 目盛りを設定し表示する
			rangeSvg.append("line")
						.attr("x1",10)
						.attr("x2",10+rangeLineWidth)
						.attr("y1",4)
						.attr("y2",4)	
						.attr("stroke-width",1)
						.attr("stroke","#ffffff")
						.attr("opacity","0.2");
									
			/*
			#3dccd4
			#7ed8a7
			#bee47a
			#fff04d	
			*/

			// 0.5 １、３、５、１０、２０、３０、５０
			
			// 49.5

			// (input - 0.5) / 49.5 * rangeLineWidth

			var array = [0.5, 1.0, 3.0, 5.0, 10.0, 20.0, 30.0, 50.0];

			/*

				source:
				r,g,b
				61
				204
				212

				destination:
				r,g,b
				255,240,77

			*/

			var sColor  = new Color(61,204,212);
			var dColor  = new Color(255,240,77);
			var colorDigit  = array.length;

			var dRed = (dColor.red -sColor.red)/colorDigit;
			var dGreen = (dColor.green -sColor.green)/colorDigit;
			var dBlue = (dColor.blue -sColor.blue)/colorDigit;

			for(var i = 0; i < array.length; i++)
			{
				var num = array[i];

				//var s = (num - 0.5) / 49.5; 
				var s = (num - 0.5) / 199.5;

				var tmpColor  = new Color(sColor.red + dRed * i,
					sColor.green + dGreen * i,
					sColor.blue + dBlue * i);

				rangeSvg.append("rect")
						.attr("x",-1+rangeLineWidth * s +10)
						.attr("y",0)
						.attr("width",2)
						.attr("height",8)	
						.attr("fill",tmpColor.getRgbText())
						.attr("opacity","1.0");	

				if(i == 1 || i == 4 || i== 6)
				{
					rangeSvg.append("text")
					.attr("x", -1+rangeLineWidth * s +10+8)
					.attr("y", 18)
						.style("text-anchor", "end")
						.style("fill", "white")
						.style("font-size", "8px")
							.text("x"+String(num));	


				}
			}

			/*
			rangeSvg.append("rect")
						.attr("x",-1+10)
						.attr("y",0)
						.attr("width",2)
						.attr("height",8)	
						.attr("fill","#3dccd4")
						.attr("opacity","1.0");
			
			rangeSvg.append("rect")
						.attr("x",-1+rangeLineWidth/4.0 * 1+10)
						.attr("y",0)
						.attr("width",2)
						.attr("height",8)	
						.attr("fill","#3dccd4")
						.attr("opacity","1.0");	
			
			rangeSvg.append("rect")
						.attr("x",-1+rangeLineWidth/4.0 * 2+10)
						.attr("y",0)
						.attr("width",2)
						.attr("height",8)	
						.attr("fill","#7ed8a7")
						.attr("opacity","1.0");		
						
			rangeSvg.append("rect")
						.attr("x",-1+rangeLineWidth/4.0 * 3+10)
						.attr("y",0)
						.attr("width",2)
						.attr("height",8)	
						.attr("fill","#bee47a")
						.attr("opacity","1.0");	
			
			rangeSvg.append("rect")
						.attr("x",-1+rangeLineWidth/4.0 * 4+10)
						.attr("y",0)
						.attr("width",2)
						.attr("height",8)	
						.attr("fill","#fff04d")
						.attr("opacity","1.0");	
			*/


			// 左右端の数値
			/*
			// 左側メモリ
			rangeSvg.append("text")
					.attr("x", -1+10+4)
					.attr("y", 18)
						.style("text-anchor", "end")
						.style("fill", "white")
						.style("font-size", "8px")
							.text("x"+String(minZoomLevel));	

			// 右側メモリ			
			rangeSvg.append("text")
					.attr("x", -1+rangeLineWidth/4.0 * 4+10+4)
					.attr("y", 18)
						.style("text-anchor", "end")
						.style("fill", "white")
						.style("font-size", "8px")
							.text("x"+String(maxZoomLevel));			
				*/



			/*
				svg.append("rect")
				.attr("x",100)
				.attr("y",70)
				.attr("width",50)
				.attr("height",30)
				.attr("fill","red");		
			*/
						
			/*
			rangeSvg.append("g")
					.attr("class", "axis")
					.attr("transform", "translate(10, 0)")
					.call(d3.svg.axis()
						.outerTickSize(0)
						.innerTickSize(0)
							.scale(rangeScale)	//スケールを適用する
							.ticks(4)
							.tickFormat(function(d){ return "x "+d; })
					);*/
					/*
				.append("text")
					.attr("x", 230)
					.attr("y", 22)
						.style("text-anchor", "start")
						.style("fill", "white")
							.text("");*/
							
			// range-bar
			
			//<img src="images/title_icons_arrow_opened.svg" class="section_arrow" id="range-bar">
			
			/*
			var rangeHtml = '<div id="range-area">' +
					'<div id="range-bar"></div>' +
				'</div>';
			*/
			/*
				var rangeHtml = '<div id="range-area">' +
					'<img src="images/range_arrow.svg" id="range-bar">' +
				'</div>';	
			*/
			
			var rangeHtml = '<div id="range-area">' +
					'<div id="range-bar"></div>' +
				'</div>';
					
			$(rangeHtml).appendTo('#range');
			
			//console.log(viewer);
			// prevent default wheel action
			$(window).on('wheel', function(e)
			{
				e.preventDefault();
			});
			
			//Pin
			var pinList = [], isPinCansel = false, isPinPress = false;

			// pin button
			$('#pin').on('mousedown', function()
			{
				if(measureManager.isEnable)
				{
					$('#measure_btn img').attr("src","images/ui_btns_measure.svg");
					$('#measure_shortcut').attr("src","images/ui_btns_measure.svg");
					measureManager.removeMarks();
					measureManager.isMeasureMoving = false;
					measureManager.isEnable = false;
				}


				$('#pin').toggleClass('on');
				isPin = $('#pin').hasClass('on');

				//viewer.gestureSettingsMouse.clickToZoom = !isPin;
				zoomLockCheck();

				if(isPin)
				{
					//if(isScreenLock){
					//	screenUnLock();
					//}
					zoomLockCheck();

					$('#pin img').attr("src","images/ui_btns_annotation_active.svg");
					$('#pin_shortcut').attr("src","images/ui_btns_annotation_active.svg");
				}else
				{
					$('#pin img').attr("src","images/ui_btns_annotation.svg");
					$('#pin_shortcut').attr("src","images/ui_btns_annotation.svg");
				}
			});
			
			$('#pin_shortcut').on('mousedown', function()
			{
				if(measureManager.isEnable)
				{
					$('#measure_btn img').attr("src","images/ui_btns_measure.svg");
					$('#measure_shortcut').attr("src","images/ui_btns_measure.svg");
					measureManager.removeMarks();
					measureManager.isMeasureMoving = false;
					measureManager.isEnable = false;
				}

				$('#pin').toggleClass('on');
				isPin = $('#pin').hasClass('on');

				//viewer.gestureSettingsMouse.clickToZoom = !isPin;
				zoomLockCheck();

				if(isPin)
				{
					//if(isScreenLock){
					//	screenUnLock();
					//}
					zoomLockCheck();

					$('#pin img').attr("src","images/ui_btns_annotation_active.svg");
					$('#pin_shortcut').attr("src","images/ui_btns_annotation_active.svg");
				}else
				{
					$('#pin img').attr("src","images/ui_btns_annotation.svg");
					$('#pin_shortcut').attr("src","images/ui_btns_annotation.svg");
				}
			});
			
			viewer.addHandler('canvas-drag', function()
			{
				// viewer ドラッグ時のイベント
				//isPinMove = true;
				//isMove = true;
				/*
				if(pinDown)
				{	
					var webPoint = e.position; // pinned position
					//console.log(e);
				
				//startX = e.clientX;
				//startY = e.clientY;
				
				var viewportPoint = viewer.viewport.pointFromPixel(webPoint); // viewport point
				viewer.updateOverlay(targetPin, viewportPoint); // pin の位置を更新
						viewer.updateOverlay(targetMenu, viewportPoint); // menu の位置を更新	
					//pinDown = false;
				}*/
			});
			
			// ドラッグ終了は？
			viewer.addHandler('canvas-press', function(e) { // viewer プレス時のイベント
				//isPinMove = false;
				//isMove = false;


		
			});
			
			// viewerから離れた時
			viewer.addHandler('canvas-release', function(e)
			{
				console.log("viewer canvas-release");

				//alert("canvas - release");	
				if(measureManager.isEnable)
				{

					//alert("canvas-release");
					measureManager.removeMarks();
					//e.preventDefault();
					return;
					
				}else if(pinDown)
				{	
					/*
					console.log("viewer canvas-release && pinDown");

					// ピンをドラッグしているとき
					var webPoint = e.position;// pinned position
					var x = e.position.x;
					var y = e.position.y;
					
					// ドラッグ時に、ピン画像を触っている場所のoffset分をずらす。
					x = x + pinWidth/2.0 - startOffsetX;
					y = y + pinHeight - startOffsetY;
					
					//console.log(webPoint);
					webPoint.x = x;
					webPoint.y = y;
			
					var viewportPoint = viewer.viewport.pointFromPixel(webPoint); // viewport point
					viewer.updateOverlay(targetPin, viewportPoint); // pin の位置を更新
					viewer.updateOverlay(targetMenu, viewportPoint); // menu の位置を更新
					
					//$numberX = $(menu).find('.number-x'); // menuのx座標描くところ
					//$numberY = $(menu).find('.number-y');
					$numberX.text(Math.round(viewportPoint.x * 1000) / 1000); // menu の pinのx位置 を更新
					$numberY.text(Math.round(viewportPoint.y * 1000) / 1000); // menu の pinのy位置 を更新
					
					// cookie更新
					pinManager.updatePin(targetPin,viewportPoint.x,viewportPoint.y,$(targetPin).attr("data-id"));
					
					targetPin = null;
					
					pinDown = false;*/

				}

			});
			
			// click て話したときに呼ばれる
			viewer.addHandler('canvas-click', function(e)
			{ 
				// viewer click 時のイベント
				//if(!isPin) { return; } // if pin button is off, return	
				if(isPinMove) { return; } // if mouseup after moves pin, return

				

				//if(isMove){return;}
				//メジャーがオンのとき
				if(measureManager.isEnable)
				{
					//alert("measure click");

					if(measureManager.isMeasureMoving)
					{
						measureManager.isMeasureMoving = false;
						//measureManager.removeMarks();
					//	alert("remove marks");
					}
					else
					{
						//alert("add marks");

						measureManager.isMeasureMoving = true;
						
						//alert("measure");
						var mark = new Image(); // pin 定義					
						mark.src = './images/measure_pin.svg';
						$(mark).addClass('measure_pin');
						document.body.appendChild(mark); // append pin
						var webPoint = e.position; // pinned position
						var viewportPoint = viewer.viewport.pointFromPixel(webPoint); // viewport point					
						viewer.addOverlay(mark, viewportPoint, 'BOTTOM'); // pla
						measureManager.markSource = mark;

						var markDest = new Image(); // pin 定義					
						markDest.src = './images/measure_pin.svg';
						$(markDest).addClass('measure_pin');
						document.body.appendChild(markDest); // append pin
						viewer.addOverlay(markDest, viewportPoint, 'BOTTOM');
						measureManager.markDestination = markDest;
						
						//e.stopPropagation();
						//this.measureDots
						measureManager.sx = viewportPoint.x;
						measureManager.sy = viewportPoint.y;
						
						for(var i = 0; i < 6; i++)
						{
							var dot = new Image(); // pin 定義					
							dot.src = './images/measure_dot.svg';
							$(dot).addClass('measure_dot');
							document.body.appendChild(dot); // append pin
							viewer.addOverlay(dot, viewportPoint, 'BOTTOM');
							measureManager.measureDots.push(dot);
						}	
						
						var label = document.createElement('div'); // menu 定義
						$(label).addClass('measure_label');
						$(label).text("0μm");
						document.body.appendChild(label);
						viewer.addOverlay(label, viewportPoint, 'BOTTOM');
						measureManager.measureLabel = label;

					}
					
				}else if(isPin)
				{
					
					var id = new Date(); //
					id = id.getTime(); // pin and pin-menu's id
					
					//alert(id);

					var viewportPoint = viewer.viewport.pointFromPixel(e.position);
									//	pinManager.drawPin(viewportPoint,id);

					var pin = new Image(); // pin 定義
					
					//pin.src = './images/ui_annotation.svg';
					pin.src = './images/pin_mark.svg';
					
					$(pin).addClass('pin ' + id);
					$(pin).addClass('pin_mark');
					$(pin).attr('data-id',String(id));
					
					$(pin).draggable({
						
						revert:false,
						
						start:function(e)
						{	
							//test
							//e.stopPropagation();

							console.log("pin drragable start");		
										
							pinDown = true; // pinを押しました
							

							movedX = $(pin).offset().left - pin.width / 2; // ピンの座標
							movedY = $(pin).offset().top;

							console.log(e.pageX);							
							console.log(e.pageY);


							downX = e.pageX; // mousedown座標
							downY = e.pageY;
							startOffsetX = e.offsetX;
							startOffsetY = e.offsetY;
							
						
							//alert(downX);
							
							//isMove = false; // pinをドラッグしたかどうか: off
							targetPin = pin; // 押したpin
							targetMenu = menu; // 押したmenu
							$numberX = $(menu).find('.number-x'); // menuのx座標描くところ
							$numberY = $(menu).find('.number-y');
							pinWidth = pin.width; // pin の幅
							pinHeight = pin.height; // pin の高さ
							
							// Menuを隠す
							setTimeout(function() { // 少し待ってから
								if(isMenuShow) { // pin に mouseover してなければ
									isMenuShow = false; // menu is hide
									$(menu).removeClass('show'); // menu を 隠す
								}
							
							}, 60);
							
						},
						stop:function(e)
						{	
							//test
							//e.stopPropagation();

							console.log("drragable stop");		
										
							// ピンをドラッグしているとき
							// pinned position
							var x = e.pageX -40.0; // mousedown座標
							var y = e.pageY;
							
							// ドラッグ時に、ピン画像を触っている場所のoffset分をずらす。
							x = x + pinWidth/2.0 - startOffsetX;
							y = y + pinHeight - startOffsetY;

							var webPoint = new OpenSeadragon.Point(Number(x),Number(y));
							
							//console.log(webPoint);
							webPoint.x = x;
							webPoint.y = y;

							console.log(webPoint.x);							
							console.log(webPoint.y);

							viewer.setMouseNavEnabled(true);

							var viewportPoint = viewer.viewport.pointFromPixel(webPoint); // viewport point
							
							console.log(viewportPoint.x);							
							console.log(viewportPoint.y);

							viewer.updateOverlay(targetPin, viewportPoint); // pin の位置を更新
							viewer.updateOverlay(targetMenu, viewportPoint); // menu の位置を更新
							
							//$numberX = $(menu).find('.number-x'); // menuのx座標描くところ
							//$numberY = $(menu).find('.number-y');

							var realPosX = viewportPoint.x * (viewer.source.width * perPixelWeight);
							var realPosY = (viewer.source.height/viewer.source.width - viewportPoint.y) * (viewer.source.width * perPixelWeight);

							$numberX.text(Math.round(realPosX * 100) / 100); // menu の pinのx位置 を更新
							$numberY.text(Math.round(realPosY * 100) / 100); // menu の pinのy位置 を更新
							
							// cookie更新
							pinManager.updatePin(targetPin,viewportPoint.x,viewportPoint.y,$(targetPin).attr("data-id"));
							
							targetPin = null;
							
							pinDown = false;
						

						}
						
						
					});
					//alert(String($(pin).height()));
					
					document.body.appendChild(pin); // append pin
					var webPoint = e.position; // pinned position
					
					//console.log(e);
					
					//startX = e.clientX;
					//startY = e.clientY;
					
					var viewportPoint = viewer.viewport.pointFromPixel(webPoint); // viewport point
					
					// viewportPoint を、cookieに、保存する。
					//alert(String(id)); 
					pinManager.addPin(pin,viewportPoint.x,viewportPoint.y,String(id));
					viewer.addOverlay(pin, viewportPoint, 'BOTTOM'); // place pin to viewer

					pinDown = false; // is mousedown on the pin
					
					var isMenu = false; // 
					var isPinOver = false; // is mouseover on the pin
					var isMenuShow = false; // is show the menu
					
					var menu = document.createElement('div'); // menu 定義
					var input =  '<input type="text" class="annotation_input_text"'+ ' id="al_' + String(id) +'" placeholder="label">';
					//var input =  '<input type="text" class="annotation_input_text"'+ ' id="test_input" placeholder="label">';
					
					var realPosX = viewportPoint.x * (viewer.source.width * perPixelWeight);
					var realPosY = (viewer.source.height/viewer.source.width - viewportPoint.y) * (viewer.source.width * perPixelWeight);

					$(menu).addClass('menu ' + id)
					.append(input) // pin の label
					.append('<div class="position-x">x:<span class="number-x">' + (Math.round(realPosX * 100) / 100) + "μm" + '</span></div>') // pin の x座標
					.append('<div class="position-y">y:<span class="number-y">' + (Math.round(realPosY * 100) / 100) + "μm" +  '</span></div>'); // pin の y座標
					
					var inputID = "#al_" + String(id);
					$(document).on('change',inputID,function()
					{
						pinManager.updateLabel(String(id));
					});

					

					//$("#test_input").change();

					var $removeBtn = $('<div class="btn_box annotation_menu_btn"><img src="images/ui_pin_trash.svg" class="ui_btn"><div>remove</div></div>');
					
					$removeBtn.on({'click':function()
					{
							pinManager.removePin(id);
							
							viewer.removeOverlay(pin);
							viewer.removeOverlay(menu);
							$(menu).remove();
							$(pin).remove();

							pinManager.removeAnnotations();
							setTimeout(function() { // 少し待ってから
							if(!isPinOver) { // pin に mouseover してなければ
								isMenuShow = false; // menu is hide
								$(menu).removeClass('show'); // menu を 隠す
								}
							}, 300);	
						}
					});
			
					$(menu).append($removeBtn);



					
					viewer.addOverlay(menu, viewportPoint, 'BOTTOM'); // menu を viewer に配置
					
					$(pin).add($(menu)).on({ // pin & menu のイベント
						'mouseover.pinMenu': function(e) { // mouseover イベント
							console.log("pin mouseover.pinMenu");
							//alert("test");
							//pinDown = true;
							// viewer.innerTracker.scrollHandler=false;
							//画面へのマウス操作を禁止
							viewer.setMouseNavEnabled(false);

							isPinOver = true; // ピンにマウスオーバー
							if(!pinDown && !isMenuShow)
							{
								if(measureManager.isEnable && !measureManager.isMeasureMoving)
								{
									//alert(pinID);
									pinManager.showAnnotations(id);
								}

								setTimeout(function() {
									if(isPinOver && !measureManager.isEnable) {
										isMenuShow = true;
										$(menu).addClass('show');									
									}
								}, 300);
							}
						},
						'mouseleave.pinMenu': function() { // pin からの mouseover が外れた時のイベント
							console.log("pin mouseleave.pinMenu");
							isPinOver = false; // is mouseover on the pin

							if(!pinDown)
							{ // pin を press してなければ
								viewer.setMouseNavEnabled(true);
								pinManager.removeAnnotations();

								setTimeout(function()
								{ // 少し待ってから
									if(!isPinOver)
									{ // pin に mouseover してなければ
										isMenuShow = false; // menu is hide
										$(menu).removeClass('show'); // menu を 隠す									
									}
								}, 300);
							}
						},
						'mousedown.pinMenu': function(e) { // pin, menu の上でclickした時にviewerが反応(拡大)しないようにする
							console.log("pin mousedown.pinMenu");
							e.stopPropagation();
						}
					});
					
						$(pin).on({
							'mousedown.pin': function(e)
							{
								console.log("pin mousedown.pin");

								if(isPin && !pinDown)
								{ // pinボタンがon
								
								}
							}
						});

					}
				});	
			
			$(window).on({
				'mousedown.pin': function(e)
					{
						//console.log("window mousedown.pin");
						e.preventDefault(); 
					},

				'mousemove': function(e) { // window 上で mousemove
					//e.preventDefault(); 
					//console.log("window mousemove");
					
					// pin をドラッグした時に viewer が反応(scroll)しないようにする
					/*
					if(pinDown) { // pin を押していれば
						//isMove = true; // pin を 動かします
						isPinMove = true;
						var moveX = movedX + e.pageX - downX, // 動く座標 ( 元の座標 + (今の座標 - 押した座標) ) 
							moveY = movedY + e.pageY - downY,
							webPoint = new OpenSeadragon.Point(moveX, moveY), // 動く座標を point 値に変換
							viewportPoint = viewer.viewport.pointFromPixel(webPoint); // point 値を viewer 基準のpoint に変換 (image の左側からimage の幅に対する相対位置 (image の右端で 1 左端で 0) ) 
						viewer.updateOverlay(targetPin, viewportPoint); // pin の位置を更新
						viewer.updateOverlay(targetMenu, viewportPoint); // menu の位置を更新
						$numberX.text(Math.round(viewportPoint.x * 1000) / 1000); // menu の pinのx位置 を更新
						$numberY.text(Math.round(viewportPoint.y * 1000) / 1000); // menu の pinのy位置 を更新
					}*/
				},				
				'mousemove.pin': function(e) { 

					// window 上で mousemove
					e.preventDefault(); // pin をドラッグした時に viewer が反応(scroll)しないようにする
					
					//console.log("window mousemove.pin");
					/*
					if(pinDown) { // pin を押していれば
						//isMove = true; // pin を 動かします
						isPinMove = true;
						var moveX = movedX + e.pageX - downX, // 動く座標 ( 元の座標 + (今の座標 - 押した座標) ) 
							moveY = movedY + e.pageY - downY,
							webPoint = new OpenSeadragon.Point(moveX, moveY), // 動く座標を point 値に変換
							viewportPoint = viewer.viewport.pointFromPixel(webPoint); // point 値を viewer 基準のpoint に変換 (image の左側からimage の幅に対する相対位置 (image の右端で 1 左端で 0) ) 
						viewer.updateOverlay(targetPin, viewportPoint); // pin の位置を更新
						viewer.updateOverlay(targetMenu, viewportPoint); // menu の位置を更新
						$numberX.text(Math.round(viewportPoint.x * 1000) / 1000); // menu の pinのx位置 を更新
						$numberY.text(Math.round(viewportPoint.y * 1000) / 1000); // menu の pinのy位置 を更新
					}*/
				},
				'mouseup.pin': function(e)
				{
					//window 上で mouseup
					//console.log("window mouseup.pin");

					e.preventDefault(); // pin をドラッグした時に viewer が反応(scroll)しないようにする
					
					/*
					if(pinDown) { // pin を押していれば
						
						var webPoint = e.position; // pinned position
						var viewportPoint = viewer.viewport.pointFromPixel(webPoint); // viewport p
						
						
						alert(viewportPoint.x);
						//isMove = true; // pin を 動かします
						
						viewer.updateOverlay(targetPin, viewportPoint); // pin の位置を更新
						viewer.updateOverlay(targetMenu, viewportPoint); // menu の位置を更新
						
						$numberX.text(Math.round(viewportPoint.x * 1000) / 1000); // menu の pinのx位置 を更新
						$numberY.text(Math.round(viewportPoint.y * 1000) / 1000); // menu の pinのy位置 を更新
						
						setTimeout(function() {
								if(!isMenuShow) {
									isMenuShow = true;
									$(menu).addClass('show');
								}
							}, 300);
						
					}
					
					isPinMove = false;
					pinDown = false; // pin を押しました:false*/
				}
			});
			
			// 拡大スライダー
			var isBarDown = false,
				movedX = 0,
				currentZoom = 0.0,
				moveX  = 0.0,
				areaWidth = $('#range-area').width(),
				$bar = $('#range-bar'),
				$leftArea = $('#range-left-area'),
				center = null;

			$bar.on('mousedown.range', function(e) { 
				isBarDown = true; // つまみを押しました
				downX = e.pageX; // mousedown座標(x)
				currentZoom = viewer.viewport.getZoom(); // 今の zoomLevel
				center = viewer.viewport.getCenter(); // viewer中心の画像に対する相対位置 ( 画像の左上が中心なら{ x: 0, y: 0}, 画像の右下がviewerの中心にあったら { x: 1, y: 1 * (画像高さ) / (画像幅) } )
			});
			
			$(window).on({
				'mousemove.range': function(e) { // window 上で mousemove

					//console.log("")
					//movedXの処理が怪しい
					if(isBarDown) { // つまみを押していれば
						moveX = movedX + e.pageX - downX; // つまみが動く
						moveX = moveX < 0 ? 0 : moveX > areaWidth ? areaWidth : moveX; // 0 から スライダの長さ の間
						$bar.css({ transform: 'translateX(' + moveX + 'px)' }); // つまみ動かす
						currentZoom = minZoom + moveX / areaWidth * (maxZoom - minZoom); // minZoom に 動いた距離を zoom の増分に換算したものを足す
						currentZoom = currentZoom < minZoom ? minZoom : currentZoom > maxZoom ? maxZoom : currentZoom; // minZoom から maxZoom の間に収める
						
						console.log(minZoom,maxZoom);
						console.log(Number(currentZoom), center);
						//NaN対策
						var checkZoom = parseInt(currentZoom);
						var checkX = parseInt(center.x);
						var checkY = parseInt(center.y);

						if (isNaN(checkZoom) || isNaN(checkX)  || isNaN(checkY) )
						{
							console.log("invalid values in scale slider");
							isBarDown = false; // つまみを押していない
							movedX = moveX; // 動いた距離 を更新

						}else{
							viewer.viewport.zoomTo(currentZoom, center, false); // 計算した zoom, center のところにズームする
						}
					}
				},
				'mouseup.range': function(e) { // window 上で mouseup
					isBarDown = false; // つまみを押していない
					movedX = moveX; // 動いた距離 を更新
				}
			});
			
			//zoom
			viewer.addHandler('zoom', function() { // ズームしたら軸を更新する
				Redraw();
			});
			
			// 軸の更新
			var Redraw = function()
			{
				console.log("redraw");
				
				if(isRedrawProcessing)
				{
					return;
				}
				
				isRedrawProcessing = true;

				console.log("redraw process"); 

				var realWidth = viewer.source.width  *  perPixelWeight, //  画像サイズを160 で割ると軸の単位がμmなので160pixel あたり1μmになる
					realHeight = viewer.source.height  * perPixelWeight; // 

				
				// viewer.source.width 元画像全体のサイズ
				// viewer.source.height 元画像全体のサイズ
				// realWidth 実寸の横幅
				// realHeight 実寸の縦幅

				var bounds = viewer.viewport.getBounds(); // viewer に表示されている領域の left(x), top(y), width, height (全て画像幅に対する割合)
				// bounds.width viewerに表示されている領域の横幅1.0に対する比率
				// bounds.height viewerに表示されている領域の横幅1.0に対する比率
			
				/*
				var imageBoundsCoordinates = { // imageBoundsCoordinates (割合にimageWidthをかけて表示されている画像の、画像基準のピクセル位置を計算)
					x: bounds.x * imageWidth,
					y: bounds.y * imageHeight
				};*/

				var realBoundsSize = { // 表示されている画像の幅を計算
					x: bounds.width * realWidth,
					y: bounds.height * realWidth
				};


				var viewportZoom = viewer.viewport.getZoom(); // map 幅 に対する zoom level
				
				var imageZoom = viewer.viewport.viewportToImageZoom(viewportZoom); // image の原寸に対するzoom Level
				
				var viewportMapPoint = viewer.viewport.pointFromPixel(new OpenSeadragon.Point(mapWidth, mapHeight)); // $('#map').width() を viewpoint になおした(使えない)
				
				var imageMapPoint = viewer.viewport.viewportToImageCoordinates(viewportMapPoint); // image 基準座標に直す
				
				var viewportMapWidth = viewportMapPoint.x * viewportZoom, // mapwidth を viewport point になおした物に viewort zoom をかけたもの
					viewportMapHeight = viewportMapPoint.y * viewportZoom; // 

				var imageWidth = viewer.source.width * imageZoom, // 画像幅にその時の原寸からのzoom level をかけたもの (viewer.source.width: jpeg画像の幅)
					imageHeight = viewer.source.height * imageZoom; 


				var imageMapWidth = imageWidth * viewportMapWidth, // imageWidth に viewport Map Width をかけたもの
					imageMapHeight = imageHeight * viewportMapHeight; // 
				
				if(!isBarDown) { // スライダによるズームでなければスライダを連動
					var center = viewer.viewport.getCenter(); // center の viewport point
					movedX = areaWidth * viewportZoom / (maxZoom - minZoom) -3.0; // つまみの動く長さ
					$bar.css({ transform: 'translateX(' + movedX + 'px)' }); // 動かす
				}
				
				//d3 axis 更新 (再描画)
				$('body > svg').remove(); // svg 削除
				var margin = {top: 0, right: 0, bottom: 0, left: 40}, // margin (d3)
						width = $('#map').width(), // map width
						height = $('#map').height(); // map height

				var visibleWidthPixel = bounds.width * viewer.source.width;
				var visibleHeightPixel = bounds.height * viewer.source.width;

				//alert(visibleWidthPixel);

				//alert(imageBoundsSize.x / perPixelWeight);	// 54		
				//alert(imageBoundsSize.y / perPixelWeight); //20

				var dataset = [
						{x: 0, y: 0}, // 0から
						{x: realBoundsSize.x, y: realBoundsSize.y} // 表示されている部分の実際の長さ
					];

				var xScale = d3.scale.linear() // d3
						.domain([dataset[0].x, dataset[1].x])
						.range([0, width]);
						


				var yScale = d3.scale.linear()
					.domain([dataset[0].y, dataset[1].y])
						.range([height, 0]);
						//.range([visibleHeightPixel, 0]);


				var xAxis = d3.svg.axis()
						.scale(xScale)
						.orient("bottom")
						.innerTickSize(-height)	// 目盛線の長さ（内側）
						.outerTickSize(0) // 目盛線の長さ（外側）
						.tickPadding(10); // 目盛線とテキストの間の長さ

				var yAxis = d3.svg.axis()
						.scale(yScale)
						.orient("left")
						.innerTickSize(-width)
						.outerTickSize(0)
						.tickPadding(10);

				var line = d3.svg.line()
						.x(function(d) { return xScale(d.x); })
						.y(function(d) { return yScale(d.y); });

				var axisSvg = d3.select("body").append("svg")
						.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom)
					.append("g")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			 		axisSvg.append("g")
			 		.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")") //x軸を下漬けに
					.call(xAxis);

					/*
						.append("text")
							.attr("x", width + 16)
							.attr("y", 0)
								.style("text-anchor", "end")
								.style("fill", "white")
								.style("font-size", "12px")
									.text("(μm)");*/
				
					axisSvg.append("g")
						.attr("class", "y axis")
						.call(yAxis)
						.append("text")
							.attr("x", 0-30)
							.attr("y", height+15) 
								.style("text-anchor", "start")
								.style("fill", "white")
								.style("font-size", "10px")
									.text("(μm)");	
									
						
				isRedrawProcessing = false;	
			
									
			}; // Redraw ここまで

//index.html?zoom=6.0&x=0.1&y=0.2
			// URL変数をもとにviewportの位置・尺度を変更
			setTimeout(function()
			{

				var viewerWidth = viewer.source.width,
					viewerHeight = viewer.source.height;

				var viewportRatio = {x:1.0 ,y: viewerHeight/viewerWidth }; // $('#map').width() を viewpoint になおした(使えない)
				var zoom = urlVars.zoom === undefined ? defaultZoomLevel : parseFloat(urlVars.zoom),
						center = {
							x: urlVars.x === undefined ? Number(viewportRatio.x/2.0) : parseFloat(urlVars.x),
							y: urlVars.y === undefined ? Number(viewportRatio.y/2.0) : parseFloat(urlVars.y)
						};

				//alert(center.x);
				//alert(center.y);
				//zoom = 0.5;
				viewer.viewport.zoomTo(zoom, center, true); // 計算した zoom, center のところにズームする
				viewer.viewport.panTo(center, false); // 計算した zoom, center のところにズームする
				
				var zoomCenter = viewer.viewport.getCenter(); 
				
				//alert(zoomCenter.x);
				//alert(zoomCenter.y);

				//alert(zoomLevel);
				
				/*
				
				var viewportZoom = viewer.viewport.getZoom(); // map 幅 に対する zoom level
				var minZoom = viewer.viewport.getMinZoom(), // equals to viewer's minZoomLevel
					maxZoom = viewer.viewport.getMaxZoom(); // equals to viewer's maxZoomLevel
					
				//alert(viewportZoom);	
				
				var	areaWidth = $('#range-area').width(),
				zoomCenter = viewer.viewport.getCenter(); // center の viewport point
				movedX = areaWidth * viewportZoom / (maxZoom - minZoom); // つまみの動く長さ
				var $rangeBar = $('#range-bar');
				
				alert(movedX);
				$rangeBar.css({ transform: 'translateX(' + movedX + 'px)' }); // 動かす
				
				*/
			
			}, 100);
			
			//初回の更新
			Redraw();
			
		},50);

		//ローカルデータ読み込み
		loadLocalData();
		//screenLock();
	});
	
	// 処理がやや重い
	viewer.addViewerInputHook({hooks: [
        {tracker: 'viewer', handler: 'moveHandler', hookHandler: onMove}
    ]});
    
    // Viewer上でのマウスムーブ
    function onMove(e)
    {    
	    console.log("onMove");  
	    // console.log(viewportPoint.x);  
		if(measureManager.isEnable && measureManager.markSource && measureManager.isMeasureMoving)
		{
			var webPoint = e.position; // pinned position
			var viewportPoint = viewer.viewport.pointFromPixel(webPoint); // viewport point					
			viewer.updateOverlay(measureManager.markDestination, viewportPoint); // pla	
			
			var gradient = (viewportPoint.y - measureManager.sy) / (viewportPoint.x - measureManager.sx);
			var dx = (viewportPoint.x - measureManager.sx) / 7.0;
			
			for(var i = 0; i < 6; i++)
			{
				var dot = measureManager.measureDots[i]; // pin 定義					
				//console.log(measureManager.sx + dx * (i+1));
				var pos = new OpenSeadragon.Point(measureManager.sx + dx * (i+1), measureManager.sy + gradient *  (dx * (i+1)) );
				viewer.updateOverlay(dot, pos);
			}
			
			var distanceValue = Math.sqrt(Math.pow((viewportPoint.y - measureManager.sy),2) + Math.pow((viewportPoint.x - measureManager.sx),2));
			var realWidth = viewer.source.width * perPixelWeight;
			distanceValue  = Number(distanceValue * realWidth).toFixed(3);

			var pos = new OpenSeadragon.Point(measureManager.sx + dx * (3.5), measureManager.sy + gradient *  (dx * (3.5)) );
			viewer.updateOverlay(measureManager.measureLabel, pos);
			$(measureManager.measureLabel).text(String(distanceValue) + "μm");
			
		}
    }
	
	$(window).on('contextmenu', function() { // 右クリックを反応しない
		return false;
	});
	
	$('#annotation_export').on('click',function()
	{
		//pinManager.exportJSON();
		exportJSONData();
	});
	
	/*
	$('#annotation_import').on('click',function()
	{
		$('file_import').click();
	});
	*/
	
	/*
	function toggleBtn()
	{
		this.$btn = $("#menu_header"); 	
		this.isActive = false;
	}
	
	toggleBtn.prototype.addEvents = function()
	{
		var self = this;
		this.$btn.on("click",function()
	    {
		        $(this).parent().parent().remove();
		
		});	
	};
	*/

	function scaleWhole()
	{	
		var mapWidth = $('#map').width();
		var rightWidth = $('#right').width();
		var scaleRatio = (mapWidth - rightWidth)/mapWidth;
		var scaleRatio = scaleRatio * defaultZoomLevel; //デフォルトに対する割合

		var wholePos = new OpenSeadragon.Point(0.5,0.5);
		viewer.viewport.zoomTo(scaleRatio, wholePos, true); // 計算した zoom, center のところにズームする
	
		// setTimeout(function(){
		// パンする
		scaleWholePan();
		// }, 30);

	}

	function scaleWholePan()
	{


		var viewerWidth = viewer.source.width,
			viewerHeight = viewer.source.height;
		var viewportZoom = viewer.viewport.getZoom(); 
		var posX = 1/(viewportZoom * 2.0);
		var dPos = new OpenSeadragon.Point( Number(posX),0.5 * (viewerHeight / viewerWidth) );
		viewer.viewport.panTo(dPos, false);
	}

	$('#home').on('click',function()
	{
		//screenLock();
		scaleWhole();
	});

	//Blobを保存
	function saveBlob(blob, name)
	{
		var url = window.URL || window.webkitURL,
		objectUrl = url.createObjectURL(blob),
		e = new Event('click'),
		el = document.createElement('a');
		el.href = objectUrl;
		el.download = name; 
		el.click(); //alert("test");
		el.dispatchEvent(e);
	}

	function exportJSONData()
	{
		var pinData = pinManager.pinsCookieData;
		var snapShots  = snapShotManager.snapList;
		var exportObj = {};
		exportObj["annotations"] = pinData;
		exportObj["snapshots"] = snapShots;

		var exportJson =  JSON.stringify(exportObj);
		setTextBlobUrl("download", exportJson);
		$("#download").click();
	}

	// テキストデータ保存
	function setTextBlobUrl(id, content)
	{
		// 指定されたデータを保持するBlobを作成する。
		//var blob = new Blob([ content ], { "type" : "application/x-msdownload" });
		// Aタグのhref属性にBlobオブジェクトを設定する。
		//window.URL = window.URL || window.webkitURL;
		//	$("#" + id).attr("href", window.URL.createObjectURL(blob));
		//	$("#" + id).attr("download", "tmp.rcemv");
		//'application/octet-stream'
		// Failed to load resource: Frame load interrupted
		//var blob = new Blob([content], {type: 'application/octet-stream'});

		var blob = new Blob([content], {type: "text/plain;charset=utf-8"});
		saveAs(blob, "data.rcemv");	
	}

	//テキストファイルの読み込み
	// annotations
	// snapshots
	$("#file_import").change(function(e)
	{
        var file = e.target.files[0];

        // FileReader.onloadイベントに
        // ファイル選択時に行いたい処理を書く
        var reader = new FileReader();
        reader.onload = function(e)
        {
           //alert(e.target.result);
		   var obj = $.parseJSON(e.target.result);

		   // 上書き
		   if(obj.annotations)
		   {
		   	   pinManager.pinsOverride(obj.annotations,false);
		   	   pinManager.draw();
		   }

		   if(obj.snapshots)
		   {
		   		snapShotManager.loadJSONData(obj.snapshots,false);
		   }
        };
        // Textとしてファイルを読み込む
        reader.readAsText(file);
    });

    $("#file_import_replace").change(function(e)
	{
        var file = e.target.files[0];
        // FileReader.onloadイベントに
        // ファイル選択時に行いたい処理を書く
        var reader = new FileReader();
        reader.onload = function(e)
        {
           //alert(e.target.result);
		   var obj = $.parseJSON(e.target.result);
		   //console.log(obj);

		   // 上書き
		   if(obj.annotations)
		   {
		   	   pinManager.pinsOverride(obj.annotations,true);
		   	   pinManager.draw();
		   }

		   if(obj.snapshots)
		   {
		   		snapShotManager.loadJSONData(obj.snapshots,true);
		   }

        };
        // Textとしてファイルを読み込む
        reader.readAsText(file);
    });
	
	sectionMetadata.inActive();
	sectionSnapshot.inActive();
	sectionAnnotation.inActive();
	sectionMeasure.inActive();
	sectionFile.inActive();

	// 動作確認!
	function exportImg()
	{
		var dataURL = viewer.drawer.canvas.toDataURL();
        //
        //var img = new Image();
        var cvs = document.getElementById('testImg');
        //var img = $(document.createElement('img'));
		var img = new Image(); 
		img.src = dataURL; 

		//alert(img.height);
        //img.attr('src', dataURL);
        //img.addClass("snapshot_img");
	    //var img = new Image();
		//img.src = "./images/measure_dot.png";
		
		var cvs = document.createElement("canvas");
		cvs.width = img.width;
		cvs.height = img.height;

		if(cvs.getContext)
		{
			var ctxt = cvs.getContext('2d');
			ctxt.drawImage(img,0,0);

			cvs.toBlob(function(blob) {
				saveAs(blob,"EMV-pic.png");
			},"image/png");
		}
	
	}
		
     
	/*
	var img = new Image();
	img.src = "./images/measure_dot.png";
	var cvs = document.getElementById('testImg');
	if(cvs.getContext)
	{
		var ctxt = cvs.getContext('2d');
		ctxt.drawImage(img,0,0,100,100);

		cvs.toBlob(function(blob) {
			saveAs(blob,"three.png");
		},"image/png");
	}*/
	
	//OpenSeadragon Navitorの中の枠上書き
	$("#navigator-inner-displayregion").css({"border":"1px solid rgb(255, 255, 255)","background-color":"rgba(61, 204, 211,0.32)"});
	
});



//$(document).ready(function()
//{
//
