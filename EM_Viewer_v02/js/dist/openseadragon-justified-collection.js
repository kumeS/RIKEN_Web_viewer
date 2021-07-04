(function ($) {
    'use strict';

    if (!$.version || $.version.major < 2) {
        throw new Error('This version of OpenSeadragonImagefilters requires OpenSeadragon version 2.0.0+');
    }

    $.World.prototype.arrange = function (options) {
        if (!this.justifiedCollectionInstance || options) {
            options = options || {};
            options.viewer = this;
            this.justifiedCollectionInstance = new $.justifiedCollection(options);
        }
        return this.justifiedCollectionInstance;
    };

    /**
     * @class justifiedCollection
     * @classdesc Provides functionality for arranging images in a justified grid layout
     * @param {Object} options
     */
    $.justifiedCollection = function (options) {
        $.extend(true, this, {
            columns: options.columns || 0,
            tileMargin: options.tileMargin || 80,
            tileSize: options.tileSize || 800,
            showLastRow: options.showLastRow || true
        }, options);

        var ImageRow = new $.Row(this);

        for (var i = 0; i < this.viewer._items.length; i++) {
            var item = this.viewer._items[i];

            //imagerow will set positions of items
            ImageRow.addTileSource(item);
        }

        //draw remaining
        if(this.showLastRow === true){
            ImageRow.draw();
        }

    };

    $.Row = function (world){
        $.extend(true, this, world);

        this.ready = false; //if true row is ready for drawing
        this.images = []; //temp array of images needed for row buffering
        this.height = 1; //changed based on ratio of row based on first row
        this.totalWidth = 0; //after first row we know the total width
        this.firstRow = true; //start with first row
        this.rowWidth = 0; //hold temp rowWidth of each row.
        this.line = 0; //y position of images to position

        //positions rows of images rescales row to make it fit first row
        this.draw = function() {
            var x = 0;
            this.images.map(function(image){
                image.setHeight(this.height,true);
                image.setPosition({x:x,y:this.line});
                var tileSourceBounds = image.getBounds();
                x = x+tileSourceBounds.width+((this.tileMargin/this.tileSize)*this.height);
            }, this);

            //increase x coordinate
            this.line += this.height+(this.tileMargin/this.tileSize);
            //reset values needed for row draw
            this.ready = false;
            this.images = [];
            this.rowWidth = 0;
        };

        //add tileSource to row
        this.addTileSource = function (tileSource) {
            if(this.isReady()){
                throw 'Can\'t add tilesource to ready row!';
            }

            //set height of tile to 1, image will change keeping right ratio, images are of equal height in each row
            tileSource.setHeight(1, true);

            var tileSourceBounds = tileSource.getBounds();
            this.images.push(tileSource);
            this.rowWidth = this.rowWidth+(tileSourceBounds.width)+(this.tileMargin/this.tileSize);

            //first row based on number of images, based on this the other rows will match it width
            if(this.firstRow === true && this.images.length === this.columns) {
                this.totalWidth = this.rowWidth;
                this.firstRow = false;
                this.ready = true;
                this.draw();
                return;
            }

            //otherwise draw the row if width ot total row is met
            if(this.firstRow === false && this.rowWidth >= this.totalWidth ){
                //resizePercentage
                this.height = parseFloat(this.totalWidth/this.rowWidth); //1200/1300 = 0.92;
                this.ready = true;
                this.draw();
            }
         };

        //is the row ready to be drawn
        this.isReady = function() {
            return this.ready;
        };
    };

})(OpenSeadragon);
//# sourceMappingURL=openseadragon-justified-collection.js.map
