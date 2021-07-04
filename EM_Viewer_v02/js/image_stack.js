function openImage(viewer, index) {
	viewer.clearOverlays();
	viewer.goToPage(eval(index));
}

function openPoi(pois, image_file_num, poi_num, viewer) {
	if (image_file_num && poi_num) {
		var poi = pois[image_file_num][poi_num];
		//circle and rectangle x,y are in top-left
		if (viewer.currentPage()==image_file_num) {
			//same page, only move
			move_to_region(poi.x, poi.y, poi.width, poi.height, viewer, poi.zoom, poi.rotation);
		} else {
			//other page, open and move
			viewer.addOnceHandler('open', function temp_move_to_poi() {
				move_to_region(poi.x, poi.y, poi.width, poi.height, viewer, poi.zoom, poi.rotation);
			}, 'temp_move_to_poi');
			openImage(viewer, image_file_num);
		}
	}
}

function move_to_region(x, y, box_width, box_height, viewer, zoom, rotation) {
	if(!rotation) rotation = 0;
	var rad_rotation = (rotation-45) * Math.PI/180;
	var hyp = Math.sqrt(Math.pow(box_width,2) + Math.pow(box_height,2));
	var sign_x = local_sign(Math.cos(rad_rotation));
	var sign_y = local_sign(Math.sin(rad_rotation));
	if(sign_x == 0) sign_x = 1;
	if(sign_y == 0) sign_y = 1;
	
	if(sign_x>0 && sign_y>0) {
		var center_x = x + Math.round(hyp/2 * Math.abs(Math.cos(rad_rotation)));
		var center_y = y - Math.round(hyp/2 * Math.abs(Math.sin(rad_rotation)));
	} else if (sign_x<0 && sign_y>0) {
		var center_x = x - Math.round(hyp/2 * Math.abs(Math.cos(rad_rotation)));
		var center_y = y - Math.round(hyp/2 * Math.abs(Math.sin(rad_rotation)));
	} else if (sign_x>0 && sign_y<0) {
		var center_x = x + Math.round(hyp/2 * Math.abs(Math.cos(rad_rotation)));
		var center_y = y + Math.round(hyp/2 * Math.abs(Math.sin(rad_rotation)));
	} else if (sign_x<0 && sign_y<0) {
		var center_x = x - Math.round(hyp/2 * Math.abs(Math.cos(rad_rotation)));
		var center_y = y + Math.round(hyp/2 * Math.abs(Math.sin(rad_rotation)));
	}
	
	if (!zoom) {
		//zoom to fit box in viewport
		zoom = Math.min(20, viewer.viewport.imageToViewportZoom((viewer.viewport.containerSize.x-50)/box_width), viewer.viewport.imageToViewportZoom((viewer.viewport.containerSize.y-50)/box_height));
	} else {
		//zoom 50% more for selected images
		zoom = zoom * 1.5;
	}
	viewer.viewport.panTo(viewer.viewport.imageToViewportCoordinates(center_x, center_y), false);
	viewer.viewport.zoomTo(zoom, true);
	viewer.viewport.setRotation(rotation);
	viewer.viewport.applyConstraints();

}

function addRoi(index, roi, viewer) {
	//circle and rectangle x,y are in top-left
	var top_left_x = roi.x;
	var top_left_y = roi.y;

	var roi_wrapper = document.createElement("div");
	roi_wrapper.id = "roi-overlay-"+index;
	roi_wrapper.className = "roiwrapper";
	
	var roi_div = document.createElement("div");
	roi_div.className = "roi" + roi.shape + " fadein";
	roi_div.id = "roi_"+roi.mb_annotation_id;
	roi_div.title = roi.tooltip;
	roi_div.onclick = function() { move_to_region(top_left_x, top_left_y, roi.width, roi.height, viewer); }
	
	var roi_text = document.createElement("div");
	roi_text.className = "roitext fadein";
	roi_text.innerHTML = roi.name;
	roi_text.onmouseover = roi_div.onmouseover; 
	roi_text.onmouseout = roi_div.onmouseout; 
	roi_text.onclick = roi_div.onclick; 

	roi_wrapper.appendChild(roi_div);
	roi_wrapper.appendChild(roi_text);
	
	var roi_coord = viewer.viewport.imageToViewportRectangle(top_left_x, top_left_y, roi.width, roi.height);
	viewer.addOverlay(roi_wrapper, roi_coord, OpenSeadragon.OverlayPlacement.TOP_LEFT);
	roi_wrapper = null;
}

