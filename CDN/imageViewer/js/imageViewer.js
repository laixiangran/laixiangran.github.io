(function(window, undefined) {

    "use strict";

    // 图片查看容器对象
    var imageViewer = window.imageViewer = function(container, options) {
        this._initialize(container, options);

        // 初始化模式
        this._initMode();

        // 工具条添加事件
        this._toolsAddEvent();

        // 判断是否支持变换
        if (this._support) {
            this._initContainer(); // 初始化容器
            this._init();
            if (this.options.sources.length > 0) {
                this.load(this.options.sources[0]); // 默认加载第一张
            } else {
                this.onError("without a image.");
            }
        } else { // 模式不支持
            this.onError("not support this mode.");
        }
    };

    imageViewer.prototype = {
        // 初始化程序
        _initialize: function(containerId, options) {
            var imageContext = COM.$D.byId(containerId);
            imageContext.innerHTML =
                '<div class="imageViewerContext">' +
                '<div class="imageViewer"></div>' +
                '<div class="smallImageViewer">' +
                '<div class="previousImg toImg" title="向左查看"> << </div>' +
                '<div class="nextImg toImg" title="向右查看"> >> </div>' +
                '<div class="moreImg"></div>' +
                '</div>' +
                '<div class="imageTools">' +
                '<button class="btn imageZoomin">放大</button>' +
                '<button class="btn imageZoomout">缩小</button>' +
                '<button class="btn rotateLeft">向左旋转</button>' +
                '<button class="btn rotateRight">向右旋转</button>' +
                '<button class="btn flipVertical">垂直翻转</button>' +
                '<button class="btn flipHorizontal">水平翻转</button>' +
                '<button class="btn imageReset">重置</button>' +
                '</div>' +
                '</div>';
            var container = this._container = COM.$D.byClassName("imageViewer")[0];
            var moreImg = this._moreImg = COM.$D.byClassName("moreImg")[0];
            // 计算图片显示区域的高度，150px为小图区和工具栏的总高度
            COM.$D.setStyle(container, "height", (imageContext.clientHeight - 150) + "px");
            this._clientWidth = container.clientWidth; // 显示区域宽度
            this._clientHeight = container.clientHeight; // 显示区域高度
            this._img = new Image(); // 显示区域的图片对象
            this._style = {}; // 备份容器样式
            this._x = this._y = 1; // 水平/垂直变换参数
            this._radian = 0; // 旋转变换参数
            this._support = false; // 是否支持变换
            this._init = this._load = this._show = this._dispose = COM.$O.noop;

            // 设置默认属性
            var opt = this._setOptions(options);

            // 小图区展示图片
            COM.$A.forEach(opt.sources, function(url) {
                var img = new Image();
                img.src = url;
                moreImg.appendChild(img);
            });

            this._zoom = opt.zoom;
            this.onPreLoad = opt.onPreLoad;
            this.onLoad = opt.onLoad;
            this.onError = opt.onError;
            this._LOAD = COM.$F.bind(function() {
                this.onLoad();
                this._load();
                this.reset();
            }, this);

            // 初始化完成，执行"init"事件
            COM.$CE.fireEvent(this, "init");
        },

        _toolsAddEvent: function() {
            var ivThis = this;

            // 放大
            COM.$E.addEvent(COM.$D.byClassName("imageZoomin")[0], "click", function() {
                ivThis.zoomin();
            });

            // 缩小
            COM.$E.addEvent(COM.$D.byClassName("imageZoomout")[0], "click", function() {
                ivThis.zoomout();
            });

            // 垂直翻转
            COM.$E.addEvent(COM.$D.byClassName("flipVertical")[0], "click", function() {
                ivThis.vertical();
            });

            // 水平翻转
            COM.$E.addEvent(COM.$D.byClassName("flipHorizontal")[0], "click", function() {
                ivThis.horizontal();
            });

            // 向左旋转90度
            COM.$E.addEvent(COM.$D.byClassName("rotateLeft")[0], "click", function() {
                ivThis.left();
            });

            // 向右旋转90度
            COM.$E.addEvent(COM.$D.byClassName("rotateRight")[0], "click", function() {
                ivThis.right();
            });

            // 重置
            COM.$E.addEvent(COM.$D.byClassName("imageReset")[0], "click", function() {
                ivThis.reset();
            });

            // 向左查看
            COM.$E.addEvent(COM.$D.byClassName("previousImg")[0], "click", function(event) {
                var moveVal = (Number(COM.$D.getStyle(ivThis._moreImg, "left").split("px")[0]) + ivThis._clientWidth);
                moveVal < 0 ? COM.$D.setStyle(ivThis._moreImg, "left", moveVal  + "px") : COM.$D.setStyle(ivThis._moreImg, "left", 0);
            });

            // 向右查看
            COM.$E.addEvent(COM.$D.byClassName("nextImg")[0], "click", function(event) {
                var moveVal = (Number(COM.$D.getStyle(ivThis._moreImg, "left").split("px")[0])) - ivThis._clientWidth;
                if (-ivThis._moreImg.clientWidth < moveVal) {
                    COM.$D.setStyle(ivThis._moreImg, "left", moveVal  + "px");
                }
            });

            // 小图点击加载
            COM.$A.forEach(COM.$D.byClassName("moreImg")[0].getElementsByTagName("img"), function(item) {
                COM.$E.addEvent(item, "click", function(event) {
                    ivThis.load(event.target.src);
                });
            });
        },

        // 设置默认属性
        _setOptions: function(options) {
            this.options = {
                sources: [],
                mode: "css3|filter|canvas",
                zoom: 0.1, // 缩放比率
                onPreLoad: function() {}, // 图片加载前执行
                onLoad: function() {}, // 图片加载后执行
                onError: function(err) { // 出错时执行
                    throw new Error(err);
                }
            };
            return COM.$O.extend(this.options, options || {});
        },

        // 模式设置
        _initMode: function() {
            var modes = imageViewer.modes;
            this._support = COM.$A.some(this.options.mode.toLowerCase().split("|"), function(mode) {
                mode = modes[mode];
                if (mode && mode.support) {
                    mode.init && (this._init = mode.init); // 初始化执行程序
                    mode.load && (this._load = mode.load); // 加载图片执行程序
                    mode.show && (this._show = mode.show); // 变换显示程序
                    mode.dispose && (this._dispose = mode.dispose); // 销毁程序

                    //扩展变换方法
                    COM.$A.forEach(imageViewer.transforms, function(transform, name) {
                        var com_this = this;
                        this[name] = function() {
                            transform.apply(this, [].slice.call(arguments));
                            com_this._show();
                        }
                    }, this);
                    return true;
                }
            }, this);
        },

        // 初始化容器对象
        _initContainer: function() {
            var container = this._container,
                style = container.style,
                position = COM.$D.getStyle(container, "position");
            this._style = { // 备份样式
                "position": style.position,
                "overflow": style.overflow
            };
            if (position != "relative" && position != "absolute") {
                style.position = "relative";
            }
            style.overflow = "hidden";
            COM.$CE.fireEvent(this, "initContainer");
        },

        // 加载图片
        load: function(src) {
            var ivThis = this;
            var img = ivThis._img;
            if (ivThis._support) {
                ivThis.onPreLoad();
                img.onload || (img.onload = ivThis._LOAD);
                img.onerror || (img.onerror = function() {
                    ivThis.onError("err image");
                });
                img.src = src;
            }
        },

        // 重置
        reset: function() {
            if (this._support) {
                this._x = this._y = 1;
                this._radian = 0;
                if (this._context) {
                    this._imgInitLeft = -this._img.width / 2;
                    this._imgInitTop = -this._img.height / 2;
                } else {
                    this._img.style.top = this._imgInitTop;
                    this._img.style.left = this._imgInitLeft;
                }
                this._show();
            }
        },

        // 销毁程序
        dispose: function() {
            if (this._support) {
                this._dispose();
                COM.$CE.fireEvent(this, "dispose");
                COM.$D.setStyle(this._container, this._style); // 恢复样式
                this._container = this._img = this._img.onload = this._img.onerror = this._LOAD = null;
            }
        }
    };

    // 变换模式
    imageViewer.modes = (function() {
        var css3Transform;

        // 初始化图片对象函数
        function initImg(img, container) {
            COM.$D.setStyle(img, {
                position: "absolute",
                border: 0,
                padding: 0,
                margin: 0,
                width: "auto",
                height: "100%",
                visibility: "hidden"
            });
            container.appendChild(img);
        }

        // 获取变换参数函数
        function getMatrix(radian, x, y) {
            var Cos = Math.cos(radian),
                Sin = Math.sin(radian);
            return {
                M11: Cos * x,
                M12: -Sin * y,
                M21: Sin * x,
                M22: Cos * y
            };
        }

        return {
            css3: {
                // css3设置
                // 检测是否支持css3
                support: (function() {
                    var style = document.createElement("div").style;
                    return COM.$A.some(["transform", "MozTransform", "webkitTransform", "OTransform"], function(css) {
                        if (css in style) {
                            css3Transform = css;
                            return true;
                        }
                    });
                }()),
                init: function() {
                    initImg(this._img, this._container);
                },
                load: function() {
                    this._imgInitTop = (this._clientHeight - this._img.offsetHeight) / 2 + "px";
                    this._imgInitLeft = (this._clientWidth - this._img.offsetWidth) / 2 + "px";
                    COM.$D.setStyle(this._img, { // 居中
                        top: this._imgInitTop,
                        left: this._imgInitLeft,
                        visibility: "visible"
                    });
                },
                show: function() {
                    var matrix = getMatrix(this._radian, this._y, this._x);

                    // 设置变形样式
                    this._img.style[css3Transform ] = "matrix(" +
                        matrix.M11.toFixed(16) + "," + matrix.M21.toFixed(16) + "," +
                        matrix.M12.toFixed(16) + "," + matrix.M22.toFixed(16) + ", 0, 0)";
                },
                dispose: function() {
                    this._container.removeChild(this._img);
                }
            },
            filter: {
                // filter设置
                // 检测是否支持filter
                support: (function() {
                    return "filters" in document.createElement("div");
                }()),
                init: function() {
                    initImg(this._img, this._container);

                    //设置滤镜
                    this._img.style.filter = "progid:DXimageViewerform.Microsoft.Matrix(SizingMethod='auto expand')";
                },
                load: function() {
                    this._img.onload = null; // 防止ie重复加载gif的bug
                    this._img.style.visibility = "visible";
                },
                show: function() {
                    // 设置滤镜
                    COM.$O.extend(
                        this._img.filters.item("DXimageViewerform.Microsoft.Matrix"),
                        getMatrix(this._radian, this._y, this._x)
                    );

                    // 保持居中
                    this._imgInitTop = this._img.style.top = (this._clientHeight - this._img.offsetHeight) / 2 + "px";
                    this._imgInitLeft = this._img.style.left = (this._clientWidth - this._img.offsetWidth) / 2 + "px";
                },
                dispose: function(){
                    this._container.removeChild(this._img);
                }
            },
            canvas: {
                // canvas设置
                // 检测是否支持canvas
                support: (function() {
                    return "getContext" in document.createElement("canvas");
                }()),
                init: function() {
                    var canvas = this._canvas = document.createElement("canvas"),
                        context = this._context = canvas.getContext("2d");

                    // 样式设置
                    COM.$D.setStyle(canvas, {
                        position: "absolute",
                        left: 0,
                        top: 0
                    });
                    canvas.width = this._clientWidth;
                    canvas.height = this._clientHeight;
                    this._container.appendChild(canvas);
                },
                show: function() {
                    var img = this._img,
                        context = this._context,
                        clientWidth = this._clientWidth,
                        clientHeight = this._clientHeight;
                    // canvas变换
                    context.save();
                    context.clearRect(0, 0, clientWidth, clientHeight); // 清空内容
                    context.translate(clientWidth / 2, clientHeight / 2); // 中心坐标
                    context.rotate(this._radian); // 旋转
                    context.scale(this._y, this._x); // 缩放
                    this._imgInitLeft = this._imgInitLeft || (-img.width / 2);
                    this._imgInitTop = this._imgInitTop || (-img.height / 2);
                    context.drawImage(img, this._imgInitLeft, this._imgInitTop); // 默认居中画图
                    context.restore();
                },
                dispose: function() {
                    this._container.removeChild(this._canvas);
                    this._canvas = this._context = null;
                }
            }
        };
    }());

    // 变换方法
    imageViewer.transforms = {

        // 垂直翻转
        vertical: function() {
            this._radian = Math.PI - this._radian;
            this._y *= -1;
        },

        // 水平翻转
        horizontal: function() {
            this._radian = Math.PI - this._radian;
            this._x *= -1;
        },

        // 根据弧度旋转
        rotate: function(radian) {
            this._radian = radian;
        },

        // 向左转90度
        left: function() {
            this._radian -= Math.PI/2;
        },

        // 向右转90度
        right: function() {
            this._radian += Math.PI/2;
        },

        // 根据角度旋转
        rotateByDegress: function(degress) {
            this._radian = degress * Math.PI / 180;
        },

        // 缩放
        scale: (function() {
            function getZoom(scale, zoom) {
                return	scale > 0 && scale > -zoom ? zoom : scale < 0 && scale < zoom ? -zoom : 0;
            }
            return function(zoom) {
                if (zoom) {
                    var hZoom = getZoom(this._y, zoom),
                        vZoom = getZoom(this._x, zoom);
                    if (hZoom && vZoom) {
                        this._y += hZoom;
                        this._x += vZoom;
                    }
                }
            }
        }()),

        //放大
        zoomin: function() {
            this.scale(Math.abs(this._zoom));
        },

        //缩小
        zoomout: function() {
            this.scale(-Math.abs(this._zoom));
        }
    };

    /*
     * 鼠标按键扩展
     * 1.鼠标左键拖动图片扩展
     * 2.鼠标中键旋转图片扩展
     * */
    imageViewer.prototype._initialize = (function() {
        var init = imageViewer.prototype._initialize,
            methods = {
                "init": function() {
                    this._mrX = this._mrY = this._mrRadian = 0;
                    this._mrSTART = COM.$F.bind(start, this);
                    this._mrMOVE = COM.$F.bind(move, this);
                    this._mrSTOP = COM.$F.bind(stop, this);
                },
                "initContainer": function() {
                    COM.$E.addEvent(this._container, "mousedown", this._mrSTART);
                },
                "dispose": function() {
                    COM.$E.removeEvent(this._container, "mousedown", this._mrSTART);
                    this._mrSTOP();
                    this._mrSTART = this._mrMOVE = this._mrSTOP = null;
                }
            };

        // 定义两个临时变量来保存img的top和left
        var temptop = 0;
        var templeft = 0;

        // 记录当前点击的鼠标按键序号
        var eButton = 0;

        // 开始函数
        function start(e) {
            var container = this._container;
                eButton = e.button;

            // 鼠标中键
            if (eButton === 1) {
                var rect = COM.$D.getClientRect(this._container);
                this._mrX = rect.left + this._clientWidth / 2;
                this._mrY = rect.top + this._clientHeight / 2;

                /*
                 * Math.atan2(y,x) 返回从X轴到点(x,y)之间的弧度
                 * 参数：y坐标在x坐标之前传递
                 * 返回值：-PI 到 PI 之间的值，是从X轴正向逆时针旋转到点(x,y)时经过的弧度
                 *
                 * 记录当前图片的弧度
                 * */
                this._mrRadian = Math.atan2(e.clientY - this._mrY, e.clientX - this._mrX) - this._radian;
            } else if (eButton === 0) { // 鼠标左键
                this._mrX = e.clientX;
                this._mrY = e.clientY;
                if (this._context) {
                    templeft = parseInt(this._imgInitLeft);
                    temptop = parseInt(this._imgInitTop);
                } else {
                    temptop = parseInt(this._img.style.top);
                    templeft = parseInt(this._img.style.left);
                }
            }
            COM.$E.addEvent(document, "mousemove", this._mrMOVE);
            COM.$E.addEvent(document, "mouseup", this._mrSTOP);
            if (COM.$B.browser.ie) {
                /*
                 * 当鼠标移动到文档外放开鼠标就触发不了mouseup事件，
                 * 这时使用setCapture()的话，可以触发losecapture事件，效果与mouseup事件一样
                 * */
                COM.$E.addEvent(container, "losecapture", this._mrSTOP);
                container.setCapture();
            } else {
                COM.$E.addEvent(window, "blur", this._mrSTOP);
                e.preventDefault(); // 取消事件的默认动作
            }
        }

        // 拖动函数
        function move(e) {
            if (eButton === 1) {
                this.rotate(Math.atan2(e.clientY - this._mrY, e.clientX - this._mrX) - this._mrRadian);
            } else if (eButton === 0) {
                var offsetY = parseInt(e.clientY - this._mrY);
                var offsetX = parseInt(e.clientX - this._mrX);
                if (this._context) {
                    this._imgInitLeft = templeft + offsetX;
                    this._imgInitTop = temptop + offsetY;
                    this._show();
                } else {
                    this._img.style.top = (temptop + offsetY) + "px";
                    this._img.style.left = (templeft + offsetX) + "px";
                }
            }

            /*
             * 当前激活（鼠标）选中区（即高亮文本）进行操作
             * 非IE：window.getSelection()
             * IE：document.selection
             * */
            window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
        }

        //停止函数
        function stop() {
            COM.$E.removeEvent(document, "mousemove", this._mrMOVE);
            COM.$E.removeEvent(document, "mouseup", this._mrSTOP);
            if (COM.$B.browser.ie) {
                var container = this._container;
                COM.$E.removeEvent(container, "losecapture", this._mrSTOP);

                // 与setCapture()成对出现，取消该对象对鼠标的监控
                container.releaseCapture();
            } else {
                COM.$E.removeEvent(window, "blur", this._mrSTOP);
            }
        }
        return function() {
            var options = arguments[1];
            if (!options || options.mouseRotate !== false) {
                //扩展钩子
                COM.$A.forEach(methods, function(method, name) {
                    COM.$CE.addEvent(this, name, method);
                }, this);
            }
            init.apply(this, arguments);
        }
    })();

    // 鼠标滚轮缩放图片扩展
    imageViewer.prototype._initialize = (function() {
        var init = imageViewer.prototype._initialize,
            mousewheel = COM.$B.browser.firefox ? "DOMMouseScroll" : "mousewheel",
            methods = {
                "init": function() {
                    this._mzZoom = COM.$F.bind(zoom, this);
                },
                "initContainer": function() {
                    COM.$E.addEvent(this._container, mousewheel, this._mzZoom);
                },
                "dispose": function() {
                    COM.$E.removeEvent(this._container, mousewheel, this._mzZoom);
                    this._mzZoom = null;
                }
            };

        //缩放函数
        function zoom(e) {
            this.scale((e.wheelDelta ? e.wheelDelta / (-120) : (e.detail || 0) / 3) * Math.abs(this._zoom));
            e.preventDefault();
        }
        return function() {
            var options = arguments[1];
            if (!options || options.mouseZoom !== false) {
                //扩展钩子
                COM.$A.forEach(methods, function(method, name) {
                    COM.$CE.addEvent(this, name, method);
                }, this);
            }
            init.apply(this, arguments);
        }
    })();

    // 导出为AMD模块
    if (typeof define === "function") {
        define([], function() {
            return imageViewer;
        });
    }
}(window));