/**
 * Created by laixiangran on 2016/1/15.
 * colorPicker.js 颜色选择器
 */
(function(){

    var $CP = ColorPicker =  function(options) {
        this.initialize(options);
    };

    $CP.prototype = {

        // 重写对象
        extend: function(destination, source) {
            for (var p in source) {
                if (source.hasOwnProperty(p)) {
                    destination[p] = source[p];
                }
            }
            return destination;
        },

        // 初始化
        initialize: function(options) {
            this.setOptions(options);
            this.drawPicker(options.textInput_id);
        },

        // 设置属性
        setOptions: function(options) {

            // 这里集中设置默认属性
            this.options = {
                id: "colorpicker"+ new Date().getTime(),
                textInput_id: null // 用于textInput的id, 必选项
            };
            this.extend(this.options, options || {}); // 用自定义属性重写默认属性
        },

        // getElementById的快捷方式
        ID: function(id) {
            return document.getElementById(id);
        },

        // getElementsByTagName的快捷方式
        TN: function(tn) {
            return document.getElementsByTagName(tn);
        },

        // createElement的快捷方式
        CE: function(s) {
            return document.createElement(s)
        },

        // 获取css属性值
        getCSS: function(element, cssAttr) {
            return element.currentStyle ?
                element.currentStyle[cssAttr] :
                document.defaultView.getComputedStyle(element, null)[cssAttr];
        },

        // RGB转十六进制
        rgbToHex: function(rgb) {
            if (/^(rgb|RGB)/.test(rgb)) {
                var aColor = rgb.replace(/(?:\(|\)|rgb|RGB)*/g,"").split(",");
                var strHex = "#";
                for (var i=0; i<aColor.length; i++) {
                    var hex = Number(aColor[i]).toString(16);
                    if (hex === "0") {
                        hex += hex;
                    }
                    strHex += hex;
                }
                return strHex;
            }
        },

        // 隐藏元素
        hide: function(el) {
            el.style.display = "none";
        },

        // 显示元素
        show: function(el) {
            el.style.display = "block";
        },

        //用于生成颜色选择器的具体内容
        colorPickerHtml: function() {

            // 只生成WEB安全色
            var  _hex = ["FF", "CC", "99", "66", "33", "00"];

            //颜色块数组
            var builder = [];

            // 生成一个颜色格
            var _drawCell = function(builder, red, green, blue) {
                builder.push('<td ');
                builder.push('style="background-color: #' + red + green + blue + ';"');
                builder.push('title="#' + red + green + blue + '"');
                builder.push('></td>');
            };

            // 生成一行颜色格
            var _drawRow = function(builder, red, blue) {
                builder.push('<tr>');
                for (var i = 0; i < 6; ++i) {
                    _drawCell(builder, red, _hex[i], blue)
                }
                builder.push('</tr>');
            };

            // 生成六个颜色区之一
            var _drawTable = function(builder, blue) {
                builder.push('<table class="cell">');
                for (var i = 0; i < 6; ++i) {
                    _drawRow(builder, _hex[i], blue)
                }
                builder.push('</table>');
            };

            // 开始创建选择器
            builder.push('<table><tr>');
            for (var r = 0; r < 3; ++r) {
                builder.push('<td>');
                _drawTable(builder, _hex[r]);
                builder.push('</td>');
            }
            builder.push('</tr><tr>');
            for (var c = 3; c < 6; ++c) {
                builder.push('<td>');
                _drawTable(builder, _hex[c]);
                builder.push('</td>');
            }
            builder.push('</tr></table>');
            builder.push('<table id="color_result"><tr><td id="color_view"></td><td id="color_code"></td></tr></table>');
            return builder.join('');
        },

        // 添加事件方法
        addEvent: function(el, type, fn) {
            if (el.attachEvent) {
                el["e" + type + fn] = fn;
                el.attachEvent("on" + type, function() {
                    el["e" + type + fn]();
                });
            }else {
                el.addEventListener(type, fn, false);
            }
        },

        //绘制选择器
        drawPicker: function(id) {
            var $CP = this,
                textInput = $CP.ID(id),
                colorPicker = $CP.CE("div");
            colorPicker.className = "colorpicker";
            colorPicker.innerHTML = $CP.colorPickerHtml();
            textInput.parentNode.insertBefore(colorPicker, null);
            $CP.hide(colorPicker);
            $CP.addEvent(textInput, "focus", function() {
                textInput.style.position = "relative";
                $CP.show(colorPicker);
                var l = textInput.offsetLeft + "px",
                    t = (textInput.clientHeight + textInput.offsetTop)+ "px";
                colorPicker.style.left = l;
                colorPicker.style.top = t;
                colorPicker.style.width = $CP.getCSS(textInput, "width");
            });
            $CP.addEvent(colorPicker, "mouseover", function() {
                var e = arguments[0] || window.event,
                    td = e.srcElement ? e.srcElement : e.target,
                    nn = td.nodeName.toLowerCase(), // 这里ie会自动转化为大写，故作小写转化
                    colorView = $CP.ID("color_view"),
                    colorCode = $CP.ID("color_code");
                if ("td" == nn) {
                    colorView.style.backgroundColor = td.style.backgroundColor ;
                    colorCode.innerText = $CP.rgbToHex(td.style.backgroundColor);
                }
            });
            $CP.addEvent(colorPicker, "click", function() {
                console.log("click");
                var e = arguments[0] || window.event,
                    td = e.srcElement ? e.srcElement : e.target,
                    nn = td.nodeName.toLowerCase();
                if ("td" == nn) {
                    textInput.value = $CP.rgbToHex(td.style.backgroundColor);
                    $CP.hide(colorPicker);
                }
            });
        }
    };
}());