var Puz = function (id, config) {
    // always create a new var, even if the 'new' keyword is omitted
    if (!(this instanceof Puz)) {
        return this.apply((new Puz()), arguments);
    }
    this.board_w = 3;
    this.board_h = 3;
    this.tile_size = 90;
    this.tile_spacing = 3;
    this.slide_delay = 1;
/* in game vars */
    this.slide_event = 'onclick';
    this.board_el = undefined;
    this.board_wrapper_el = undefined;
    this.board = [];
    this.space = [0, 0];
    this.game_in_progress = false;
    this.board_active = false;
    this.start_time = 0;
    this.end_time = 0;
    this.moves = 0;
    this.last_tile_moved = 0;
    this.btn_start = '<a href="#start" onclick="demo_puzzle.start_game(); return false;">Start Game</a>';
    this.btn_reset = '<a href="#reset" onclick="demo_puzzle.init(); return false;">Reset</a>';
    this.board_wrapper_id = (id) ? id : "puz_" + new Date().getTime();
    if (config) {
        for (var setting in config) {
            this[setting] = config[setting];
        }
    }
    return this;
};

Puz.prototype = {
    
    init: function () {
        if (document.ontouchstart) this.slide_event = "ontouchstart";
        this.board_wrapper_el = this.get_board_wrapper();
        this.generate_dom_ids();
        this.build_game_base();
        this.generate_styles();
        this.reset_game();
        this.build_board_map();
        this.build_board();
        this.add_tileslide_event();
        this.transition_dist = this.tile_size + this.tile_spacing;
    },

    get_board_wrapper: function() {
        var id_val = this.board_wrapper_id;
        var el = document.getElementById(id_val);
        // if this is null, attach a div with the ID
        if (!el) {
            el = document.createElement('div');
            el.setAttribute("id", id_val);
            var body = document.getElementsByTagName('body')[0];
            body.appendChild(el);
        }
        return el;
    },

    build_game_base: function () {
        //the base markup surrounding the puzzle
        this.board_wrapper_el.innerHTML ='\
            <p class="button" id="' + this.id_btn + '"></p><p id="' + this.id_puzzle + '"></p>';
    },

    generate_dom_ids: function () {
        //Find the DOM element IDs
        var b = this.board_wrapper_id;
        this.id_btn    = b + "_btn";
        this.id_time   = b + "_time";
        this.id_moves  = b + "_moves";
        this.id_puzzle = b + "_puzzle";
        this.id_tile   = b + "_tile";
    },

    generate_styles: function () {
        /*
        writes styles into the host document
        */
        var selectors = {
                selector1 : '#' + this.id_puzzle,
                selector2 : '#' + this.id_puzzle + ' a',
                selector3 : '#' + this.id_puzzle + ' a span'
            },
            styles = {
                selector1 : {
                    'position': 'relative',
                    'width': (this.board_w * this.tile_size) + (this.tile_spacing * (this.board_w - 1)) + "px",
                    'height': (this.board_h * this.tile_size) + (this.tile_spacing * (this.board_h - 1)) + "px"
                },
                selector2 : {
                    'position': 'absolute',
                    'display': 'block',
                    'width': this.tile_size + 'px',
                    'height': this.tile_size + 'px',
                    //'background-image': 'url(' + this.image + ')',
                    'background':'#ccc',
                    'background-repeat': 'no-repeat',
                    'background-size': this.image_size,
                    'text-decoration': 'none',
                },
                selector3 : {
                    'display': 'block',
                    'text-align':'center',
                    'font-weight':'bold'


                }
            },
            css = "",
            style,
            def,
            styleDefs,
            styleTag = document.createElement('style');
        for (style in styles) {
            css += "\n" + selectors[style] + " {";
            for (def in styles[style]) {
                if (styles[style][def]) {
                    css += "\n\t" + def + ":" + styles[style][def] + ";"
                }
            }
            css += "\n}";
        }
        styleDefs = document.createTextNode(css);
        styleTag.appendChild(styleDefs);
        this.board_wrapper_el.appendChild(styleTag);
    },

    reset_game: function () {
        this.board_active = false;
        this.game_in_progress = false;
        this.last_tile_moved = 0;
       // document.getElementById(this.id_moves).innerHTML = '0';
        //document.getElementById(this.id_time).innerHTML = '0';
        document.getElementById(this.id_btn).innerHTML = this.btn_start;
    },

    start_game:function () {
        this.reset_game();
        document.getElementById(this.id_btn).innerHTML = "&nbsp;"
        this.mix_board(this.go);
    },

    go: function (that) {
        /*
        function that is fired by the callback once the board has been mixed
        */
        document.getElementById(that.id_btn).innerHTML = that.btn_reset;
        that.start_time = new Date();
        that.game_in_progress = true;
        that.board_active = true;
    },

    build_board: function () {
        //adds tiles to the board
        var tiles = (this.board_w * this.board_h) - 1,
            h = '',
            top = 0,
            left = 0,
            pos = "";
            this.board_el = document.getElementById(this.id_puzzle);
        for (var i = 1; i <= tiles; i++) {
            top = Math.floor(i/(this.board_w+.1));
            left = ((i - 1) % this.board_w);
            var top_pos  = top * this.tile_size +  (this.tile_spacing * top),
                left_pos = left * this.tile_size + (this.tile_spacing * left)
            h += '<a href="#shift" id="' + this.id_tile + i + '" \
                    style="top:'+ top_pos +'px;\
                    left:'+left_pos+'px;\
                    background-position: -'+left_pos+'px -'+top_pos+'px"><span style="color:black">'+i+'</span></a>';
        }
        this.board_el.innerHTML = h;
        // fix the size of the board, in case 'hiding' the button alters that
        var w = this.board_wrapper_el.offsetWidth;
        this.board_wrapper_el.style.width = w + 'px';
    },
    
    add_tileslide_event: function () {
        that = this;
        this.board_wrapper_el.addEventListener('click', function (e){
            return that.slide_click(e.target);
        })
    },
    
    build_board_map: function () {
        /*
        builds a programmatical map of the board
        */
        this.board = [];
        for (var i=0;i<this.board_h;i++) {
            var arr = [];
            for (var q=1;q<=this.board_w;q++) {
                arr.push(q + (this.board_w*i))
            }
            this.board.push(arr);
        }
        // make the 'space' in the bottom right tile
        this.board[this.board_h-1][this.board_w-1] = 0;
        this.space = [this.board_h - 1, this.board_w - 1];        
    },

    mix_board: function (callback) {
        /*
            moves tiles randomly until the board is mixed
        */
        var that = this,
            moves = 0,
            moves_to_mix = (this.board_w * this.board_h * 3),
            total_time = moves_to_mix * this.slide_delay,
            slide_delay = this.slide_delay,
            stored_slide_delay = slide_delay,
            rnd,
            tiles,
            tile_num;
            slide_tile = function () {
                tiles = that.movable_tiles();
                do {
                    rnd = parseInt(tiles.length * Math.random());
                    tile_num = tiles.splice(rnd, 1);
                } while (tile_num == that.last_tile_moved);
                var to = that.slide_invoke(document.getElementById(that.id_tile + tile_num));
            }

        while (moves < moves_to_mix) {
            var delay = (slide_delay * moves);
            setTimeout(slide_tile, delay);
            moves++;
        }
        cback = setTimeout(function() {
                that.slide_delay = stored_slide_delay;
                callback(that);
            }, delay + 1000);
    },

    movable_tiles: function (dir) {
        
        //returns a list of which tiles can be moved
        var tiles = [],
            x = this.space[0],
            y = this.space[1];
            // tile to the left of the space
            if (x > 0) tiles.push(this.board[y][x - 1]);
            // tile to the right
            if (x < this.board_w-1) tiles.push(this.board[y][x + 1]);
            // tile above
            if (y > 0) tiles.push(this.board[y - 1][x]);
            // tile below
            if (y < this.board_h-1) tiles.push(this.board[y + 1][x]);
            return tiles;
    },

    slide_click: function (el) {
        /*
        function that is attached to the UI event of a tile
        ensures tiles can only be manually moved when the game allows it
        */
        if (this.board_active) {
            this.slide_invoke(el);
        }
        return false;
    },
    
    find_tile: function (id) {
        /*
        function that searchs the board map and returns x and y coordinates
        */
        var x, y, row, col;
        for (row in this.board) {
            y = row;
            for (col in this.board[row]) {
                if (this.board[row][col] === id) {
                    return [col, y];
                }
            }
        }
    },
    
    slide_invoke:function (el) {
        /*
        checks whether any given slide can be moved, then instigates the move
        */
        var curr = el.id;
        var curr_num = parseInt(curr.replace(this.id_tile,''));
        // compare the slide pos to the space pos.
        // which way can we slide? up, down, left or right?
        var coods =  this.find_tile(curr_num);
        var x_diff = this.space[0] - coods[0],
            y_diff = this.space[1] - coods[1];
        // one axis value has to be the same and the other within 1
        if (((Math.abs(x_diff) == 1) && (y_diff == 0)) || ((Math.abs(y_diff) == 1) && (x_diff == 0))) {
            this.slide_start(el, x_diff, y_diff);
            return true;
        }
        return false;
    },

    slide_start: function (el, x_dir, y_dir) {
        /*
        disables the board for further clicks
        moves the tile, with a transition if possible
        */
        var that = this;
        this.board_active = false;
        this.last_tile_moved = el;
        var x_st = parseInt(el.style.left),
            y_st = parseInt(el.style.top);
        if (this.transition) {
            var transitionEnd = function () {
                // cancel the transition stuff & then call Puz.slide()
                el = that.last_tile_moved;
                el.style[that.transition.property + 'Duration'] = "0";
                el.style[that.transition.transform] = "translate3d(0, 0, 0)";
                that.slide(el, x_st, y_st, x_dir, y_dir);
            }
            var delay = Math.floor(that.slide_delay * .75);
            if (that.cleanUp) clearTimeout(that.cleanUp);
            that.cleanUp = setTimeout(transitionEnd, delay + 10)
            el.style[that.transition.property + 'Duration'] =  delay + "ms";
            el.style[that.transition.transform] = "translate3d(" + (x_dir * that.transition_dist) + "px, " + (y_dir * that.transition_dist) + "px, 0)";
        }
        else {
            that.slide(el, x_st, y_st, x_dir, y_dir);
        }
    },
    
    slide: function (el, x_st, y_st, x_dir, y_dir) {
        /*
        moves a tile element in the specified direction from a specified starting point
        */
        el.style.left = x_st + (x_dir *  this.transition_dist) + "px";
        el.style.top =  y_st  + (y_dir * this.transition_dist) + "px";
        this.slide_finish(el, x_dir, y_dir);
    },

    slide_finish: function (el, x_dir, y_dir) {
        /*
        once the UI has been animated, update the stored game state variables
        check to see if the puzzle has been completed
        */
        // update board_game
        var tile_num = parseInt(el.id.replace(this.id_tile, ''));
        this.board[this.space[1]][this.space[0]] = tile_num;
        this.last_tile_moved = tile_num;
        // change the stored 'space' co-ods
        this.space = [this.space[0] - x_dir, this.space[1] - y_dir];
        this.board[this.space[1]][this.space[0]] = 0;
        if (this.game_in_progress) {
          //  this.moves++;
            //document.getElementById(this.id_moves).innerHTML = this.moves;
            if (!this.check_game_complete()) this.board_active = true;
            else this.game_complete();
        }
    },
    
    check_game_complete: function () {
        /*
        check the board map to see if the puzzle has been solved
        */
        var counter = 1
        for (var row in this.board) {
            for (var col in this.board[row]) {
                if ((this.board[row][col] != counter) && (counter < this.board_w * this.board_h)) return false;
                counter++;
            }
        }
        return true;
    },
    game_complete: function () {
        alert("You did it!");
         document.getElementById(this.id_btn).innerHTML = this.btn_start;
        this.game_in_progress = false;
        this.board_active = false;
    }
};