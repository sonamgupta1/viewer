/**
 * Created by sachin on 20/4/15.
 */
// The Class Functionality

(function ($) {

    $.fn.viewer = function (options) {

        // These are the defaults.
        var defaults = {
            anchors: [],
            s3_urls: [],
            max_dimension: {},
            layers: {},
            zoom_interval: 300,
            zoom_action_is_on: false,
            zoom_factor: 5,
            initial_position: 'center',
            layers_available: {},
            container: null,
            hard_layer: null,
            soft_layer: null,
            metadata_div: null,
            zoom_in_link: null,
            zoom_out_link: null,
            full_screen_link: null,
            navigation_section: null,
            actual_view: null
        };

        var settings = $.extend({}, defaults, options);

        var makeHardBoundary = function () {
            ele = $("<div class='hard_layer layer_h_1' />");
            ele.width(settings.max_dimension.width);
            ele.height(settings.max_dimension.height);
            settings.container.append(ele);
            settings.hard_layer = ele;
        }

        var makeSoftBoundary = function () {
            ele = $("<div class='soft_layer layer_s_1' />");
            ele.width('100%');
            ele.height('100%');
            ele.html("<div class='anchor_popup'><h5 class='anchor_box_title'>Jump to this sheet</h5><div class='anchor_box_link'></div><div class='anchor_box_image'><img src='#'/></div></div>")
            settings.hard_layer.append(ele);
            settings.soft_layer = ele
        }

        var createBricks = function (layer, layer_value) {
            var _layer = $("<div />");
            _layer.width('100%');
            _layer.height('100%');
            _layer.hide();
            settings.soft_layer.append(_layer);
            settings.layers_available[parseInt(layer)] = _layer;

            var brick_counter = -1;
            _brick_width = (256 * 100) / layer_value.width
            _brick_height = (256 * 100) / layer_value.height
            for (var row_index = 0; row_index < layer_value.brick_row; row_index++) {
                for (var col_index = 0; col_index < layer_value.brick_col; col_index++) {
                    var brick = $("<div title='" + layer + "|" + row_index + "x" + col_index + "' class='brick' id='brick_" + "1" + "_" + row_index + "_" + col_index + "' title='" + brick_counter++ + "'></div>")


                    if (row_index + 1 == layer_value.brick_row) {
                        brick.height(100 - (_brick_height * (layer_value.brick_row - 1)) + "%");
                    } else {
                        brick.height(_brick_height + "%");
                    }
                    if (col_index + 1 == layer_value.brick_col) {
                        brick.width(100 - (_brick_width * (layer_value.brick_col - 1)) + "%");
                    } else {
                        brick.width(_brick_width + "%");
                    }
                    brick.append("<img src='" + settings.s3_urls[layer][col_index + '_' + row_index] + "' />");
                    _layer.append(brick);
                }
            }
        }
        var relative_percentage_x_axis = function(val) {
            return (val * 100 / settings.max_dimension.width)
        }
        var relative_percentage_y_axis = function(val) {
            return (val * 100 / settings.max_dimension.height)
        }

        var insert_anchors = function () {
            $.each(settings.anchors, function (index) {
                var _style = "position:absolute;background-color:red;";
                _style += "left:" + relative_percentage_x_axis(this.left) + "%;"
                _style += "bottom:" + relative_percentage_y_axis(this.bottom) + "%;"
                _style += "height:" + relative_percentage_y_axis(this.height) + "%;"
                _style += "width:" + relative_percentage_x_axis(this.width) + "%;"
                if (this.target == '_blank') {
                    var _anchor = $("<a style='" + _style + "' target='" + this.target + "' href='" + this.href + "' id='" + index + "'></a>")
                }
                else {
                    var _anchor = $("<a style='" + _style + "' target='" + this.target + "' class='inline_link' data-token='" + this.thumbnail_token + "' href='javascript:void(0)' id='" + index + "'></a>")
                }
                settings.soft_layer.append(_anchor);
            })
        }

        var position_anchor_popup = function(element) {
            _style = element.attr('style');
            _left_position = parseFloat(_style.match(/.*left:(\d*.\d*)/)[1]) - ((((settings.soft_layer.find('.anchor_popup').width() - element.width()) / 2) * parseFloat(_style.match(/.*width:(\d*.\d*)/)[1])) / element.innerWidth())
            _bottom_position = parseFloat(_style.match(/.*bottom:(\d*.\d*)/)[1]) + parseFloat(_style.match(/.*height:(\d*.\d*)/)[1]) + (10 * parseFloat(_style.match(/.*height:(\d*.\d*)/)[1]) / element.height())
            settings.soft_layer.find('div.anchor_popup').attr('style', 'left:' + _left_position + '%;bottom:' + _bottom_position + '%;')
        }

        var reposition_anchor_popup = function() {
            if (settings.soft_layer.find('div.anchor_popup').css('visibility') == 'visible') {
                position_anchor_popup(settings.soft_layer.find('a#'+ settings.soft_layer.find('div.anchor_popup').data('anchor_id')));
                settings.soft_layer.find('div.anchor_popup').css('visibility', 'visible')
            }
        }
        var showLayer = function () {
            _layer = layer2show();
            $.each(settings.layers_available, function (k, v) {
                if (v == _layer) {
                    v.show()
                } else {
                    v.hide()
                }
            })
        }

        var layer2show = function () {
            _keys = []
            $.each(settings.layers_available, function (k, v) {
                _keys.push(k)
            })
            _keys = _keys.sort(function (a, b) {
                return (a - b)
            });
            for (var _i = 0; _i < _keys.length; _i++) {
                if (settings.zoom_current_percentage <= _keys[_i]) {
                    return settings.layers_available[_keys[_i]]
                }
            }
        }

        var zoomin = function () {
            if (settings.zoom_action_is_on || settings.zoom_current_percentage >= 100) {
                return false;
            }
            settings.zoom_action_is_on = true;
            settings.zoom_current_percentage += settings.zoom_factor;
            if (settings.zoom_current_percentage > 100) {
                settings.zoom_current_percentage = 100
            }
            console.log(settings.focal_point_zoom_ratio)
            var _left = settings.soft_layer.position().left + (settings.soft_layer.width() * settings.focal_point_zoom_ratio.x) - ( settings.max_dimension.width * (settings.zoom_current_percentage / 100) * settings.focal_point_zoom_ratio.x);
            var _top = settings.soft_layer.position().top + (settings.soft_layer.height() * settings.focal_point_zoom_ratio.y) - ( settings.max_dimension.height * (settings.zoom_current_percentage / 100) * settings.focal_point_zoom_ratio.y);

            showLayer();
            settings.soft_layer.animate({
                left: _left,
                top: _top,
                width: (settings.zoom_current_percentage + '%'),
                height: (settings.zoom_current_percentage + '%')
            }, settings.zoom_interval, function () {
                if (settings.metadata_div != null) {
                    settings.metadata_div.text(settings.zoom_current_percentage + '%');
                }
                settings.zoom_action_is_on = false;
            });
        }

        var zoomout = function () {
            if (settings.zoom_action_is_on || settings.zoom_current_percentage <= settings.min_zoom_percentage) {
                return false;
            }
            settings.zoom_action_is_on = true;
            // console.log("zoom out started");

            settings.zoom_current_percentage -= settings.zoom_factor;
            if (settings.zoom_current_percentage < settings.min_zoom_percentage) {
                settings.zoom_current_percentage = settings.min_zoom_percentage
            }
            var _left = settings.soft_layer.position().left + (settings.soft_layer.width() * settings.focal_point_zoom_ratio.x) - ( settings.max_dimension.width * (settings.zoom_current_percentage / 100) * settings.focal_point_zoom_ratio.x);
            var _top = settings.soft_layer.position().top + (settings.soft_layer.height() * settings.focal_point_zoom_ratio.y) - ( settings.max_dimension.height * (settings.zoom_current_percentage / 100) * settings.focal_point_zoom_ratio.y);

            showLayer();

            settings.soft_layer.animate({
                left: _left,
                top: _top,
                width: (settings.zoom_current_percentage + '%'),
                height: (settings.zoom_current_percentage + '%')
            }, settings.zoom_interval, function () {
                if (settings.metadata_div != null) {
                    settings.metadata_div.text(settings.zoom_current_percentage + '%');
                }

                settings.zoom_action_is_on = false;
            });
        }

        var trigger_zoomout = function () {
            zoomout()
            settings.zoom_out_timer = window.setTimeout(function () {
                trigger_zoomout();
            }, 50);
        }

        var trigger_zoomin = function () {
            zoomin()
            settings.zoom_in_timer = window.setTimeout(function () {
                trigger_zoomin();
            }, 50);
        }
        return this.each(function () {
            settings.container = $(this)
            settings.focal_point_zoom_ratio = {'x': 50 / 100, 'y': 50 / 100},
            makeHardBoundary();
            makeSoftBoundary();
            $.each(settings.layers, function (k, v) {
                createBricks(k, v);
            });
            settings.soft_layer.draggable().on('mousemove', function (event) {
                var delta_x = (event.pageX - (settings.container.position().left + $(this).position().left));
                var delta_y = (event.pageY - (settings.container.position().top + $(this).position().top));
                settings.focal_point_zoom_ratio = {
                    'x': (delta_x / $(this).width()),
                    'y': (delta_y / $(this).height())
                };
                //console.log(focal_point_zoom_ratio);
            });

            insert_anchors();
            settings.soft_layer.find('a.inline_link').click(function(){
                position_anchor_popup($(this))
                _default_margin = 10
                pop_up_top = settings.soft_layer.find('div.anchor_popup').offset().top
                if ((pop_up_top + _default_margin) < 0) {
                    settings.soft_layer.css('top', settings.soft_layer.offset().top - (pop_up_top))
                }
                settings.soft_layer.find('div.anchor_popup').data('anchor_id', $(this).attr('id')).css('visibility', 'visible');

                $.ajax(settings.thumbnail_url.replace('SHEET_TOKEN',  $(this).data('token')));
            })
            settings.zoom_current_percentage = parseInt(Math.min((settings.container.height() / settings.layers['100'].height), (settings.container.width() / settings.layers['100'].width), 100) * 100)
            settings.min_zoom_percentage = settings.zoom_current_percentage
            settings.soft_layer.width(settings.zoom_current_percentage + "%");
            settings.soft_layer.height(settings.zoom_current_percentage + "%");
            if (settings.initial_position == 'center'){
                settings.soft_layer.css('left', (settings.container.width() - settings.soft_layer.width()) / 2);
            }

            showLayer();

            $(settings.container).mousewheel(function (event, delta, deltaX, deltaY) {
                if (delta == 1) {
                    zoomin();
                } else if (delta == -1) {
                    zoomout();
                }
            });
            if (settings.zoom_in_link != null) {
                settings.zoom_in_link.mousedown(function (e) {
                    //e.stopPropagation();
                    settings.focal_point_zoom_ratio = {x: 0.5, y: 0.5}
                    trigger_zoomin();
                }).mouseup(function () {
                    window.clearTimeout(settings.zoom_in_timer);
                });
            }

            if (settings.zoom_out_link != null) {
                settings.zoom_out_link.mousedown(function (e) {
                    //e.stopPropagation();
                    settings.focal_point_zoom_ratio = {x: 0.5, y: 0.5}
                    trigger_zoomout();
                }).mouseup(function () {
                    window.clearTimeout(settings.zoom_out_timer);
                });
            }
            if (settings.full_screen_link != null) {
                settings.full_screen_link.click(function (e) {
                    settings.focal_point_zoom_ratio = {x: 0.5, y: 0.5}
                    settings.zoom_current_percentage = 98;
                    zoomin();

                    element = document.documentElement
                    if (element.requestFullscreen) {
                        element.requestFullscreen();
                    } else if (element.mozRequestFullScreen) {
                        element.mozRequestFullScreen();
                    } else if (element.webkitRequestFullscreen) {
                        element.webkitRequestFullscreen();
                    } else if (element.msRequestFullscreen) {
                        element.msRequestFullscreen();
                    }
                    $(this).toggle();
                    settings.zoom_in_link.toggle();
                    settings.zoom_out_link.toggle();
                    settings.navigation_section.toggle();
                    settings.actual_view.toggle();
                });

                settings.actual_view.click(function (e) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                    } else if (element.msExitFullscreen) {
                        element.msExitFullscreen();
                    }
                    $(this).toggle();
                    settings.zoom_in_link.toggle();
                    settings.zoom_out_link.toggle();
                    settings.navigation_section.toggle();
                    settings.full_screen_link.toggle();
                })
            }


        });


    };

}(jQuery));
