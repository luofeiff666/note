/**
 * Created by 落飞FF on 2017/6/15.
 */
//名字空间模块
var app = {
    util: {},
    store: {}
};

//工具方法模块
app.util = {
    $: function (selector, note) {
        return (note || document).querySelector(selector);
    },
    formTimes: function (m) {
        var d = new Date(m);
        var pad = function (s) {
            if (s.toString().length === 1) {
                s = "0" + s;
            }
            return s;
        };
        var year = d.getFullYear(),
            month = d.getMonth() + 1,
            date = d.getDate(),
            hour = d.getHours(),
            minutes = d.getMinutes(),
            seconds = d.getSeconds();
        return year + "-" + pad(month) + "-" + pad(date) + " " + pad(hour) + ":" + pad(minutes) + ":" + pad(seconds);
    },
    setColor: function (n) {
        var n = n;
        var chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
        var generateMixed = function (n) {
            var colorStr = "";
            var index;
            for (var i = 0; i < n; i++) {
                index = parseInt(Math.random() * 16);
                colorStr += chars[index];
            }
            return colorStr;
        };
        return generateMixed(n);
    }
};
//store模块
app.store = {
    _store_key: "_sticky_note_",
    get: function (id) {
        var notes = this.getNote();
        return notes[id] || {};
    },
    set: function (id, content) {
        var notes = this.getNote();
        if (notes[id]) {
            Object.assign(notes[id], content);
        } else {
            notes[id] = content;
        }
        localStorage[this._store_key] = JSON.stringify(notes);
    },
    remove: function (id) {
        var notes = this.getNote();
        delete notes[id];
        localStorage[this._store_key] = JSON.stringify(notes);
    },
    getNote: function () {
        return JSON.parse(localStorage[this._store_key] || '{}');
    }
};
(function (util, store) {
    var $ = util.$,
        moveNote = null,
        startX,
        startY,
        maxzIndex = 0,

        noteTpl = `<i id="close" class="close"></i>
        <div id="textnote" class="textnote" contenteditable="true"></div>
        <div id="bottom" class="bottom" >
         <span>更新:</span>
         <span id="times" class="times"></span>
        </div>`;


    function Note(options) {
        var note = document.createElement("div");
        note.className = "div";
        note.id = options.id || "m-note-" + Date.now();
        note.innerHTML = noteTpl;
        $(".textnote", note).innerHTML = options.content || '';
        note.style.left = options.left + 'px';
        note.style.top = options.top + 'px';
        note.style.zIndex = options.zIndex;
        document.body.appendChild(note);
        this.note = note;
        this.updateTimes(options.updateTimes);
        this.setColor(options.colorNote);
        this.addEvent();
    }

    Note.prototype.close = function () {
        document.body.removeChild(this.note);
    };
    Note.prototype.updateTimes = function (ms) {
        var times = $(".times", this.note);
        ms = ms || Date.now();
        this.updateTimesMS = ms;
        times.innerHTML = util.formTimes(ms);
    };
    Note.prototype.setColor = function (mc) {
        var color = "#" + util.setColor(6);
        mc = mc || color;
        this.note.style.backgroundColor = mc;
    };
    Note.prototype.save = function () {
        store.set(this.note.id, {
            left: this.note.offsetLeft,
            top: this.note.offsetTop,
            zIndex: parseInt(this.note.style.zIndex),
            content: $(".textnote", this.note).innerHTML,
            updateTimes: this.updateTimesMS,
            colorNote: this.note.style.backgroundColor,
        })
    };

    Note.prototype.addEvent = function (event) {
        //mousedown事件
        var mousedownHeander = function (event) {
            moveNote = this.note;
            startX = event.clientX - moveNote.offsetLeft;
            startY = event.clientY - moveNote.offsetTop;
            if (this.note.style.zIndex !== maxzIndex - 1) {
                this.note.style.zIndex = maxzIndex++;
                store.set(this.note.id, {
                    zIndex: maxzIndex - 1
                })
            }
        }.bind(this);
        this.note.addEventListener("mousedown", mousedownHeander);

        //便签输入事件
        var editor = $(".textnote", this.note),
            inputTimes,//保存时间
            inputHeander = function () {
                var content = editor.innerHTML;
                clearTimeout(inputTimes);
                inputTimes = setTimeout(function () {
                    var update = Date.now();
                    store.set(this.note.id, {
                        content: content,
                        updateTimes: update
                    });
                    this.updateTimes(update)
                }.bind(this), 300);//延迟执行函数
            }.bind(this);
        editor.addEventListener("input", inputHeander);

        //关闭处理事件
        var closeBtn = $(".close", this.note);
        var closeHeander = function () {
            this.close();
            store.remove(this.note.id);
            closeBtn.removeEventListener("click", closeHeander);
        }.bind(this);
        closeBtn.addEventListener("click", closeHeander);
    };

    document.addEventListener('DOMContentLoaded', function (e) {
        //创建按钮事件
        $("#btn1").addEventListener("click", function (e) {
            var note = new Note({
                left: parseInt(Math.random() * (document.documentElement.clientWidth - 220)),//限制了随机坐标的位置
                top: parseInt(Math.random() * (document.documentElement.clientHeight - 320)),
                zIndex: maxzIndex++,
            });
            note.save();
        });
        //删除Note事件
        function removeNotes() {
            localStorage.clear();
            var note = document.getElementsByClassName("div");
            //删除节点，要从后往前删除 每删除一个节点会改变树的结构
            for (var i = note.length - 1; i >= 0; i--) {
                document.body.removeChild(note[i]);
            }
        }

        $("#btn2").addEventListener("click", removeNotes);

        //移动监听
        function moveHeander(e) {
            if (!moveNote) {
                return;
            }
            var l = e.clientX - startX,
                t = e.clientY - startY;
            if (l < 0) {
                l = 0;
            } else if (l > document.documentElement.clientWidth - moveNote.offsetWidth) {
                l = document.documentElement.clientWidth - moveNote.offsetWidth;
            }
            if (t < 50) {
                t = 50;
            }
            moveNote.style.left = l + "px";
            moveNote.style.top = t + "px";
        }

        document.addEventListener("mousemove", moveHeander);
        //museup事件
        var mouseupHeander = function (event) {
            if (!moveNote) {
                return;
            } else {
                store.set(moveNote.id, {
                    left: moveNote.offsetLeft,
                    top: moveNote.offsetTop,
                });
            }
            moveNote = null;
        };
        document.addEventListener("mouseup", mouseupHeander);

        // 初始化note
        var notes = store.getNote();
        Object.keys(notes).forEach(function (id) {
            var options = notes[id];
            if (maxzIndex < options.zIndex) {
                maxzIndex = options.zIndex;
            }
            new Note(Object.assign(options, {
                id: id
            }));
        });
        maxzIndex += 1;
    });

})(app.util, app.store);



