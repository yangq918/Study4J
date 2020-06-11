function Music() {
    this.init();
}
(function() {
    var pages = [],
        panels = [],
        selectedItem = null;
    Music.prototype = {
        total: 70,
        pageSize: 10,
        // dataUrl:"http://tingapi.ting.baidu.com/v1/restserver/ting?method=baidu.ting.search.common",
        // playerUrl:"http://box.baidu.com/widget/flash/bdspacesong.swf",
        dataUrl: "https://auth-external.music.qq.com/open/fcgi-bin/fcg_weixin_music_search.fcg?",
        playerUrl: "http://ws.stream.qqmusic.qq.com/",
        init: function() {
            var me = this;
            domUtils.on($G("J_searchName"), "keyup", function(event) {
                var e = window.event || event;
                if (e.keyCode == 13) {
                    me.dosearch();
                }
            });
            domUtils.on($G("J_searchBtn"), "click", function() {
                me.dosearch();
            });
        },
        callback: function(data) {
            var me = this;
            me.data = data.list;
            setTimeout(function() {
                $G('J_resultBar').innerHTML = me._renderTemplate(data.list);
            }, 300);
        },
        dosearch: function() {
            var me = this;
            selectedItem = null;
            var key = $G('J_searchName').value;
            if (utils.trim(key) == "") return false;
            key = encodeURIComponent(key);
            me._sent(key);
        },
        doselect: function(i) {
            var me = this;
            if (typeof i == 'object') {
                selectedItem = i;
            } else if (typeof i == 'number') {
                selectedItem = me.data[i];
            }
        },
        onpageclick: function(id) {
            var me = this;
            for (var i = 0; i < pages.length; i++) {
                $G(pages[i]).className = 'pageoff';
                $G(panels[i]).className = 'paneloff';
            }
            $G('page' + id).className = 'pageon';
            $G('panel' + id).className = 'panelon';
        },
        listenTest: function(elem) {
            var me = this,
                view = $G('J_preview'),
                is_play_action = (elem.className == 'm-try'),
                old_trying = me._getTryingElem();

            if (old_trying) {
                old_trying.className = 'm-try';
                view.innerHTML = '';
            }
            if (is_play_action) {
                elem.className = 'm-trying';
                view.innerHTML = me._buildMusicHtml(me._getUrl(true));
            }
        },
        _sent: function(param) {
            var me = this;
            $G('J_resultBar').innerHTML = '<div class="loading"></div>';
            $.ajax({
                    url: me.dataUrl + "jsonCallback=success_jsonpCallback&remoteplace=txt.weixin.officialaccount&w=" + param + "&platform=weixin&perpage=" + me.total + "&curpage=1",
                    dataType: "jsonp",
                    jsonp: "callback",
                    jsonpCallback: "success_jsonpCallback",
                    type: "get",
                    success: function(param) {
                        me.callback(param)
                    },
                    error: function(a, me, view) {
                        console.log(me)
                    }
                })
                // utils.loadFile(document, {
                //     src:me.dataUrl + '&query=' + param + '&page_size=' + me.total + '&callback=music.callback&.r=' + Math.random(),
                //     tag:"script",
                //     type:"text/javascript",
                //     defer:"defer"
                // });
        },
        _removeHtml: function(str) {
            // var reg = /<\s*\/?\s*[^>]*\s*>/gi;
            // return str.replace(reg, "");
            return str;
        },
        _getUrl: function(isTryListen) {
            var me = this;
            // var param = "from=tiebasongwidget&url=&name=" + encodeURIComponent(selectedItem.albumname) + "&artist=" + encodeURIComponent(selectedItem.singername) + "&extra=" + encodeURIComponent(selectedItem.albumname) + "&autoPlay=" + isTryListen + "&loop=true";
            // return me.playerUrl + "?" + param;

            return selectedItem.m4a;
        },
        _getTryingElem: function() {
            var s = $G('J_listPanel').getElementsByTagName('span');

            for (var i = 0; i < s.length; i++) {
                if (s[i].className == 'm-trying')
                    return s[i];
            }
            return null;
        },
        _buildMusicHtml: function() {
            var me = this,
                // d = me.playerUrl + selectedItem.id + ".m4a?fromtag=46",
                d = selectedItem.m4a,
                html = '<embed class="BDE_try_Music" allowfullscreen="false"';
            return html += ' src="' + d + '"',
                html += ' width="1" height="1" style="position:absolute;left:-2000px;"',
                html += ' wmode="transparent" play="true" loop="false"',
                html += ' menu="false" allowscriptaccess="never" scale="noborder">';
        },
        _byteLength: function(str) {
            return str.replace(/[^\u0000-\u007f]/g, "\u0061\u0061").length;
        },
        _getMaxText: function(s) {
            var me = this;
            s = me._removeHtml(s);
            // if (me._byteLength(s) > 12)
            //     return s.substring(0, 5) + '...';
            if (!s) s = "&nbsp;";
            return s;
        },
        _rebuildData: function(data) {
            var me = this,
                newData = [],
                d = me.pageSize,
                itembox;
            for (var i = 0; i < data.length; i++) {
                if ((i + d) % d == 0) {
                    itembox = [];
                    newData.push(itembox)
                }
                itembox.push(data[i]);
            }
            return newData;
        },
        _renderTemplate: function(data) {
            var me = this;
            if (data.length == 0) return '<div class="empty">' + lang.emptyTxt + '</div>';
            data = me._rebuildData(data);
            var s = [],
                p = [],
                t = [];
            s.push('<div id="J_listPanel" class="listPanel">');
            p.push('<div class="page">');
            for (var i = 0, tmpList; tmpList = data[i++];) {
                panels.push('panel' + i);
                pages.push('page' + i);
                if (i == 1) {
                    s.push('<div id="panel' + i + '" class="panelon">');
                    if (data.length != 1) {
                        t.push('<div id="page' + i + '" onclick="music.onpageclick(' + i + ')" class="pageon">' + (i) + '</div>');
                    }
                } else {
                    s.push('<div id="panel' + i + '" class="paneloff">');
                    t.push('<div id="page' + i + '" onclick="music.onpageclick(' + i + ')" class="pageoff">' + (i) + '</div>');
                }
                s.push('<div class="m-box">');
                s.push('<div class="m-h"><span class="m-t">' + lang.chapter + '</span><span class="m-s">' + lang.singer +
                    '</span><span class="m-z">' + lang.special + '</span><span class="m-try-t">' + lang.listenTest + '</span></div>');
                for (var j = 0, tmpObj; tmpObj = tmpList[j++];) {
                    s.push('<label for="radio-' + i + '-' + j + '" class="m-m">');
                    s.push('<input type="radio" id="radio-' + i + '-' + j + '" name="musicId" class="m-l" onclick="music.doselect(' + (me.pageSize * (i - 1) + (j - 1)) + ')"/>');
                    s.push('<span class="m-t">' + me._getMaxText(tmpObj.songname) + '</span>');
                    s.push('<span class="m-s">' + me._getMaxText(tmpObj.singername) + '</span>');
                    s.push('<span class="m-z">' + me._getMaxText(tmpObj.albumname) + '</span>');
                    s.push('<span class="m-try" onclick="music.doselect(' + (me.pageSize * (i - 1) + (j - 1)) + ');music.listenTest(this)"></span>');
                    s.push('</label>');
                }
                s.push('</div>');
                s.push('</div>');
            }
            t.reverse();
            p.push(t.join(''));
            s.push('</div>');
            p.push('</div>');
            return s.join('') + p.join('');
        },
        exec: function() {
            var me = this;
            if (selectedItem == null) return;
            $G('J_preview').innerHTML = "";
            var b = "/cgi-bin/readtemplate?t=tmpl/qqmusic_tmpl&singer=" + encodeURIComponent(selectedItem.f.split("|")[3]) + "&music_name=" + encodeURIComponent(selectedItem.songname),
                d = selectedItem.f.split("|")[22];
            d = "/" + d.slice(d.length - 2, d.length - 1) + "/" + d.slice(d.length - 1, d.length) + "/" + d + ".jpg";
            var data = {
                musicid: selectedItem.id,
                mid: selectedItem.f.split("|")[20],
                albumurl: d,
                audiourl: selectedItem.m4a,
                music_name: selectedItem.songname,
                singer: selectedItem.f.split("|")[3],
                datasrc: b,
                singername: selectedItem.singername
            }
            editor.execCommand('music', {
                url: me._getUrl(false),
                width: 400,
                height: 95,
                selectData: data
            });
        }
    };
})();