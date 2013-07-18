var mouseEdgeSize = 50;
var mouseEdgeSpeed = 1;
var scrollingVert = 0;
var scrollingHoriz = 0;

function onDocumentMouseMove(e) {
	if (e.clientX < mouseEdgeSize || e.clientX > window.innerWidth-mouseEdgeSize || e.clientY < mouseEdgeSize || e.clientY > window.innerHeight-mouseEdgeSize) {
		if(e.clientX < mouseEdgeSize)
			scrollingHoriz = 1;
		else if(e.clientX > window.innerWidth-mouseEdgeSize)
			scrollingHoriz = 2;
		else
			scrollingHoriz = 0;
		if(e.clientY < mouseEdgeSize)
			scrollingVert = 1;
		else if (e.clientY > window.innerHeight-mouseEdgeSize)
			scrollingVert = 2;
		else
			scrollingVert = 0;
		//console.log('Mouse at edge!');
	} else {
		scrollingHoriz = 0;
		scrollingVert = 0;
	}
}
document.addEventListener( 'mousemove', onDocumentMouseMove, false );