function addSelection(index, selection, viewer) {
	//rectangle x,y are in top-left
	var top_left_x = selection.x;
	var top_left_y = selection.y;
	
	var overlay = document.createElement("div");
	overlay.id = "overlay-"+index;
	
	var selection_wrapper = document.createElement("div");
	selection_wrapper.id = "selection-overlay-"+index;
	selection_wrapper.className = "selectionwrapper";
	$(selection_wrapper).css({
		"width": "100%",
		"height": "100%",
		"transform-origin": "top left",
		"transform": "rotate(-"+selection.rotation+"deg)"
	});
	
	var selection_div = document.createElement("div");
	selection_div.className = "selection" + selection.shape + " fadein";
	selection_div.title = selection.tooltip;
	selection_div.onclick = function() { move_to_region(top_left_x, top_left_y, selection.width, selection.height, viewer, selection.zoom, selection.rotation); }

	var selection_text = document.createElement("div");
	selection_text.className = "selectiontext fadein_selectiontext";
	selection_text.innerHTML = selection.tooltip;
	selection_text.onclick = selection_div.onclick;

	overlay.appendChild(selection_wrapper);
	selection_wrapper.appendChild(selection_div);
	selection_wrapper.appendChild(selection_text);

	var selection_coord = viewer.viewport.imageToViewportRectangle(top_left_x, top_left_y, selection.width, selection.height);
	viewer.addOverlay(overlay, selection_coord, OpenSeadragon.OverlayPlacement.TOP_LEFT);
	selection_wrapper = null;
	overlay = null;
}

function createViewer(object_id, dzis, rois, selections, pixelpermeter, current_image_num) {
	var filenames = [];
	$.each(dzis, function(image_file_num, dzi) {
		filenames.push(dzi.filename);
	});
	var viewer = OpenSeadragon({
			id: "stack_image_"+object_id,
			prefixUrl: "/utils/openseadragon/images/",
			sequenceMode: true,
			tileSources: filenames,
			initialPage: current_image_num,
			defaultZoomLevel: 0,
			preserveViewport: false,
			preserveOverlays: false,
			//maxZoomLevel: 20,
			minZoomLevel: 0,
			showHomeControl: false,
			showNavigator: true,
			navigatorSizeRatio: 0.17,
			navigatorMaintainSizeRatio: true,
			gestureSettingsMouse: { dblClickToZoom: true, clickToZoom: false },
			nextButton: "next_button",
			previousButton: "prev_button",
			debugMode: false
	});
	
	viewer.scalebar({
		type: OpenSeadragon.ScalebarType.MAP,
		location: OpenSeadragon.ScalebarLocation.BOTTOM_LEFT,
		minWidth: '50px',
		pixelsPerMeter: pixelpermeter,
		xOffset: 5,
		yOffset: 10,
		stayInsideImage: false,
		barThickness: 1,
		fontSize: '9px',
		color: "rgba(255, 255, 255, 0.8)",
		fontColor: "rgba(255, 255, 255, 0.8)"
	});

	viewer.addHandler('open', function () {
		$.each(selections[viewer.currentPage()], function(index, selection) {
			addSelection(index, selection, viewer);
		});
		if(rois[viewer.currentPage()]) {
			$.each(rois[viewer.currentPage()], function(index, roi) {
				addRoi(index, roi, viewer);
			});
		}

		var section_nav_div = $("#sectionnav_container_"+object_id);
		if (section_nav_div.css('visibility')!='visible') {
			viewer.addControl(section_nav_div[0], {anchor: OpenSeadragon.ControlAnchor.BOTTOM_RIGHT});
			$("#sectionnav_container_"+object_id+" .sectionnav_links").click(function () {
				openImage(viewer, $(this).attr("name"));
			});
			section_nav_div.css({'visibility':'visible'});
		}
		$("#sectionnav_container_"+object_id+" .sectionnav_links").removeClass('selected');
		$("#sectionnav_container_"+object_id+" .sectionnav_links[name="+viewer.currentPage()+"]").addClass('selected');
		$("#stack_image_"+object_id+" .selectiontext").addClass('hidden');
		
		$("div[title='Zoom in']").css({'cursor':'pointer'});
		$("div[title='Zoom out']").css({'cursor':'pointer'});
		$("div[title='Toggle full page']").css({'cursor':'pointer'});
	});

	viewer.addHandler('animation-finish', function() {
		$("#stack_image_"+object_id+" .selectiontext").each(function () {
			if ($(this).width()>130) {
				$(this).removeClass('hidden');
				$(this).removeClass('fadeout');
				$(this).addClass('fadein_selectiontext');
			} else {
				$(this).removeClass('fadein_selectiontext');
				$(this).addClass('hidden');
				$(this).addClass('fadeout');
			}
		});
	});
	viewer.addHandler('animation-start', function() {
		$("#stack_image_"+object_id+" .selectiontext").addClass('hidden');
	});
	viewer.addHandler('canvas-exit', function() {
		$("#stack_image_"+object_id+" .selectiontext").removeClass('fadeout');
		$("#stack_image_"+object_id+" .selectiontext").addClass('fadein_selectiontext');
	});
	viewer.addHandler('canvas-enter', function() {
		$("#stack_image_"+object_id+" .selectiontext").removeClass('fadein_selectiontext');
		$("#stack_image_"+object_id+" .selectiontext").addClass('fadeout');
	});
	
	viewer.addHandler('full-screen', function() {
		$('.ui-tooltip').remove();
	});
	
	return viewer;
}

function local_sign(number) {
	//IE does not support Math.sign
	if(number) {
		return number?number<0?-1:1:0;
	} else {
		return 0;
	}
}



