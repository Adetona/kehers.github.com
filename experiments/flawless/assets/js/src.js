// Opeyemi Obembe (@kehers)

(function() {
    var canvas = this.__canvas = new fabric.Canvas('c');
    var added_photo = false;
    var black_stamped = true;
    var blackImgEl = document.getElementById('fl-b-o');
    var whiteImgEl = document.getElementById('fl-w-o');
    var stamp;
    var wdt = 640;

    function addStamp(imgElement, left, top) {
      if (!left) {
        // Get pos
        left = stamp.left;
        top = stamp.top;
        canvas.remove(stamp);
        stamp = null;
      }

      stamp = new fabric.Image(imgElement, {
          evented: true,
          selectable: true,
          hasControls: false,
          left: left,
          top: top,
          scaleX: 0.6,
          scaleY: 0.6,
          hasBorders: false
        });
      canvas.add(stamp);
    }

    function dataURLtoBlob(dataurl) {
      var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], {type:mime});
    }

    // Gradient
    fabric.Image.fromURL('assets/images/overlay.png', function(img) {
      img.evented = false;
      img.width = 640;
      img.height = 640;
      img.selectable = false;
      canvas.add(img);
      canvas.sendToBack(img);
    });

    // Border
    canvas.add(new fabric.Rect({
      id: 'frame',
      top: 0,
      left: 0,
      width: 638,
      height: 638,
      fill: 'transparent',
      stroke: 'white',
      strokeWidth: 2,
      selectable: false,
      evented: false
    }));

    // Upload image

    $('#file-input').change(function(e) {
        var file = e.target.files[0],
            imageType = /image.*/;

        if (!file.type.match(imageType))
            return;

        var reader = new FileReader();
        reader.onload = function (e) {

          var imgObj = new Image();
          imgObj.src = e.target.result;
          imgObj.onload = function () {
            // Remove added photo if exist
            if (added_photo) {
              canvas.item(1).remove();
            }

            added_photo = true;
            var image = new fabric.Image(imgObj);
            EXIF.getData(imgObj, function() {
              switch(EXIF.getTag(this, 'Orientation')){
                 case 8:
                   image.setAngle(-90);
                   break;
                 case 3:
                   image.setAngle(180);
                   break;
                 case 6:
                   image.setAngle(90);
                   break;
              }

              var scale = 1;
              if (image.width < image.height)
                scale = 640/image.width;
              else if (image.height < image.width ||
                 (image.height == image.width && image.width < 640))
                scale = 640/image.height;

              image.set({
                id: 'image',
                originX: "center",
                originY: "center",
                scaleX: scale,
                scaleY: scale,
                top: 320,
                left: 320,
                hasControls: false,
                selectable: false,
                evented: false
              });

              // Add black
              addStamp(blackImgEl, 10, 450);

              canvas.add(image);
              // index of 1
              canvas.sendToBack(image);
              canvas.bringForward(image);
              canvas.renderAll();

              // Show slider and download button
              //$('#scale-control').show();
              $('.create').hide();
              $('.canvas').show();
            });
          }
        }
        reader.readAsDataURL(file);
    });

    $('#fl-w').on('click', function(){
      if (!black_stamped) return false;

      $('img').removeClass('active');
      $(this).addClass('active');
      addStamp(whiteImgEl);
      black_stamped = false;
    });
    $('#fl-b').on('click', function(){
      if (black_stamped) return false;

      $('img').removeClass('active');
      $(this).addClass('active');
      addStamp(blackImgEl);
      black_stamped = true;
    });

    $('button.add').on('click', function(){
      $('#file-input').trigger('click');
    });
    $('#restart').on('click', function(){
      // Remove photo.
      if (added_photo) {
        canvas.item(1).remove();
        added_photo = false;
      }
      canvas.renderAll();
    });
    $('#download').on('click', function(){

      ga('send', 'event', 'Image', 'download');

      // Hide frame
      canvas.forEachObject(function(obj){
        if (obj.id && obj.id.indexOf('frame') > -1)
          obj.set({opacity: 0});
      });

      // Zoom in to download
      canvas.setWidth(1080);
      canvas.setHeight(1080);
      canvas.setZoom(1080/640);

      var ios = /iPad|iPhone|iPod/.test(navigator.platform);
      if (ios) {
        // Save as image and to another page
        $('#image').attr({
          src: canvas.toDataURL("image/png")
        });
        $('.image-wrp').show();
        $('.container, .btn-container').hide();
      }
      else {
        var blob = dataURLtoBlob(canvas.toDataURL("image/png"));

        $(this).attr({
          href: URL.createObjectURL(blob),
          download: 'flawless.png'
        });
      }

      // Revert zoom
      canvas.setWidth(640);
      canvas.setHeight(640);
      canvas.setZoom(1);
      resizeCanvas();

      // Show lines and frame
      canvas.forEachObject(function(obj){
        if (obj.id && obj.id.indexOf('frame') > -1)
          obj.set({opacity: 1});
      });

      canvas.renderAll();
    });

    // Set image boundaries
    var bounds = {top: 320, left: 320};
    canvas.on("object:moving", function(e){
        if (e.target.id && e.target.id.indexOf('image') > -1) {
          var obj = e.target;
          obj.setCoords();
          if (obj.getBoundingRect().top > 0 ||
              obj.getBoundingRect().top + obj.getBoundingRect().height < 640)
            obj.top = bounds.top;
          else
            bounds.top = obj.top
          if (obj.getBoundingRect().left > 0 ||
              obj.getBoundingRect().left  + obj.getBoundingRect().width < 640)
            obj.left = bounds.left;
          else
            bounds.left = obj.left;
        }
    });

    function resizeCanvas() {
      var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
      if (width < 960) {
        var scaleRatio = width/640;
        var dim = 640*scaleRatio;
        $('.canvas-wrp, .container').css({width: dim+'px', height: dim+'px', marginTop: '0'});
        $('.canvas-wrp, .logo-wrp').css({float: 'none'});
        $('.logo-wrp').css({marginTop: 0, textAlign: 'center', width: '100%'});
        $('.logo-wrp img').css({width: '45%'});
        //$('.add').css({top: '20px', right: '20px', marginLeft: '0'});
        canvas.setWidth(dim);
        canvas.setHeight(dim);
        canvas.setZoom(scaleRatio);
      }
    }
    // Responsive scaling
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, false);
})();