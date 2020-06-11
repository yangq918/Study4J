/**
 * 365编辑器 企业定制JS文件
 * @authors koko
 * @date    2018-02-01 17:23:03
 */

(function ($) {

	var ueditorTools = new ueditorTools();

	// 扩展
	UE.plugins["365editor"] = function () {

		var pageConfig = {
			classid: null,
			page: 1,
			classname:null,
			is_vip:"0",
			keyword: null,
			lastPage: null,
			template: {}
		}

		var ue = this;
		var styleIcon = ue.getOpt("styleIcon"); // 素材区域的Icon图片地址链接
		var styleTitle = ue.getOpt("styleTitle") ? ue.getOpt("styleTitle") : ""; // 素材区域的title标题
		var styleShow = ue.getOpt("styleShow"); // 是否展示素材区
		var style_width = ue.getOpt("styleWidth"); // 样式中心宽度
		var appkey = ue.getOpt("appkey"); // 秘钥

		// 初始化样式中心
		function initStyleCenter() {

			var editor = $(ue.container);
			var kolEditor = editor.parent();
			var total_width = kolEditor.width();
			var styleIconCode = styleIcon ? '<span class="koleditor-styleCenter-icon"><img src="' + styleIcon + '"></span>' : "";

			var styleCenter_code =

				'<div class="koleditor-styleCenter">' +
				'    <div class="koleditor-styleCenter-header">' +
				// '        <div class="koleditor-styleCenter-title">'+styleTitle+' <i class="fa fa-refresh"></i></div>'+
				'        <div class="koleditor-styleCenter-title">' + styleIconCode + styleTitle + '</div>' +
				'        <div class="koleditor-styleCenter-label"></div>' +
				// '        <div class="koleditor-styleCenter-search">'+
				// '            <input type="text" placeholder="输入关键字搜索样式">'+
				// '            <span><i class="fa fa-search"></i> 搜索</span>'+
				// '        </div>'+
				'    </div>' +
				'    <div class="koleditor-styleCenter-inner">' +
				'    <div class="koleditor-styleCenter-list"></div>' +

				'    </div>' +
				'</div>';

			kolEditor.prepend(styleCenter_code).css("display", "flex");
			var _styleCenter = kolEditor.find(".koleditor-styleCenter");
			var _styleCenter_header = kolEditor.find(".koleditor-styleCenter-header");
			var _styleCenter_title = kolEditor.find(".koleditor-styleCenter-title");
			var _styleCenter_label = kolEditor.find(".koleditor-styleCenter-label"); // 标签
			var _styleCenter_search = kolEditor.find(".koleditor-styleCenter-search");
			var _styleCenter_list = kolEditor.find(".koleditor-styleCenter-list");

			if (styleShow) {
				_styleCenter.width(style_width);
				_styleCenter.show();
				editor.width(total_width - style_width).find(".edui-editor-iframeholder").width(total_width - style_width - 2);
			}

			// 加载分类
			$.post("https://www.365editor.com/style/tags", {
				"class_id": "all"
			}, function (backData) {
                console.log(backData);
				backData = {
					code:"S",
					msg:[
						{
							id:1,
							name:"标题",
						},
						{
							id:2,
							name:"正文",
						},
						{
							id:3,
							name:"图文",
						},
						{
							id:4,
							name:"关注",
						},
						{
							id:5,
							name:"二维码",
						},
						{
							id:6,
							name:"分隔符",
						},
						{
							id:7,
							name:"交互",
						}
					]
				}
				if (backData.code == "S") {
					var label_code = '<ul>';
					for (var i = 0; i < backData.msg.length; i++) {
						label_code += '<li class="' + (i == 0 ? "active" : "") + '" data-classid="' + backData.msg[i].id + '"    data-classname="' + backData.msg[i].name + '" >' + backData.msg[i].name + '</li>'
					}
					label_code += "</ul>"
					_styleCenter_label.append(label_code);

					pageConfig.classid = _styleCenter_label.find("li.active").attr("data-classid");

					// 分类点击查询
					_styleCenter_label.find("li").unbind("click").click(function () {
						_styleCenter_label.find("li").removeClass("active");
						$(this).addClass("active");

						pageConfig.classid = $(this).attr("data-classid");
						pageConfig.classname = $(this).attr("data-classname");
						// pageConfig.keyword = _styleCenter_search.find("input").val();
						pageConfig.page = 1;
						getDataByLabel();
					});

				} else {
					var label_fail_code = "<div class='koleditor-styleCenter-label-fail'> <i class='fa fa-exclamation-circle'></i> 请获取正式授权解锁分类列表功能</div>";
					_styleCenter_label.append(label_fail_code)
				}

				var total_height = kolEditor.height();
				_styleCenter_list.height(total_height - _styleCenter_header.height());

				getDataByLabel();
			});

			// 关键字搜索点击查询
			_styleCenter_search.find("span").click(function () {
				pageConfig.keyword = $(this).siblings("input").val();
				pageConfig.page = "1";
				getDataByLabel();
			})

			_styleCenter_search.find("input").keypress(function (event) {
				if (event.which === 13) {
					pageConfig.keyword = $(this).val();
					pageConfig.page = "1";
					getDataByLabel();
				}
			});

			// 刷新搜索项
			_styleCenter_title.find(".fa-refresh").click(function () {
				_styleCenter_search.find("input").val("");
				_styleCenter_label.find("li").removeClass("active");
				_styleCenter_label.find("li").eq(0).addClass("active");

				pageConfig.keyword = "";
				pageConfig.page = "1";
				pageConfig.classid = _styleCenter_label.find("li.active").attr("data-classid");

				getDataByLabel();
			})

			// 素材滚动
			_styleCenter_list.scroll(function (event) {

				if (($(this).get(0).scrollHeight - $(this).scrollTop()) <= $(this).height() + 80) {
					pageConfig.page = pageConfig.page * 1 + 1;

					if (pageConfig.page > pageConfig.lastPage) {
						return false;
					}

					getDataByLabel();
				}
			}); 

			// 加载素材操作工具条
			$(ue.body).delegate(".KolEditor", "click", function (event) {
				$(ue.body).find(".checkSelected").removeClass("checkSelected")

				if (event.stopPropagation) {
					event.stopPropagation();
				} else {
					event.cancelBubble = true;
				}

				$(this).addClass("checkSelected");
				$(this).materialToolsBar(ue);
			})

			$(ue.body).delegate("img", "click", function (event) {
				$(ue.body).find(".checkSelected").removeClass("checkSelected")

				if (event.stopPropagation) {
					event.stopPropagation();
				} else {
					event.cancelBubble = true;
				}

				$(this).addClass("checkSelected");
				// 加载素材操作工具条
				$(this).materialToolsBar(ue);
			})

			// 隐藏工具条
			$(document).click(function (event) {  
				var target = event.srcElement || event.target;
				if ($(target).parents(".tools-bar").size() <= 0 && $(target).parents(".colpick").size() <= 0) {
					$(".material-operation-tools").remove();
					$(ue.body).find(".checkSelected").removeClass("checkSelected");

					$("[id*=collorpicker_]").hide();
				}
			});

			$(ue.container).append("<div class='koleditor-monitor'>已输入<span class='koleditor-monitor-text'>0</span>字<span class='koleditor-monitor-img'>0</span>图</div>");

			// 输入字数监控
			ue.addListener("afterSelectionChange", function () {
				$(ue.container).find(".koleditor-monitor-text").text(ue.getContentLength(true));
				$(ue.container).find(".koleditor-monitor-img").text($(ue.body).find("img").length);
			})

			// 加载数据
			function getDataByLabel() {

				var conditions = {};
				conditions.page = pageConfig.page;
				conditions.classname = pageConfig.classname;
				conditions.keyword = pageConfig.keyword;
				conditions.is_vip = "1";
				conditions.pagesize= "20";
				conditions.tagname="";

				_styleCenter_list.before('<div class="koleditor-styleCenter-inner-loading"><div id="preloader_1"><span></span><span></span><span></span><span></span></div></div>');

				$.post("https://www.365editor.com/style/search", conditions, function (backData) {
					console.log(backData);

					if (backData.code == "S") {
						var material_code = "";
						var isTemplate_material = backData.msg.type && backData.msg.type == "template" ? true : false;

						pageConfig.lastPage = backData.msg.lastpage;
						pageConfig.page == 1 ? _styleCenter_list.empty().scrollTop(0) : "";

						if (backData.msg.data.length > 0) {
							for (var i = 0; i < backData.msg.data.length; i++) {

								if (isTemplate_material) {
									material_code += '<div class="style-item"><section class="KolEditor" data-id="' + backData.data.data[i].id + '"><img src="' + backData.data.data[i].cover + '"/></section></div>';

									pageConfig.template[backData.msg.data[i].id] = backData.msg.data[i].content;
								} else {
									material_code += '<div class="style-item">' + backData.msg.data[i].code + '</div> ';
								}
							}

							_styleCenter_list.append(material_code).find(".KolEditor").unbind("click").click(function () {
								if (isTemplate_material) {
									ue.execCommand('inserthtml', pageConfig.template[$(this).attr("data-id")]);
								} else {
									ue.execCommand('inserthtml', '<section class="KolEditor">' + $(this).html() + '</section>');
								}
							})

						} else if (backData.msg.total == 0) {
							_styleCenter_list.empty();
							var nodata_code = "<div class='koleditor-styleCenter-inner-nodata'>暂无素材内容</div>";
							_styleCenter_list.append(nodata_code);
						}

						_styleCenter_list.siblings(".koleditor-styleCenter-inner-loading").remove();
					} else {

						_styleCenter_list.empty().siblings(".koleditor-styleCenter-inner-loading").remove();
						var style_fail_code = '<div class="style-item"><section class="KolEditor" style="font-family: Arial; border: 0px none; padding: 0px; color: rgb(239, 66, 119);"><section style="margin-right: 0%; margin-left: 0%; position: static;"><section style="display: inline-block; width: 100%; vertical-align: top;"><section style="font-size: 12.8px; margin-right: 0%; margin-bottom: -10px; margin-left: 0%; position: static;transform: translate3d(3px, 0px, 0px);-webkit-transform: translate3d(3px, 0px, 0px);-moz-transform: translate3d(3px, 0px, 0px);-o-transform: translate3d(3px, 0px, 0px);"><section style="display: inline-block;"><section style="height: 2em; line-height: 2em; display: inline-block; vertical-align: top; background-color: #319369; color: rgb(255, 255, 255); font-size: 16px; text-align: center; padding-left: 8px; padding-right: 8px;">365编辑器</section><section style="display: inline-block; vertical-align: top; width: 0px; border-left: 1em solid #319369; font-size: 16px; border-top: 1em solid transparent !important; border-bottom: 1em solid transparent !important;"></section><section style="width: 0px; border-right: 0.6em solid rgb(2, 32, 99); border-top: 0.6em solid rgb(2, 32, 99); border-left: 0.6em solid transparent !important; border-bottom: 0.6em solid transparent !important;"></section></section></section><section style="margin-right: 0%; margin-left: 0%; position: static;"><section style="display: inline-block; padding-left: 16px; border-width: 0px;"><section style="display: inline-block; width: 100%; vertical-align: top; border-left: 2px dashed rgb(160, 160, 160); border-bottom-left-radius: 0px; padding-left: 10px;"><section style="margin: 10px 0%; position: static;"><section style="font-size: 14px;">您目前使用的是365编辑器插件体验版，请联系管理员获取正式授权，解锁更多功能，管理员联系QQ:1839445785</section></section></section></section></section></section></section></section></div>';
						_styleCenter_list.append(style_fail_code);
						_styleCenter_list.find(".style-item").unbind("click").click(function () {
							ue.execCommand('inserthtml', $(this).html());
						})
					}
				})
			}
		}



		$(function () {

			ueRegisterComponent(ue);

			ue.ready(function () {

				// colpick插件
				initcolpick();

				// 工具条组件
				initToolsBar();

				// 初始化样式中心
				initStyleCenter();
			});
		})
	}

	// UE注册组件
	function ueRegisterComponent(ue) {

		var serverUrl = window.UEDITOR_CONFIG.serverUrl;

		// // 导入微信文章
		// UE.registerUI('import',function(editor,uiName){
		// 	var content = 
		// 		'<div class="importArticleDialog">'+
		// 		'	<input class="importArticleDialog-input" type="text" placeholder="请输入微信文章的链接地址">'+
		// 		'	<div class="importArticleDialog-error"><i class="fa fa-times-circle"></i> <em></em></div>'+
		// 		'	<div class="importArticleDialog-tips">注意：如需获得正式使用权，请自行联系版权所有者</div>'+
		// 		'</div>';

		//     var dialog = new UE.ui.Dialog({
		//         //需要指定当前的编辑器实例
		//         content: content,
		//         editor:editor,
		//         name:uiName,
		//         title:"导入微信文章",
		//         cssRules:"width:460px; height:180px;",
		//         buttons:[{
		//                className:'edui-okbutton',
		//                label:'确认',
		//                onclick:function () {
		//                	ueditorTools.loading();
		//                	var conditions = {};
		//                	conditions.url = $(".importArticleDialog-input").val();
		//                	$.post(serverUrl+"?action=inputarticle",conditions,function(backData) {
		//                		var backData = JSON.parse(backData);
		//                		if(backData.code == "S") {
		//                			$(".importArticleDialog-error").css("opacity","0");
		//                			ue.ready(function() {
		//                                   ue.setContent(backData.msg.content);
		//                                   dialog.close();
		// 		                	ueditorTools.closeLoading();

		//                               });
		//                		}else {
		//                			$(".importArticleDialog-error").css("opacity","1").find("em").text(backData.msg);
		// 	                	ueditorTools.closeLoading();
		//                		}
		//                	})
		//                }
		//            },
		//            {
		//                className:'edui-cancelbutton',
		//                label:'取消',
		//                onclick:function () {
		//                    dialog.close();
		//                }
		//            }],
		//        });

		//     var btn = new UE.ui.Button({
		//         name:'dialogbutton' + uiName,
		//         title:'导入微信文章',
		//         onclick:function () {
		//         	dialog.render();
		//         	dialog.open();
		//         }
		//     });

		//     return btn;
		// });

		// 切换素材
		// UE.registerUI('switch',function(editor,uiName){

		//     // 切换素材
		//     editor.registerCommand("switch",{
		//         execCommand:function(){

		//         	var style_width = ue.getOpt("styleWidth"); 
		//         	var total_width = $(ue.container).parent().width();

		// 			var _styleCenter_header = $(ue.container).parent().find(".koleditor-styleCenter-header");
		//         	var _styleCenter_list = $(ue.container).parent().find(".koleditor-styleCenter-list");

		//         	if($(".koleditor-styleCenter").is(":visible")) {
		// 				$(ue.container).width(total_width).find(".edui-editor-iframeholder").width(total_width - 2);
		// 				$(".koleditor-styleCenter").hide();
		//         	}else {
		// 				$(ue.container).width(total_width - style_width).find(".edui-editor-iframeholder").width(total_width - style_width - 2);
		// 				$(".koleditor-styleCenter").show();
		// 				var total_height = $(ue.container).parent().height();
		// 				_styleCenter_list.height(total_height - _styleCenter_header.height());
		//         	}
		//         }
		//     });

		//     var btn = new UE.ui.Button({
		//         name:uiName,
		//         title:"素材库",
		//         onclick:function () {
		//            editor.execCommand(uiName);
		//         }
		//     });

		//     return btn;
		// });
	}

	// 工具方法
	function ueditorTools() {

		this.loading = function () {
			$("body").append('<div class="koleditor-styleCenter-inner-loading"><div id="preloader_1"><span></span><span></span><span></span><span></span></div></div>');
		}

		this.closeLoading = function () {
			$("body").find(".koleditor-styleCenter-inner-loading").remove();
		}
	};

	// 工具条组件
	function initToolsBar() {
		function ToolsBar() {
			this.id = tools_fun().GetRandomNum(10000, 99999);
			this.ueditor = ""; // 百度编辑器对象
			this.material = ""; // 目标素材
			this.material_nodes = []; // 素材的所有节点

			this.toolsBar_wrapper_code = '<menu id="' + this.id + '" class="material-operation-tools"></menu>';
			this.$toolsBar_wrapper = ""; // 工具条jquery 对象
			this.toolsBar_code = '<div class="tools-bar"></div>';
		}

		// 初始化方法
		ToolsBar.prototype.init = function () {

			if (this.material.attr("data-tools-id") && $("#" + this.material.attr("data-tools-id")).size() > 0) {
				return false;
			}

			// 向页面部署初始化代码
			this.randerInitToolsBar();

			// 向页面部署通用素材工具条
			this.randerBaseToolsBar();

			// 判断素材类型, 根据类型不同加载不同的工具条
			this.randerSeniorToolsBar();

			// 调整工具条的位置
			this.setToolsPosition();

			//加载监听颜色字号等的事件
			this.enevtListener();

			// 加载一些特殊事件
			this.loadSpecialEvent();
		};

		// 工具条操作项
		ToolsBar.prototype.operationItems = function () {

			var that = this;

			// 拖动操作
			var _drop = function () {
				var code = '<li class="operation-item" data-tips="拖动" style="cursor:move;">' +
					'	<a style="cursor:move;" href="javascript:void(0)" title="拖动" data-act="drop"><i class="fa fa-arrows"></i></a>' +
					'</li>';

				// 拖拽功能
				that.$toolsBar_wrapper.delegate('[data-act="drop"]', 'mousedown', start);
				var obj = $('menu.material-operation-tools');

				function start(e) {
					var ol = obj.offset().left;
					var ot = obj.offset().top;
					deltaX = e.pageX - ol;
					deltaY = e.pageY - ot;

					$(document).bind({
						'mousemove': move,
						'mouseup': stop
					});
					return false;
				}

				function move(e) {
					var _left = (e.pageX - deltaX);
					var _top = (e.pageY - deltaY);

					if (_left < 0) {
						_left = 0;
					} else if (_left > $(window).width() - obj.width()) {
						_left = $(window).width() - obj.width();
					}

					if (_top < $(that.ueditor.container).offset().top * 1) {
						_top = $(that.ueditor.container).offset().top * 1;
					} else if (_top >= ($(that.ueditor.container).offset().top * 1 + $(that.ueditor.container).height())) {
						_top = $(that.ueditor.container).offset().top * 1 + $(that.ueditor.container).height()
					}

					obj.css({
						"left": _left,
						"top": _top
					});
					return false;
				}

				function stop() {
					localStorage.setItem("material_top", obj.position().top);
					localStorage.setItem("material_left", obj.position().left);
					$(document).unbind({
						'mousemove': move,
						'mouseup': stop
					});
				}
				return code;
			};

			// 删除操作
			var _del = function () {
				var code = '<li class="operation-item" data-tips="删除">' +
					'	<a href="javascript:void(0)" title="删除" data-act="del"><i class="fa fa-trash-o"></i></a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act="del"]', 'click', function (event) {
					that.material.parents(".KolEditor").find(".KolEditor-select").remove();
					that.material.find(".KolEditor-select").remove();
					that.$toolsBar_wrapper.remove();
					that.ueditor.selection.getRange().selectNode(that.material.get(0)).deleteContents();
				});
				return code;
			};

			// 复制操作
			// var _copy = function() {
			//     var code = '<li class="operation-item"  data-tips="复制" id="partcopy">' +
			//         '	<a href="javascript:void(0)" title="复制" data-act="copypart" class="partcopy"><i class="fa fa-files-o"></i></a>' +
			//         '</li>';

			//     // that.$toolsBar_wrapper.delegate('[data-act="copy"]', 'click', function(event) {
			//     // 	that.ueditor.selection.getRange().selectNode(that.material.get(0)).select();
			//     // 	that.material.find(".KolEditor-select").remove();
			//     // 	that.ueditor.execCommand("copy");
			//     // });
			//     return code;
			// };

			var _select = function () {
				var code = '<li class="operation-item" data-tips="选中">' +
					'<a href="javascript:void(0)" title="选中" data-act="select"><i class="fa fa-object-group" aria-hidden="true"></i></a>' +
					'</li>';
				that.$toolsBar_wrapper.delegate('[data-act="select"]', 'click', function (event) {
					that.ueditor.selection.getRange().selectNode(that.material.get(0)).select();
				});
				return code;
			}

			// 插入行操作
			var _insert_row = function () {
				var code = '<li class="operation-item" data-tips="插入空行">' +
					'	<a href="javascript:void(0)" data-act="before-row">前插空行</a>' +
					'	<a href="javascript:void(0)" data-act="choose-insert-row"><i class="fa fa-caret-down"></i></a>' +
					'	<menu class="choose-insert-row">' +
					'		<li data-act="before-row">前插空行</li>' +
					'		<li data-act="after-row">后插空行</li>' +
					'	</menu>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=choose-insert-row]', 'click', function (event) {
					if (that.$toolsBar_wrapper.find("menu[class=choose-insert-row]").is(":hidden")) {
						that.$toolsBar_wrapper.find("menu[class=choose-insert-row]").show();
						that.$toolsBar_wrapper.find("menu[class=set-style]").hide();
						that.$toolsBar_wrapper.find("menu[class=set-all-color]").hide();
					} else {
						that.$toolsBar_wrapper.find("menu[class=choose-insert-row]").hide();
						return false;
					}

					that.$toolsBar_wrapper.find("menu[class=choose-insert-row]").find("li").click(function () {
						$(this).parents(".operation-item").find("a").first().attr("data-act", $(this).data("act")).text($(this).text());
						that.$toolsBar_wrapper.find("menu[class=choose-insert-row]").hide();
					});;
				});

				that.$toolsBar_wrapper.delegate('[data-act=before-row]', 'click', function (event) {
					that.material.before('<p><br/></p>');
				});

				that.$toolsBar_wrapper.delegate('[data-act=after-row]', 'click', function (event) {
					that.material.after('<p><br/></p>');
				});
				return code;
			};

			// 设置颜色操作
			var _set_color = function () {
				// 分析素材中的颜色, 并且组织代码
				var eventSelection = that.ueditor.selection.getStart();
				var color = getcurryStyle(eventSelection).color;
				var code = "";
				if (analyzeMaterialColor().codeNum > 5) {
					code = '<li class="operation-item"  data-tips="素材中的所有颜色"><div data-act="all-color" clas="showAllColor"><span style="display:inline-block;width:25px;height:25px;border:2px solid #fff;border-radius:50%;margin:5px;float:left;background-color:' + color + '"></span><i class="fa fa-ellipsis-h" style="font-size:18px;color:#fff;margin-top:12px;"></i></div>' +
						'<menu class="set-all-color">' + analyzeMaterialColor().code + '</menu>' +
						'</li>';
				} else {
					code = '<li class="operation-item"  data-tips="素材中的所有颜色">' + analyzeMaterialColor().code + '</li>';
				}

				// 分析素材中的颜色, 并且组织代码
				function analyzeMaterialColor() {
					var colors = []; // 颜色值

					that.material_nodes.push(that.material.get(0));
					done(that.material.get(0));

					function done(node) {
						if (node.children.length != 0) {
							var childrenNodes = node.children;
							for (var index = 0; index < childrenNodes.length; index++) {
								if (childrenNodes[index].className === "KolEditor-select") {
									continue;
								}
								that.material_nodes.push(childrenNodes[index]);
								done(childrenNodes[index]);
							}
						}
					}

					for (var i = 0; i < that.material_nodes.length; i++) {
						var style_code = $(that.material_nodes[i]).attr("style") ? $(that.material_nodes[i]).attr("style").replace(/\s/g, "") : "";

						var _styles = style_code.split(";");

						for (var j = 0; j < _styles.length; j++) {
							var _style_val = _styles[j].split(":");
							if (_style_val[0] != "color") {
								var _index_1 = _style_val[1] ? _style_val[1].indexOf("#") : -1,
									// var _index_1 = -1,
									_index_2 = _style_val[1] ? _style_val[1].indexOf("rgb") : -1,
									_index_3 = _style_val[1] ? _style_val[1].indexOf("rgba") : -1;

								if (_index_1 >= 0 || _index_2 >= 0 || _index_3 >= 0) {

									if (_index_1 >= 0) {

										_color_val = _style_val[1].substring(_index_1 + 1, _style_val[1].length);
										// continue;

									} else if (_index_2 >= 0 && _index_3 < 0) {

										_color_val = _style_val[1].substring(_index_2 + 4, _style_val[1].length - 1);

									} else if (_index_3 >= 0) {

										_color_val = _style_val[1].substring(_index_3 + 5, _style_val[1].length - 1);
										continue;
									}

									// 查重, 如果没有重复, 插入数组
									// var flag = true;
									// for (var x = 0; x < colors.length; x++) {
									// 	if(_color_val === colors[x].color){
									// 		flag = false;
									// 	}
									// }

									// if(flag){
									colors.push(_color_val);
									// }
								}
							}
						}
					}
					var color = {};
					color.codeNum = 0;
					color.code = "";
					colors = tools_fun().array_unique(colors);
					for (var i = 0; i < colors.length; i++) {
						var _style = "";
						if (colors[i].indexOf(",") >= 0) {
							_style = "background: rgb(" + colors[i] + ")";
						} else {
							_style = "background: #" + colors[i];
						}
						color.codeNum++;
						color.code += '<span class="colorPicker-alone" style="' + _style + '" data-colorval="' + colors[i] + '"></span>';
					}

					return color;
				}

				that.$toolsBar_wrapper.delegate('[data-act=all-color]', 'click', function (event) {
					if (that.$toolsBar_wrapper.find("menu[class=set-all-color]").is(":hidden")) {
						that.$toolsBar_wrapper.find("menu[class=set-all-color]").show();
						that.$toolsBar_wrapper.find("menu[class=set-style]").hide();
						that.$toolsBar_wrapper.find(".choose-insert-row").hide();
						that.$toolsBar_wrapper.find(".set-image-border").hide();
						// 设置下拉菜单的高度
						that.setMenuHeight("set-all-color");
					} else {
						that.$toolsBar_wrapper.find("menu[class=set-all-color]").hide();
						return false;
					}
				})

				return code;
			};

			// 设置样式操作
			var _set_style = function () {
				var code = '<li class="operation-item" data-tips="设置素材样式">' +
					'	<a href="javascript:void(0)" data-act="set-style"><i class="fa fa-star-half-o"></i></a>' +
					'	<menu class="set-style">' +
					'		<li data-act="set-transparent">' +
					'			<span class="prop-name"><i class="fa fa-eye-slash"></i>透明度</span>' +
					'			<div class="fill-item"><input class="bubble-slider" type="number" min="0" max="100" data-color="#fff" value="100"></div>' +
					'			<input type="number" class="input-val-small" id="transparency">' +
					'		</li>' +
					'		<li data-act="set-rotate">' +
					'			<span class="prop-name"><i class="fa fa-repeat"></i>旋转</span>' +
					'			<div class="fill-item"><input class="bubble-slider" type="number" min="0" max="360" data-color="#fff" value="0"></div>' +
					'			<input type="number" class="input-val-small" id="rotate">' +
					'		</li>' +
					'		<li data-act="set-zoom">' +
					'			<span class="prop-name"><i class="fa fa-clone"></i>缩放</span>' +
					'			<div class="fill-item"><input class="bubble-slider" type="number" min="0" max="10" data-color="#fff" value="0"></div>' +
					'			<input type="number" class="input-val-small" id="zoom">' +
					'		</li>' +
					'		<li data-act="set-margintop">' +
					'			<span class="prop-name"><i class="fa fa-level-up"></i>段前距</span>' +
					'			<input type="number" placeholder="请填写正负数值" class="input-val-big" id="margintop">' +
					'			<em class="company">像素</em>' +
					'		</li>' +
					'		<li data-act="set-marginbottom">' +
					'			<span class="prop-name"><i class="fa fa-level-down"></i>段后距</span>' +
					'			<input type="number" placeholder="请填写正负数值" class="input-val-big" id="marginbottom">' +
					'			<em class="company">像素</em>' +
					'		</li>' +
					'		<li data-act="set-offsetx">' +
					'			<span class="prop-name"><i class="fa fa-indent"></i>偏移</span>' +
					'			<input type="number" placeholder="请填写正负数值" class="input-val-big" id="offsetx">' +
					'			<em class="company">像素</em>' +
					'		</li>' +
					'	</menu>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-style]', 'click', function (event) {
					if (that.$toolsBar_wrapper.find("menu[class=set-style]").is(":hidden")) {
						that.$toolsBar_wrapper.find("menu[class=set-style]").show();
						that.$toolsBar_wrapper.find("menu[class=set-all-color]").hide();
						that.$toolsBar_wrapper.find(".choose-insert-row").hide();
						that.$toolsBar_wrapper.find(".set-image-border").hide();
						if (that.$toolsBar_wrapper.find(".bubble-slider-wrap").size() <= 0) {
							that.$toolsBar_wrapper.find(".bubble-slider").each(function (index, el) {
								$(this).bubbleSlider();
							});
						}
						// 设置默认值
						setDefaultValue();

						// 设置下拉菜单的高度
						that.setMenuHeight("set-style");
					} else {
						that.$toolsBar_wrapper.find("menu[class=set-style]").hide();
						return false;
					}

					that.$toolsBar_wrapper.find(".bubble-slider-thumb").mousedown(function (event) {
						that.$toolsBar_wrapper.find(".bubble-slider-thumb").mousemove(function (event) {
							var val = $(this).parents(".fill-item").find(".bubble-slider").val();
							$(this).parents(".fill-item").siblings("input").val(val);
							var act = $(this).parents("li").data("act");
							setStyle(act, val);
						});
						$(this).mouseup(function (event) {
							$(this).unbind("mousemove");
						});
					});

					that.$toolsBar_wrapper.find("menu.set-style").find("input").keyup(function (event) {
						if (event.keyCode === 13) {
							var act = $(this).parents("li").data("act");
							setStyle(act, $(this).val());
						}
					});

					that.$toolsBar_wrapper.find("menu.set-style").find("input").blur(function (event) {
						var act = $(this).parents("li").data("act");
						setStyle(act, $(this).val());
					});
				});

				function setDefaultValue() {
					that.$toolsBar_wrapper.find("menu[class=set-style]").find("li").each(function (index, el) {
						var styleType = $(this).data("act").split("-")[1];
						var val = that.material.attr("data-" + styleType);
						if (val) {
							if (styleType == "transparent") {
								val = 100 - (val * 100);
							}

							// 处理滑动条
							var bubbleSlider = that.$toolsBar_wrapper.find("menu[class=set-style]").find("li[data-act=set-" + styleType + "]").find(".bubble-slider-wrap");
							if (bubbleSlider.size() > 0) {
								bubbleSlider.remove();
								that.$toolsBar_wrapper.find("menu[class=set-style]").find("li[data-act=set-" + styleType + "]").find(".fill-item").find("input").attr("value", val).bubbleSlider();
							}
							that.$toolsBar_wrapper.find("menu[class=set-style]").find("li[data-act=set-" + styleType + "]").find("input").val(val);
						}
					});
				}

				function setStyle(styleType, val) {

					switch (styleType) {

						// 设置透明
						case "set-transparent":
							that.material.attr("data-transparent", (val >= 0 && val <= 100) ? (100 - val) / 100 : 1);
							that.material.css({
								opacity: val / 100
							});
							break;

							// 设置旋转
						case "set-rotate":
							that.material.attr("data-rotate", ((val >= 0 && val <= 360) ? val : 0));
							that.material.css({
								"transform": "rotate(" + ((val >= 0 && val <= 360) ? val : 0) + "deg)"
							});
							break;

							// 设置缩放
						case "set-zoom":
							that.material.attr("data-zoom", ((val >= 0 && val <= 100) ? val : 0));
							that.material.css({
								"transform": "scale(" + ((val > 0 && val <= 100) ? val : 1) + ")"
							});
							break;

							// 设置段前距
						case "set-margintop":
							that.material.attr("data-margintop", val);
							that.material.css({
								"margin-top": val + "px"
							});
							break;

							// 设置段后距
						case "set-marginbottom":
							that.material.attr("data-marginbottom", val);
							that.material.css({
								"margin-bottom": val + "px"
							});
							break;

							// 偏移
						case "set-offsetx":
							that.material.attr("data-offsetx", val);
							that.material.css({
								"transform": "translate3d(" + val + "px, 0px, 0px)"
							});
							break;
					}
				}

				return code;
			};

			// 清除格式操作
			var _clear_style = function () {
				var code = '<li class="operation-item" data-tips="清除格式">' +
					'	<a href="javascript:void(0)" titile="清除格式" data-act="clear-style"><i class="fa fa-eraser"></i></a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act="clear-style"]', 'click', function (event) {
					var text = that.material.text();
					that.material.empty();
					that.material.html(text);
					that.$toolsBar_wrapper.remove();
				});
				return code;
			};

			//复位
			var _reset = function () {
				var code = '<li class="operation-item" data-tips="复位">' +
					'	<a href="javascript:void(0)" titile="复位" data-act="reset">复位</a>' +
					'</li>';
				that.$toolsBar_wrapper.delegate('[data-act="reset"]', 'click', function (event) {
					localStorage.removeItem("material_top");
					localStorage.removeItem("material_left");
					that.setToolsPosition();
				});

				return code;
			}

			// 素材上移
			var _material_set_up = function () {
				var code = '<li class="operation-item" data-tips="上移">' +
					'	<a href="javascript:void(0)" data-act="material_set_up">上移</a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=material_set_up]', 'click', function (event) {
					var _thisMaterial = that.material;
					if (that.material[0].tagName.toLocaleLowerCase() == "img") {
						_thisMaterial = _thisMaterial.parents(".KolEditor").eq(0);
					}
					if (_thisMaterial.prev()) {
						_thisMaterial.prev().before(_thisMaterial);
					}
				});
				return code;
			};

			// 素材下移
			var _material_set_down = function () {
				var code = '<li class="operation-item" data-tips="下移">' +
					'	<a href="javascript:void(0)" data-act="material_set_down">下移</a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=material_set_down]', 'click', function (event) {
					var _thisMaterial = that.material;
					if (that.material[0].tagName.toLocaleLowerCase() == "img") {
						_thisMaterial = _thisMaterial.parents(".KolEditor").eq(0);
					}
					if (_thisMaterial.next()) {
						_thisMaterial.next().after(_thisMaterial);
					}
				});
				return code;
			};

			// ---------------------- 关于文字的操作 ----------------------

			// 字号
			var _font_size = function () {
				var code = '<li class="operation-item set-font-size-item"  data-tips="选中后,设置字号">' +
					'	<input type="text" class="input-val-small" id="setFontSize" min="12" value="" readonly="readonly" />' +
					'	<a href="javascript:void(0)" data-act="set-font-size"><i class="fa fa-caret-down"></i></a>' +
					'	<menu class="set-font-size">' +
					'		<li data-fontsize="12">12</li>' +
					'		<li data-fontsize="14">14</li>' +
					'		<li data-fontsize="16">16</li>' +
					'		<li data-fontsize="18">18</li>' +
					'		<li data-fontsize="21">21</li>' +
					'		<li data-fontsize="22">22</li>' +
					'		<li data-fontsize="24">24</li>' +
					'		<li data-fontsize="28">28</li>' +
					'		<li data-fontsize="32">32</li>' +
					'		<li data-fontsize="36">36</li>' +
					'		<li data-fontsize="42">42</li>' +
					'		<li data-fontsize="48">48</li>' +
					'		<li data-fontsize="56">56</li>' +
					'		<li data-fontsize="64">64</li>' +
					'		<li data-fontsize="72">72</li>' +
					'		<li data-fontsize="80">80</li>' +
					'		<li data-fontsize="88">88</li>' +
					'		<li data-fontsize="96">96</li>' +
					'	</menu>' +
					'</li>';

				// that.$toolsBar_wrapper.delegate('#setFontSize', 'keyup', function(event) {
				//     if (event.keyCode === 13) {
				//         setFontSize($(this).val());
				//     }
				// });

				// that.$toolsBar_wrapper.delegate('#setFontSize', 'blur', function(event) {
				//     setFontSize($(this).val());
				// });

				that.$toolsBar_wrapper.delegate('.set-font-size-item', 'click', function (event) {

					if ($(".set-font-size").is(":hidden")) {
						$(".set-font-size").show();

						// 设置下拉菜单的高度
						that.setMenuHeight("set-style");
					} else {
						$(".set-font-size").hide();
						return false;
					}

					that.$toolsBar_wrapper.find(".set-font-size").find("li").unbind('click');
					that.$toolsBar_wrapper.find(".set-font-size").find("li").click(function (event) {
						$(".set-font-size").hide();
						$("#setFontSize").val($(this).data("fontsize"));
						setFontSize($(this).data("fontsize"));
					});
				});

				// 设置字体大小
				function setFontSize(size) {
					that.ueditor.execCommand('fontsize', size + 'px');
				}

				return code;
			}

			// 文字颜色 / 背景颜色 / 文字阴影
			var _font_color = function () {
				var code = '<li class="operation-item" data-tips="选中后,设置字体颜色">' +
					'	<span class="colorPicker-alone-font-color"></span>' +
					'</li>';

				return code;
			}

			var _font_bg_color = function () {
				var code = '<li class="operation-item" data-tips="选中后,设置文字背景颜色">' +
					'	<span class="colorPicker-alone-font-bg-color"></span>' +
					'</li>';

				return code;
			}

			// 文字对齐, 左 中 右
			var _font_align_left = function () {
				var code = '<li class="operation-item" data-tips="左对齐">' +
					'	<a href="javascript:void(0)" data-act="set-font-align-left"><i class="fa fa-align-left"></i></a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-font-align-left]', 'click', function (event) {
					that.ueditor.execCommand('justify', 'left');
					$("a[data-act*=set-font-align]").css("background", "none");
					$(this).css("background", "rgba(32,160,255,0.6)");
				});
				return code;
			}

			var _font_align_center = function () {
				var code = '<li class="operation-item" data-tips="居中对齐">' +
					'	<a href="javascript:void(0)" data-act="set-font-align-center"><i class="fa fa-align-center"></i></a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-font-align-center]', 'click', function (event) {
					that.ueditor.execCommand('justify', 'center');
					$("a[data-act*=set-font-align]").css("background", "none");
					$(this).css("background", "rgba(32,160,255,0.6)");
				});
				return code;
			}

			var _font_align_right = function () {
				var code = '<li class="operation-item" data-tips="右对齐">' +
					'	<a href="javascript:void(0)" data-act="set-font-align-right"><i class="fa fa-align-right"></i></a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-font-align-right]', 'click', function (event) {
					that.ueditor.execCommand('justify', 'right');
					$("a[data-act*=set-font-align]").css("background", "none");
					$(this).css("background", "rgba(32,160,255,0.6)");
				});
				return code;
			}

			var _font_align_justify = function () {
				var code = '<li class="operation-item" data-tips="两端对齐">' +
					'	<a href="javascript:void(0)" data-act="set-font-align-justify"><i class="fa fa-align-justify"></i></a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-font-align-justify]', 'click', function (event) {
					that.ueditor.execCommand('justify', 'justify');
					$("a[data-act*=set-font-align]").css("background", "none");
					$(this).css("background", "rgba(32,160,255,0.6)");
				});
				return code;
			}

			// 加粗
			var _font_bold = function () {
				var code = '<li class="operation-item" data-tips="选中后,设置字体加粗">' +
					'	<a href="javascript:void(0)" data-act="set-font-bold"><i class="fa fa-bold"></i></a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-font-bold]', 'click', function (event) {
					that.ueditor.execCommand('bold');
					if (getcurryStyle(that.ueditor.selection.getStart()).fontWeight == "bold" || getcurryStyle(that.ueditor.selection.getStart()).fontWeight > 400) {
						$(this).css("background", "rgba(32,160,255,0.6)");
					} else {
						$(this).removeAttr('style');
					}
				});
				return code;
			}

			// 斜体
			var _font_italic = function () {
				var code = '<li class="operation-item" data-tips="选中后,设置斜体字">' +
					'	<a href="javascript:void(0)" data-act="set-font-italic"><i class="fa fa-italic"></i></a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-font-italic]', 'click', function (event) {
					that.ueditor.execCommand('italic');
					if (getcurryStyle(that.ueditor.selection.getStart()).fontStyle == "italic") {
						$(this).css("background", "rgba(32,160,255,0.6)");
					} else {
						$(this).removeAttr('style');
					}
				});
				return code;
			}

			// 下划线
			var _font_underline = function () {
				var code = '<li class="operation-item" data-tips="选中后,设置下划线">' +
					'	<a href="javascript:void(0)" data-act="set-font-underline"><i class="fa fa-underline"></i></a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-font-underline]', 'click', function (event) {
					that.ueditor.execCommand('underline');
					var textDecoration = getcurryStyle(that.ueditor.selection.getStart()).textDecoration == "none" ? $(that.ueditor.selection.getStart()).parents("span:first").css("text-decoration") : getcurryStyle(that.ueditor.selection.getStart()).textDecoration;
					if (textDecoration == "underline") {
						$(".operation-item a[data-act=set-font-strikethrough").removeAttr('style');
						$(this).css("background", "rgba(32,160,255,0.6)");
					} else {
						$(this).removeAttr('style');
					}
				});
				return code;
			}

			// 删除线
			var _font_strikethrough = function () {
				var code = '<li class="operation-item" data-tips="选中后,设置删除线">' +
					'	<a href="javascript:void(0)" data-act="set-font-strikethrough"><i class="fa fa-strikethrough"></i></a>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-font-strikethrough]', 'click', function (event) {
					that.ueditor.execCommand('strikethrough');
					var textDecoration = getcurryStyle(that.ueditor.selection.getStart()).textDecoration == "none" ? $(that.ueditor.selection.getStart()).parents("span:first").css("text-decoration") : getcurryStyle(that.ueditor.selection.getStart()).textDecoration;
					if (textDecoration == "line-through") {
						$(".operation-item a[data-act=set-font-underline").removeAttr('style');
						$(this).css("background", "rgba(32,160,255,0.6)");
					} else {
						$(this).removeAttr('style');
					}
				});
				return code;
			}

			// 行间距
			var _font_set_lineheight = function () {
				var code = '<li class="operation-item"  data-tips="设置行间距">' +
					'	<a href="javascript:void(0)" data-act="set-font-line-height">行间距</a>' +
					'	<menu class="set-font-line-height">' +
					'		<li>' +
					'			<input type="number" id="setLineHeight" />' +
					'			<em class="company">倍</em>' +
					'		</li>' +
					'	</menu>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-font-line-height]', 'click', function (event) {
					if (that.$toolsBar_wrapper.find(".set-font-line-height").is(":hidden")) {
						that.$toolsBar_wrapper.find(".set-font-line-height").show();
					} else {
						that.$toolsBar_wrapper.find(".set-font-line-height").hide();
					}
				});
				that.$toolsBar_wrapper.delegate('#setLineHeight', 'keyup', function (event) {
					if (event.keyCode === 13) {
						that.ueditor.execCommand('lineheight', $(this).val());
						that.$toolsBar_wrapper.find(".set-font-line-height").hide();
					}
				});

				// that.$toolsBar_wrapper.delegate('#setLineHeight', 'blur', function(event) {
				//     that.ueditor.execCommand('lineheight', $(this).val());
				//     that.$toolsBar_wrapper.find(".set-font-line-height").hide();
				// });

				return code;
			};

			// ---------------------- 关于图片的操作 ----------------------

			// 图片宽度
			var _image_width = function () {
				var code = '<li class="operation-item" data-tips="设置图片宽度">' +
					'	<a href="javascript:void(0)" data-act="set-imgwidth">宽度</a>' +
					'	<menu class="set-imgwidth" style="height:42px;">' +
					'		<li>' +
					'			<span class="prop-name">宽度</span>' +
					'			<div class="fill-item"><input class="bubble-slider" type="number" min="0" max="640" data-color="#fff" value="100"></div>' +
					'			<input type="number" class="input-val-small" id="imgwidth">' +
					'		</li>' +
					'	</menu>' +
					'</li>';
				that.$toolsBar_wrapper.delegate('[data-act=set-imgwidth]', 'click', function (event) {
					if (that.$toolsBar_wrapper.find("menu[class=set-imgwidth]").is(":hidden")) {
						that.$toolsBar_wrapper.find("menu[class=set-imgwidth]").show();
						that.$toolsBar_wrapper.find("menu[class=set-all-color]").hide();
						that.$toolsBar_wrapper.find(".choose-insert-row").hide();
						that.$toolsBar_wrapper.find(".set-image-border").hide();
						if (that.$toolsBar_wrapper.find(".bubble-slider-wrap").size() <= 0) {
							that.$toolsBar_wrapper.find(".bubble-slider").each(function (index, el) {
								$(this).bubbleSlider();
							});
						}
						// 设置默认值
						setDefaultValue();
					} else {
						that.$toolsBar_wrapper.find("menu[class=set-imgwidth]").hide();
						return false;
					}

					that.$toolsBar_wrapper.find(".bubble-slider-thumb").mousedown(function (event) {
						that.$toolsBar_wrapper.find(".bubble-slider-thumb").mousemove(function (event) {
							var val = $(this).parents(".fill-item").find(".bubble-slider").val();
							$(this).parents(".fill-item").siblings("input").val(val);
							var act = $(this).parents("li").data("act");
							setStyle(val);
						});
						$(this).mouseup(function (event) {
							$(this).unbind("mousemove");
						});
					});

					that.$toolsBar_wrapper.find("menu.set-imgwidth").find("input").keyup(function (event) {
						if (event.keyCode === 13) {
							var act = $(this).parents("li").data("act");
							setStyle($(this).val());
						}
					});

					that.$toolsBar_wrapper.find("menu.set-imgwidth").find("input").blur(function (event) {
						var act = $(this).parents("li").data("act");
						setStyle($(this).val());
					});
				});

				function setDefaultValue() {
					that.$toolsBar_wrapper.find("menu[class=set-imgwidth]").find("li").each(function (index, el) {
						var val = that.material.css("width");
						// 处理滑动条
						var bubbleSlider = that.$toolsBar_wrapper.find("menu[class=set-imgwidth]").find("li").find(".bubble-slider-wrap");
						if (bubbleSlider.size() > 0) {
							bubbleSlider.remove();
							that.$toolsBar_wrapper.find("menu[class=set-imgwidth]").find("li").find(".fill-item").find("input").attr("value", val).bubbleSlider();
						}
						that.$toolsBar_wrapper.find("menu[class=set-imgwidth]").find("li").find("input").val(parseInt(val));
					});
				}

				function setStyle(val) {
					that.material.css({
						width: val + "px"
					});
					that.material.parent("section").css({
						width: val + "px"
					});
				}
				return code;
			};

			// 图片边框
			var _image_border = function () {

				var code = '<li class="operation-item" data-tips="设置图片边框">' +
					'	<a href="javascript:void(0)" data-act="set-image-border">边框&nbsp;&nbsp;<i class="fa fa-caret-down"></i></a>' +
					'	<menu class="set-image-border">' +
					'		<li>' +
					'			<select name="border-direction">' +
					'				<option value="border" selected="selected">全部</option>' +
					'				<option value="border-top">上边</option>' +
					'				<option value="border-left">左边</option>' +
					'				<option value="border-right">右边</option>' +
					'				<option value="border-bottom">下边</option>' +
					'			</select>' +
					'		</li>' +
					'		<li>' +
					'			<span class="prop-name">样式</span>' +
					' 			<div class="fill-item">' +
					'				<select name="border-style">' +
					'					<option label="无边框" value="none" selected="selected">无边框</option>' +
					'					<option label="点状" value="dotted">点状</option>' +
					'					<option label="虚线" value="dashed">虚线</option>' +
					'					<option label="实线" value="solid">实线</option>' +
					'					<option label="双线" value="double">双线</option>' +
					'					<option label="3D凹槽" value="inset">3D凹槽</option>' +
					'					<option label="3D垄状" value="ridge">3D垄状</option>' +
					'					<option label="3D内嵌" value="inset">3D内嵌</option>' +
					'					<option label="3D外嵌" value="outset">3D外嵌</option>' +
					'				</select>' +
					' 			</div>' +
					'		</li>' +
					'		<li>' +
					'			<span class="prop-name">尺寸</span>' +
					' 			<div class="fill-item">' +
					'				<input type="number" class="input-val-big" name="border-size" />' +
					' 			</div>' +
					'		</li>' +
					'		<li>' +
					'			<span class="prop-name">弧度</span>' +
					' 			<div class="fill-item">' +
					'				<input type="number" class="input-val-big" name="set-image-border-radius" />' +
					' 				<select id="set-image-border-radius-unit">' +
					' 					<option value="percent" selected="selected">%</option>' +
					' 					<option value="px">像素</option>' +
					'				</select>' +
					' 			</div>' +
					'		</li>' +
					'		<li>' +
					'			<span class="prop-name">颜色</span>' +
					' 			<div class="fill-item">' +
					'				<span class="colorPicker-alone-image-border-color"></span>' +
					' 			</div>' +
					'		</li>' +
					'	</menu>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-image-border]', 'click', function (event) {

					if (that.$toolsBar_wrapper.find(".set-image-border").is(":hidden")) {
						that.$toolsBar_wrapper.find(".set-image-border").show();
						// 设置下拉菜单的高度
						that.setMenuHeight("set-image-border");
					} else {
						that.$toolsBar_wrapper.find(".set-image-border").hide();
					}
				});

				that.$toolsBar_wrapper.delegate('[name="border-style"]', 'change', function (event) {

					var border_direction = that.$toolsBar_wrapper.find("[name=border-direction]").val();
					var border_width = that.$toolsBar_wrapper.find("[name=border-size]").val();

					if (border_width && border_width > 0) {
						// var style_txt = border_direction+" : "+border_width+"px "+$(this).val()+";";
						that.material.css(border_direction, border_width + "px " + $(this).val());
					}
				});

				that.$toolsBar_wrapper.delegate('[name="border-size"]', 'blur', function (event) {

					var border_direction = that.$toolsBar_wrapper.find("[name=border-direction]").val();
					var border_width = $(this).val();

					if (border_width && border_width > 0) {
						// var style_txt = border_direction+" : "+border_width+"px "+$(this).val()+";";
						that.material.css(border_direction, border_width + "px " + that.$toolsBar_wrapper.find("[name=border-style]").val());
					}
				});

				that.$toolsBar_wrapper.delegate('[name="border-size"]', 'keyup', function (event) {

					if (event.keyCode === 13) {
						var border_direction = that.$toolsBar_wrapper.find("[name=border-direction]").val();
						var border_width = $(this).val();

						if (border_width && border_width > 0) {
							// var style_txt = border_direction+" : "+border_width+"px "+$(this).val()+";";
							that.material.css(border_direction, border_width + "px " + that.$toolsBar_wrapper.find("[name=border-style]").val());
						}
					}
				});

				that.$toolsBar_wrapper.delegate('[name=set-image-border-radius]', 'blur', function (event) {

					var unit = that.$toolsBar_wrapper.find("#set-image-border-radius-unit").val();

					if (unit === "px") {
						that.material.css("border-radius", $(this).val() + "px");
					} else {
						that.material.css("border-radius", $(this).val() + "%");
					}
				});

				that.$toolsBar_wrapper.delegate('[name=set-image-border-radius]', 'keyup', function (event) {

					if (event.keyCode === 13) {
						var unit = that.$toolsBar_wrapper.find("#set-image-border-radius-unit").val();

						if (unit === "px") {
							that.material.css("border-radius", $(this).val() + "px");
						} else {
							that.material.css("border-radius", $(this).val() + "%");
						}
					}
				});

				return code;
			};

			// 图片阴影
			var _image_shadow = function () {
				var code = '<li class="operation-item" data-tips="设置图片阴影">' +
					'	<a href="javascript:void(0)" data-act="set-image-shadow">阴影&nbsp;&nbsp;<i class="fa fa-caret-down"></i></a>' +
					'	<menu class="set-image-shadow">' +
					'		<li>' +
					'			<span class="prop-name">大小</span>' +
					' 			<div class="fill-item">' +
					'				<input type="number" class="input-val-big" name="shadow-size" />' +
					' 			</div>' +
					'			<em class="company">像素</em>' +
					'		</li>' +
					'		<li>' +
					'			<span class="prop-name">模糊</span>' +
					' 			<div class="fill-item">' +
					'				<input type="number" class="input-val-big" name="shadow-vague" />' +
					' 			</div>' +
					'			<em class="company">像素</em>' +
					'		</li>' +
					'		<li>' +
					'			<span class="prop-name">方向</span>' +
					'			<div class="fill-item" style="width: 100px;"><input class="bubble-slider" type="number" min="0" max="360" data-color="#fff" value="0"></div>' +
					'			&nbsp;<input type="number" class="input-val-small" id="direction">' +
					'		</li>' +
					'		<li>' +
					'			<span class="prop-name">颜色</span>' +
					' 			<div class="fill-item">' +
					'				<span class="colorPicker-alone-image-border-shadow"></span>' +
					' 			</div>' +
					'		</li>' +
					'	</menu>' +
					'</li>';

				that.$toolsBar_wrapper.delegate('[data-act=set-image-shadow]', 'click', function (event) {

					if (that.$toolsBar_wrapper.find(".set-image-shadow").is(":hidden")) {
						that.$toolsBar_wrapper.find(".set-image-shadow").show();
						// 设置下拉菜单的高度
						that.setMenuHeight("set-image-shadow");

						if (that.$toolsBar_wrapper.find(".bubble-slider-wrap").size() <= 0) {
							that.$toolsBar_wrapper.find(".bubble-slider").each(function (index, el) {
								$(this).bubbleSlider();
							});

							that.$toolsBar_wrapper.find(".bubble-slider-thumb").mousedown(function (event) {
								that.$toolsBar_wrapper.find(".bubble-slider-thumb").mousemove(function (event) {
									var val = $(this).parents(".fill-item").find(".bubble-slider").val();
									$(this).parents(".fill-item").siblings("input").val(val);
									var act = $(this).parents("li").data("act");
								});
								$(this).mouseup(function (event) {
									$(this).unbind("mousemove");
								});
							});
						}
					} else {
						that.$toolsBar_wrapper.find(".set-image-shadow").hide();
					}
				});

				return code;
			};

			return {
				"drop": _drop,
				"del": _del,
				// "copy": _copy,
				"selec": _select,
				"insert_row": _insert_row,
				"set_color": _set_color,
				"set_style": _set_style,
				"clear_style": _clear_style,
				"reset": _reset,

				"font_size": _font_size,
				"font_color": _font_color,
				"font_bg_color": _font_bg_color,
				"font_align_left": _font_align_left,
				"font_align_center": _font_align_center,
				"font_align_right": _font_align_right,
				"font_align_justify": _font_align_justify,
				"font_bold": _font_bold,
				"font_italic": _font_italic,
				"font_underline": _font_underline,
				"font_strikethrough": _font_strikethrough,
				"font_set_lineheight": _font_set_lineheight,
				"material_set_up": _material_set_up,
				"material_set_down": _material_set_down,
				"image_width": _image_width,
				"image_border": _image_border,
				"image_shadow": _image_shadow,
			};
		};

		// 向页面部署通用素材工具条
		ToolsBar.prototype.randerBaseToolsBar = function () {

			var that = this;
			that.$toolsBar_wrapper.prepend($(that.toolsBar_code).addClass("base-tools"));
			that.$toolsBar_wrapper.find(".base-tools").prepend(
				that.operationItems().drop() +
				that.operationItems().del() +
				// that.operationItems().copy() +
				that.operationItems().selec() +
				'<li class="operation-split"></li>' +
				that.operationItems().insert_row() +
				'<li class="operation-split"></li>' +
				that.operationItems().set_color() +
				'<li class="operation-split"></li>' +
				that.operationItems().set_style() +
				'<li class="operation-split"></li>' +
				that.operationItems().clear_style() +
				'<li class="operation-split"></li>' +
				that.operationItems().material_set_up() +
				that.operationItems().material_set_down()
			);
			if (localStorage.getItem("material_top") && localStorage.getItem("material_left")) {
				that.$toolsBar_wrapper.find(".base-tools").prepend(
					that.operationItems().reset()
				);
			}

			that.$toolsBar_wrapper.find(".operation-item").each(function (index, el) {
				if ($(this).children().size() <= 0) {
					$(this).next(".operation-split").remove();
					$(this).remove();
				}
			});
		};

		// 判断素材类型, 根据类型不同加载不同的工具条
		ToolsBar.prototype.randerSeniorToolsBar = function () {

			var that = this;

			fontToolsBar();

			imageToolsBar();

			function imageToolsBar() {

				var isHasImage = false;

				// 判断素材中是否只包含图片
				if (that.material.get(0).tagName.toLowerCase() === "img") {
					isHasImage = true;
				}

				if (!isHasImage) {
					return false;
				}

				that.ueditor.selection.getRange().selectNode(that.material.get(0));

				that.$toolsBar_wrapper.append($(that.toolsBar_code).addClass("senior-image-tools"));
				that.$toolsBar_wrapper.find(".senior-image-tools").prepend(
					that.operationItems().image_width() +
					'<li class="operation-split"></li>' +
					that.operationItems().image_border()
				);
			}

			function fontToolsBar() {
				var isHasText = false;
				// 判断素材类型, 文字(包含)
				for (var i = 0; i < that.material_nodes.length; i++) {
					var nodeType = that.material_nodes[i].childNodes[0] ? that.material_nodes[i].childNodes[0].nodeType : -1
					if (nodeType == 3) {
						// 如果有文本节点, 则跳出循环, 加载文字工具条
						isHasText = true;
						break;
					}
				}

				if (!isHasText) {
					return false;
				}

				that.$toolsBar_wrapper.append($(that.toolsBar_code).addClass("senior-text-tools"));
				that.$toolsBar_wrapper.find(".senior-text-tools").prepend(
					that.operationItems().font_size() +
					'<li class="operation-split"></li>' +
					that.operationItems().font_align_left() +
					that.operationItems().font_align_center() +
					that.operationItems().font_align_right() +
					that.operationItems().font_align_justify() +
					'<li class="operation-split"></li>' +
					that.operationItems().font_bold() +
					that.operationItems().font_italic() +
					that.operationItems().font_strikethrough() +
					that.operationItems().font_underline() +
					'<li class="operation-split"></li>' +
					that.operationItems().font_color() +
					'<li class="operation-split"></li>' +
					that.operationItems().font_bg_color() +
					'<li class="operation-split"></li>' +
					that.operationItems().font_set_lineheight()
				);
			}

			that.$toolsBar_wrapper.find(".operation-item").each(function (index, el) {
				if ($(this).children().size() <= 0) {
					$(this).next(".operation-split").remove();
					$(this).remove();
				}
			});
		};

		// 向页面部署初始化代码
		ToolsBar.prototype.randerInitToolsBar = function () {

			$(".material-operation-tools").remove();
			// $(ue.body).find(".checkSelected").removeClass("checkSelected");
			this.material.attr("data-tools-id", this.id);
			$("body").prepend(this.toolsBar_wrapper_code);
			this.$toolsBar_wrapper = $("body").find("#" + this.id);
		};

		// 调整工具条的位置
		ToolsBar.prototype.setToolsPosition = function () {

			var that = this;
			// 控制位置
			var left = (that.material.offset().left * 1) + ($(that.ueditor.iframe).offset().left * 1) - 5;
			// 剩余高度, 判断够不够显示工具条
			var top = 0;
			var residue_height = ($(that.ueditor.iframe).height() - (that.material.offset().top + that.material.height())) + $($(that.ueditor.iframe).get(0).contentWindow).scrollTop();

			if (residue_height < 240) {
				// 不够显示, 则显示在素材上方

				top = (that.material.offset().top * 1) - $($(that.ueditor.iframe).get(0).contentWindow).scrollTop() + 100 + $(that.ueditor.container).offset().top * 1;


				if (that.$toolsBar_wrapper.find(".tools-bar").size() > 0) {
					top -= (that.$toolsBar_wrapper.find(".tools-bar").size() - 1) * 50;
				}
			} else {
				// 显示在素材下方
				top = ((that.material.offset().top * 1) + that.material.height() + 60) - $($(that.ueditor.iframe).get(0).contentWindow).scrollTop() + 90 + $(that.ueditor.container).offset().top * 1;
			}

			if (top < 0) {
				top = ($(that.ueditor.iframe).offset().top * 1);
			} else if (top < 100) {
				top = ($(that.ueditor.iframe).offset().top * 1);
			}

			if (left < 0) {
				left = ($(that.ueditor.iframe).offset().left * 1);
			}
			localStorage.getItem("material_top") ? top = localStorage.getItem("material_top") : "";
			localStorage.getItem("material_left") ? left = localStorage.getItem("material_left") : "";

			that.$toolsBar_wrapper.css({
				left: left + "px",
				top: top + "px"
			}).show();
			if (left > $(window).width() - $('menu.material-operation-tools').width()) {
				that.$toolsBar_wrapper.css("left", $(window).width() - $('menu.material-operation-tools').width());
			}
			var tools_bar_width = [];
			that.$toolsBar_wrapper.find(".tools-bar").each(function (index, el) {
				tools_bar_width.push($(this).width());
			});
			tools_bar_width.sort(function (a, b) {
				return b - a;
			});
			that.$toolsBar_wrapper.css({
				width: ((tools_bar_width[0] * 1) + 50) + "px"
			});
		};

		// 加载一些特殊事件
		ToolsBar.prototype.loadSpecialEvent = function () {

			var that = this;

			// 初始化颜色选择器
			that.$toolsBar_wrapper.find(".colorPicker-alone").each(function (index, el) {
				var $colorPicker = $(this);
				$colorPicker.colpick({
					layout: "rgbhex",
					color: '#' + ($colorPicker.data("colorval")).toString().colorHex(),
					onChange: function (hsb, hex, rgb, el, bySetColor) {
						$colorPicker.css('backgroundColor', '#' + hex);
						if ($colorPicker.data("colorval").toString().indexOf(",") < 0) {
							setMaterialColor(hex, $colorPicker.attr("data-colorval").toString(), $colorPicker);
						} else {
							setMaterialColor(rgb.r + "," + rgb.g + "," + rgb.b, $colorPicker.attr("data-colorval").toString(), $colorPicker);
						}
					},
					onSubmit: function () {
						$colorPicker.colpickHide();
					}
				});
			});

			that.$toolsBar_wrapper.find(".colorPicker-alone-font-color").each(function (index, el) {
				var $colorPicker = $(this);
				var color = getcurryStyle($(".colorPicker-alone-font-color")[0]).backgroundColor == "rgba(0, 0, 0, 0)" ? "#ffffff" : getcurryStyle($(".colorPicker-alone-font-color")[0]).backgroundColor;
				// color.colorHex();
				$colorPicker.colpick({
					layout: "rgbhex",
					color: '#' + color.colorHex(),
					onChange: function (hsb, hex, rgb, el, bySetColor) {
						$(".colorPicker-alone-font-color").css({
							"background-color": '#' + hex
						})
						$colorPicker.css('backgroundColor', '#' + hex);
						that.ueditor.execCommand('forecolor', '#' + hex);
					},
					onSubmit: function () {
						$colorPicker.colpickHide();
						$(".colpick").hide();
					}
				});
			});

			that.$toolsBar_wrapper.find(".colorPicker-alone-font-bg-color").each(function (index, el) {
				var $colorPicker = $(this);
				var color = getcurryStyle($(".colorPicker-alone-font-bg-color")[0]).backgroundColor == "rgba(0, 0, 0, 0)" ? "#ffffff" : getcurryStyle($(".colorPicker-alone-font-bg-color")[0]).backgroundColor;

				$colorPicker.colpick({
					layout: "rgbhex",
					color: '#' + color.colorHex(),
					onChange: function (hsb, hex, rgb, el, bySetColor) {
						$(".colorPicker-alone-font-bg-color").css({
							"background-color": '#' + hex,
							"background-image": "none"
						})
						$colorPicker.css('backgroundColor', '#' + hex);
						that.ueditor.execCommand('backcolor', '#' + hex);
					},
					onSubmit: function () {
						$colorPicker.colpickHide();
						$(".colpick").hide();
					}
				});
			});

			that.$toolsBar_wrapper.find(".colorPicker-alone-image-border-color").each(function (index, el) {
				var $colorPicker = $(this);
				$colorPicker.colpick({
					layout: "rgbhex",
					color: '#00000',
					onShow: function (colpkr) {
						var winH = $(window).height();
						$(colpkr).show();
						if (winH - ($(colpkr).height()) < $(colpkr).position().top) {
							$(colpkr).css("top", (winH - ($(colpkr).height() + 10)));
						}
					},
					onChange: function (hsb, hex, rgb, el, bySetColor) {
						$colorPicker.css('backgroundColor', '#' + hex);
						that.material.css("border-color", "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")");
					},
					onSubmit: function () {
						$colorPicker.colpickHide();
						$(".colpick").hide();
					},

				});
			});


			// 设定素材的主题颜色
			function setMaterialColor(colorVal, mark, $colorPicker) {
				for (var i = 0; i < that.material_nodes.length; i++) {

					var style_code = $(that.material_nodes[i]).attr("style") ? $(that.material_nodes[i]).attr("style") : "";
					var style_code_trim = style_code.replace(/\s/g, "");
					var _styles = style_code_trim.split(";");

					for (var j = 0; j < _styles.length; j++) {
						var _style_item = _styles[j].split(":");
						var _style_val = _style_item[1];

						if (_style_item[0].indexOf("border") >= 0) {

							if (mark.split(",").length >= 3) {
								var _index_1 = _style_val.indexOf("rgb");
								var _index_2 = _style_val.indexOf(")", _index_1);
								_style_val = _style_val.substring(_index_1, _index_2 + 1);
							} else {
								var _index_1 = _style_val.indexOf("#");
								_style_val = _style_val.substring(_index_1);
							}
						}
						if (_style_val && _style_val.indexOf(mark) >= 0) {
							var str = _style_val.replace("\(", "\\(").replace("\)", "\\)").replace(/\s/g, "");
							str = str.split(",").join(",[\\S\\s]*?");
							var reg = new RegExp(str, "g");
							var new_style = "";
							if (colorVal.split(",").length > 0 && colorVal.split(",").length < 4 && colorVal.indexOf(",") >= 0) {
								new_style = style_code.replace(reg, "rgb(" + colorVal + ")");
							} else if (colorVal.toString().split("").length === 6) {
								new_style = style_code.replace(reg, "#" + colorVal);
							} else {
								new_style = style_code.replace(reg, "rgba(" + colorVal + ")");
							}

							$colorPicker.attr("data-colorval", colorVal);
							$(that.material_nodes[i]).removeAttr("style").attr("style", new_style);
						}
					}
				}
			}

			// 气泡提示框
			that.bubbleTips();

			// 复制
			// that.partCopy();
		};

		// 气泡提示框
		ToolsBar.prototype.bubbleTips = function () {

			var that = this;

			that.$toolsBar_wrapper.find("li.operation-item").hover(function () {
				showTips($(this));
			}, function () {
				hideTips($(this));
			});

			// 显示提示
			function showTips(actionItem) {

				if (actionItem.find(".bubbleTips").size() > 0) {

					actionItem.find(".bubbleTips").show();
				} else {

					var tip_txt = actionItem.data("tips");

					if (!tip_txt) {
						return false;
					}

					var code = '';
					code += '<div class="bubbleTips"> <em>' + tip_txt + '</em> <i class="fa fa-caret-down"></i></div>';

					actionItem.prepend(code);
					var width = tip_txt.split("").length * 14;
					if (tip_txt.indexOf(",") >= 0) {
						width -= 6;
					}

					actionItem.find(".bubbleTips").find("em").css({
						width: width + "px"
					});

					actionItem.find(".bubbleTips").css({
						left: (actionItem.width() / 2) - ((width + 20) / 2) + "px"
					});

					actionItem.find(".bubbleTips").find("i").css({
						left: (actionItem.find(".bubbleTips").width() / 2) + 2 + "px"
					});
				}
			}

			// 隐藏提示
			function hideTips(actionItem) {
				actionItem.find(".bubbleTips").hide();
			}
		};

		//复制功能
		// ToolsBar.prototype.partCopy = function() {
		//     var that = this;
		//     var client2 = new ZeroClipboard(document.getElementById("partcopy"));
		//     client2.on('copy', function(event) {
		//         var pNode = $(that.ueditor.document).find(".KolEditor-select").parent(".KolEditor");
		//         var html = $.partwechat._init(that.ueditor, pNode, true);
		//         event.clipboardData.setData("text/html", html);
		//         layui.use('layer', function() {
		//             var layer = layui.layer;
		//             layer.msg("复制成功");
		//         });
		//     })
		// }

		// 设置下拉菜单的高度
		ToolsBar.prototype.setMenuHeight = function (className) {

			var that = this;

			if ($(that.ueditor.container).height() - (that.$toolsBar_wrapper.height() + (that.$toolsBar_wrapper.offset().top - $(that.ueditor.container).offset().top)) > 350) {
				return false;
			}

			that.$toolsBar_wrapper.find("menu." + className).css({
				height: $(that.ueditor.container).height() - (that.$toolsBar_wrapper.height() + (that.$toolsBar_wrapper.offset().top - $(that.ueditor.container).offset().top)) - 20 + "px",
				"overflow-y": "auto"
			});
		};

		//鼠标更改选区,监听color bgcolor fontsize的变化,生成对象
		ToolsBar.prototype.enevtListener = function () {
			var eventSelection = this.ueditor.selection.getStart();
			var attribute = {};
			var fontSize = getcurryStyle(eventSelection).fontSize;
			var color = getcurryStyle(eventSelection).color;
			var backgroundColor = getcurryStyle(eventSelection).backgroundColor;
			var justify = getcurryStyle(eventSelection).textAlign;
			var fontStyle = getcurryStyle(eventSelection).fontStyle;
			var fontWeight = getcurryStyle(eventSelection).fontWeight;
			var textDecoration = getcurryStyle(eventSelection).textDecoration == "none" ? $(eventSelection).parents("span:first").css("text-decoration") : getcurryStyle(eventSelection).textDecoration;
			var lineHeight = getcurryStyle(eventSelection).lineHeight;
			attribute = {
				fontSize: fontSize,
				color: color,
				backgroundColor: backgroundColor,
				textAlign: justify,
				fontStyle: fontStyle,
				fontWeight: fontWeight,
				textDecoration: textDecoration,
				lineHeight: lineHeight
			};
			this.writeBack(attribute);
			// var ohead = $(document.getElementById("ueditor_0").contentWindow.document).find("head");
			// document.getElementsByTagName('head')[0].innerHTML=document.getElementsByTagName('head')[0].innerHTML+"js脚本";
			// var iframe = document.frames ? document.frames["ueditor_0"] : document.getElementById("ueditor_0");
			// var ifWin = iframe.contentWindow || iframe;
			// console.log(ifWin.getSelection().toString());
			//  var ele = this.ueditor.domUtils.createElement( document, 'style', {
			// 	id: 'test'
			// } );
			// ohead.append("<style>.transparentSelection::selection {background:maroon; color:#fff;} .transparentSelection::-moz-selection {background:maroon; color: #fff;}.transparentSelection::-webkit-selection {background: maroon;color: #fff;}</style > ");
			// $(eventSelection).addClass("transparentSelection");
		}

		//将监听到的信息反写到bar
		ToolsBar.prototype.writeBack = function (attribute) {
			//字号
			$("#setFontSize").val(parseInt(attribute.fontSize));
			//对齐方式
			if (attribute.textAlign != "left" && attribute.textAlign != "right" && attribute.textAlign != "center" && attribute.textAlign != "justify") {
				attribute.textAlign = "left";
			}
			$(".operation-item a[data-act=set-font-align-" + attribute.textAlign + "]").css("background", "rgba(32,160,255,0.6)");
			//是否斜体
			if (attribute.fontStyle == "italic") {
				$(".operation-item a[data-act=set-font-italic]").css("background", "rgba(32,160,255,0.6)");
			}
			//划线
			if (attribute.textDecoration == "line-through") {
				$(".operation-item a[data-act=set-font-strikethrough").css("background", "rgba(32,160,255,0.6)");
			} else if (attribute.textDecoration == "underline") {
				$(".operation-item a[data-act=set-font-underline").css("background", "rgba(32,160,255,0.6)");
			}
			//是否粗体
			if (attribute.fontWeight == "bold" || attribute.fontWeight > 400) {
				$(".operation-item a[data-act=set-font-bold]").css("background", "rgba(32,160,255,0.6)");
			}
			//默认字体颜色
			$(".colorPicker-alone-font-color").css({
				"background-color": attribute.color
			});
			//默认背景颜色
			if (attribute.backgroundColor == "rgba(0, 0, 0, 0)") {
				$(".colorPicker-alone-font-bg-color").css({
					"background-color": "transparent",
					"background-image": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==)"
				});
			} else {
				$(".colorPicker-alone-font-bg-color").css({
					"background-color": attribute.backgroundColor
				});
			}
			//行间距
			if (attribute.lineHeight.substr(-2, 2) == "em") {
				var lineHeight = parseFloat(attribute.lineHeight);
			} else if (attribute.lineHeight.substr(-2, 2) == "px") {
				var lineHeight = parseFloat(attribute.lineHeight) / parseFloat(attribute.fontSize);
			} else if (attribute.lineHeight.substr(-2, 3) == "rem") {
				var lineHeight = parseFloat(attribute.lineHeight) / 16;
			} else {
				var lineHeight = parseFloat(attribute.lineHeight);
			}
			$("#setLineHeight").val(lineHeight);
		}

		// ue: ueditor编辑器对象
		$.fn.materialToolsBar = function (ue) {
			var toolsBar = new ToolsBar();
			toolsBar.ueditor = ue;
			toolsBar.material = $(this);

			toolsBar.init();
		}

		// 工具函数
		function tools_fun() {

			return {
				// 获得随机数
				GetRandomNum: function (Min, Max) {
					var Range = Max - Min;
					var Rand = Math.random();
					return (Min + Math.round(Rand * Range));
				},

				array_unique: function (array) {
					var n = {},
						r = []; //n为hash表，r为临时数组
					for (var i = 0; i < array.length; i++) { //遍历当前数组
						if (!n[array[i]]) { //如果hash表中没有当前项
							n[array[i]] = true; //存入hash表
							r.push(array[i]); //把当前数组的当前项push到临时数组里面
						}
					}
					return r;
				}
			}
		};

		function getcurryStyle(oEl) {
			var oStyle = oEl.currentStyle ? oEl.currentStyle : window.getComputedStyle(oEl, false);
			return oStyle;
		}

		//十六进制颜色值域RGB格式颜色值之间的相互转换
		//-------------------------------------
		//十六进制颜色值的正则表达式
		var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
		/*RGB颜色转换为16进制*/
		String.prototype.colorHex = function () {
			var that = this;
			if (that.indexOf(",") >= 0) {
				var aColor = that.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
				var strHex = "";
				for (var i = 0; i < aColor.length; i++) {
					var hex = Number(aColor[i]).toString(16);
					if (hex === "0") {
						hex += hex;
					}
					strHex += hex;
				}
				if (strHex.length !== 6) {
					strHex = that;
				}
				return strHex;
			} else if (reg.test(that)) {
				var aNum = that.replace(/#/, "").split("");
				if (aNum.length === 6) {
					return that;
				} else if (aNum.length === 3) {
					var numHex = "#";
					for (var i = 0; i < aNum.length; i += 1) {
						numHex += (aNum[i] + aNum[i]);
					}
					return numHex;
				}
			} else {
				return that;
			}
		};
		//-------------------------------------------------

		/*16进制颜色转为RGB格式*/
		String.prototype.colorRgb = function () {
			var sColor = this.toLowerCase();
			if (sColor && reg.test(sColor)) {
				if (sColor.length === 4) {
					var sColorNew = "#";
					for (var i = 1; i < 4; i += 1) {
						sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
					}
					sColor = sColorNew;
				}
				//处理六位的颜色值
				var sColorChange = [];
				for (var i = 1; i < 7; i += 2) {
					sColorChange.push(parseInt("0x" + sColor.slice(i, i + 2)));
				}
				return "RGB(" + sColorChange.join(",") + ")";
			} else {
				return sColor;
			}
		};
	}

	// colpick插件
	function initcolpick() {
		var colpick = function () {
			var
				tpl = '<div class="colpick"><div class="colpick_color"><div class="colpick_color_overlay1"><div class="colpick_color_overlay2"><div class="colpick_selector_outer"><div class="colpick_selector_inner"></div></div></div></div></div><div class="colpick_hue"><div class="colpick_hue_arrs"><div class="colpick_hue_larr"></div><div class="colpick_hue_rarr"></div></div></div><div class="colpick_new_color"></div><div class="colpick_current_color"></div><div class="colpick_hex_field"><div class="colpick_field_letter">#</div><input type="text" maxlength="6" size="6" /></div><div class="colpick_rgb_r colpick_field"><div class="colpick_field_letter">R</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_rgb_g colpick_field"><div class="colpick_field_letter">G</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_rgb_b colpick_field"><div class="colpick_field_letter">B</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_hsx_h colpick_field"><div class="colpick_field_letter">H</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_hsx_s colpick_field"><div class="colpick_field_letter">S</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_hsx_x colpick_field"><div class="colpick_field_letter">B</div><input type="text" maxlength="3" size="3" /><div class="colpick_field_arrs"><div class="colpick_field_uarr"></div><div class="colpick_field_darr"></div></div></div><div class="colpick_submit"></div></div>',
				defaults = {
					showEvent: 'click',
					onShow: function () {},
					onBeforeShow: function () {},
					onHide: function () {},
					onChange: function () {},
					onSubmit: function () {},
					colorScheme: 'light',
					color: '3289c7',
					livePreview: true,
					flat: false,
					layout: 'full',
					submit: 1,
					submitText: 'OK',
					height: 156,
					hsl: false
				},
				//Fill the inputs of the plugin
				fillRGBFields = function (hsx, cal) {
					var rgb = $(cal).data('colpick').hsl ? hslToRgb(hsx) : hsbToRgb(hsx);
					$(cal).data('colpick').fields
						.eq(1).val(rgb.r).end()
						.eq(2).val(rgb.g).end()
						.eq(3).val(rgb.b).end();
				},
				fillHSXFields = function (hsx, cal) {

					$(cal).data('colpick').fields
						.eq(4).val(Math.round(hsx.h)).end()
						.eq(5).val(Math.round(hsx.s)).end()
						.eq(6).val(Math.round(hsx.x)).end();
				},
				fillHexFields = function (hsx, cal) {
					$(cal).data('colpick').fields.eq(0).val($(cal).data('colpick').hsl ? hslToHex(hsx) : hsbToHex(hsx));
				},
				//Set the round selector position
				setSelector = function (hsx, cal) {
					$(cal).data('colpick').selector.css('backgroundColor', '#' + ($(cal).data('colpick').hsl ? hslToHex({
						h: hsx.h,
						s: 100,
						x: 50
					}) : hsbToHex({
						h: hsx.h,
						s: 100,
						x: 100
					})));
					$(cal).data('colpick').selectorIndic.css({
						left: parseInt($(cal).data('colpick').height * hsx.s / 100, 10),
						top: parseInt($(cal).data('colpick').height * (100 - hsx.x) / 100, 10)
					});
				},
				//Set the hue selector position
				setHue = function (hsx, cal) {
					$(cal).data('colpick').hue.css('top', parseInt($(cal).data('colpick').height - $(cal).data('colpick').height * hsx.h / 360, 10));
				},
				//Set current and new colors
				setCurrentColor = function (hsx, cal) {
					$(cal).data('colpick').currentColor.css('backgroundColor', '#' + ($(cal).data('colpick').hsl ? hslToHex(hsx) : hsbToHex(hsx)));
				},
				setNewColor = function (hsx, cal) {
					$(cal).data('colpick').newColor.css('backgroundColor', '#' + ($(cal).data('colpick').hsl ? hslToHex(hsx) : hsbToHex(hsx)));
				},
				//Called when the new color is changed
				change = function (ev) {
					var cal = $(this).parent().parent(),
						col;
					if (this.parentNode.className.indexOf('_hex') > 0) {
						cal.data('colpick').color = col = cal.data('colpick').hsl ? hexToHsl(fixHex(this.value)) : hexToHsb(fixHex(this.value));
						fillRGBFields(col, cal.get(0));
						fillHSXFields(col, cal.get(0));
					} else if (this.parentNode.className.indexOf('_hsx') > 0) {
						cal.data('colpick').color = col = fixHsx({
							h: parseInt(cal.data('colpick').fields.eq(4).val(), 10),
							s: parseInt(cal.data('colpick').fields.eq(5).val(), 10),
							x: parseInt(cal.data('colpick').fields.eq(6).val(), 10)
						});
						fillRGBFields(col, cal.get(0));
						fillHexFields(col, cal.get(0));
					} else {
						var rgb = {
							r: parseInt(cal.data('colpick').fields.eq(1).val(), 10),
							g: parseInt(cal.data('colpick').fields.eq(2).val(), 10),
							b: parseInt(cal.data('colpick').fields.eq(3).val(), 10)
						};
						cal.data('colpick').color = col = cal.data('colpick').hsl ? rgbToHsl(fixRgb(rgb)) : rgbToHsb(fixRgb(rgb));
						fillHexFields(col, cal.get(0));
						fillHSXFields(col, cal.get(0));
					}
					setSelector(col, cal.get(0));
					setHue(col, cal.get(0));
					setNewColor(col, cal.get(0));
					cal.data('colpick').onChange.apply(cal.parent(), [col, cal.data('colpick').hsl ? hslToHex(col) : hsbToHex(col), cal.data('colpick').hsl ? hslToRgb(col) : hsbToRgb(col), cal.data('colpick').el, 0]);
				},
				//Change style on blur and on focus of inputs
				blur = function (ev) {
					$(this).parent().removeClass('colpick_focus');
				},
				focus = function () {
					$(this).parent().parent().data('colpick').fields.parent().removeClass('colpick_focus');
					$(this).parent().addClass('colpick_focus');
				},
				//Increment/decrement arrows functions
				downIncrement = function (ev) {
					ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
					var field = $(this).parent().find('input').focus();
					var current = {
						el: $(this).parent().addClass('colpick_slider'),
						max: this.parentNode.className.indexOf('_hsx_h') > 0 ? 360 : (this.parentNode.className.indexOf('_hsx') > 0 ? 100 : 255),
						y: ev.pageY,
						field: field,
						val: parseInt(field.val(), 10),
						preview: $(this).parent().parent().data('colpick').livePreview
					};
					$(document).mouseup(current, upIncrement);
					$(document).mousemove(current, moveIncrement);
				},
				moveIncrement = function (ev) {
					ev.data.field.val(Math.max(0, Math.min(ev.data.max, parseInt(ev.data.val - ev.pageY + ev.data.y, 10))));
					if (ev.data.preview) {
						change.apply(ev.data.field.get(0), [true]);
					}
					return false;
				},
				upIncrement = function (ev) {
					change.apply(ev.data.field.get(0), [true]);
					ev.data.el.removeClass('colpick_slider').find('input').focus();
					$(document).off('mouseup', upIncrement);
					$(document).off('mousemove', moveIncrement);
					return false;
				},
				//Hue slider functions
				downHue = function (ev) {
					ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
					var current = {
						cal: $(this).parent(),
						y: $(this).offset().top
					};
					$(document).on('mouseup touchend', current, upHue);
					$(document).on('mousemove touchmove', current, moveHue);

					var pageY = ((ev.type == 'touchstart') ? ev.originalEvent.changedTouches[0].pageY : ev.pageY);
					change.apply(
						current.cal.data('colpick')
						.fields.eq(4).val(parseInt(360 * (current.cal.data('colpick').height - (pageY - current.y)) / current.cal.data('colpick').height, 10))
						.get(0),
						[current.cal.data('colpick').livePreview]
					);
					return false;
				},
				moveHue = function (ev) {
					var pageY = ((ev.type == 'touchmove') ? ev.originalEvent.changedTouches[0].pageY : ev.pageY);
					change.apply(
						ev.data.cal.data('colpick')
						.fields.eq(4).val(parseInt(360 * (ev.data.cal.data('colpick').height - Math.max(0, Math.min(ev.data.cal.data('colpick').height, (pageY - ev.data.y)))) / ev.data.cal.data('colpick').height, 10))
						.get(0),
						[ev.data.preview]
					);
					return false;
				},
				upHue = function (ev) {
					//fillRGBFields(ev.data.cal.data('colpick').color, ev.data.cal.get(0));
					//fillHexFields(ev.data.cal.data('colpick').color, ev.data.cal.get(0));
					$(document).off('mouseup touchend', upHue);
					$(document).off('mousemove touchmove', moveHue);
					return false;
				},
				//Color selector functions
				downSelector = function (ev) {
					ev.preventDefault ? ev.preventDefault() : ev.returnValue = false;
					var current = {
						cal: $(this).parent(),
						pos: $(this).offset()
					};
					current.preview = current.cal.data('colpick').livePreview;

					$(document).on('mouseup touchend', current, upSelector);
					$(document).on('mousemove touchmove', current, moveSelector);

					var payeX, pageY;
					if (ev.type == 'touchstart') {
						pageX = ev.originalEvent.changedTouches[0].pageX,
							pageY = ev.originalEvent.changedTouches[0].pageY;
					} else {
						pageX = ev.pageX;
						pageY = ev.pageY;
					}

					change.apply(
						current.cal.data('colpick').fields
						.eq(6).val(parseInt(100 * (current.cal.data('colpick').height - (pageY - current.pos.top)) / current.cal.data('colpick').height, 10)).end()
						.eq(5).val(parseInt(100 * (pageX - current.pos.left) / current.cal.data('colpick').height, 10))
						.get(0),
						[current.preview]
					);
					return false;
				},
				moveSelector = function (ev) {
					var payeX, pageY;
					if (ev.type == 'touchmove') {
						pageX = ev.originalEvent.changedTouches[0].pageX,
							pageY = ev.originalEvent.changedTouches[0].pageY;
					} else {
						pageX = ev.pageX;
						pageY = ev.pageY;
					}

					change.apply(
						ev.data.cal.data('colpick').fields
						.eq(6).val(parseInt(100 * (ev.data.cal.data('colpick').height - Math.max(0, Math.min(ev.data.cal.data('colpick').height, (pageY - ev.data.pos.top)))) / ev.data.cal.data('colpick').height, 10)).end()
						.eq(5).val(parseInt(100 * (Math.max(0, Math.min(ev.data.cal.data('colpick').height, (pageX - ev.data.pos.left)))) / ev.data.cal.data('colpick').height, 10))
						.get(0),
						[ev.data.preview]
					);
					return false;
				},
				upSelector = function (ev) {
					//fillRGBFields(ev.data.cal.data('colpick').color, ev.data.cal.get(0));
					//fillHexFields(ev.data.cal.data('colpick').color, ev.data.cal.get(0));
					$(document).off('mouseup touchend', upSelector);
					$(document).off('mousemove touchmove', moveSelector);
					return false;
				},
				//Submit button
				clickSubmit = function (ev) {
					var cal = $(this).parent();
					var col = cal.data('colpick').color;
					cal.data('colpick').origColor = col;
					setCurrentColor(col, cal.get(0));
					cal.data('colpick').onSubmit(col, cal.data('colpick').hsl ? hslToHex(col) : hsbToHex(col), cal.data('colpick').hsl ? hslToRgb(col) : hsbToRgb(col), cal.data('colpick').el);
				},
				//Show/hide the color picker
				show = function (ev) {
					// Prevent the trigger of any direct parent
					ev.stopPropagation();
					var cal = $('#' + $(this).data('colpickId'));
					cal.data('colpick').onBeforeShow.apply(this, [cal.get(0)]);
					var pos = $(this).offset();
					var top = pos.top + this.offsetHeight;
					var left = pos.left;
					var viewPort = getViewport();
					var calW = cal.width();
					if (left + calW > viewPort.l + viewPort.w) {
						left -= calW;
					}
					cal.css({
						left: left + 'px',
						top: top + 'px'
					});
					if (cal.data('colpick').onShow.apply(this, [cal.get(0)]) != false) {
						cal.show();
					}
					//Hide when user clicks outside
					$('html').mousedown({
						cal: cal
					}, hide);
					cal.mousedown(function (ev) {
						ev.stopPropagation();
					})
				},
				hide = function (ev) {
					if (ev.data.cal.data('colpick').onHide.apply(this, [ev.data.cal.get(0)]) != false) {
						ev.data.cal.hide();
					}
					$('html').off('mousedown', hide);
				},
				getViewport = function () {
					var m = document.compatMode == 'CSS1Compat';
					return {
						l: window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
						w: window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth)
					};
				},
				//Fix the values if the user enters a negative or high value
				fixHsx = function (hsx) {
					return {
						h: Math.min(360, Math.max(0, hsx.h)),
						s: Math.min(100, Math.max(0, hsx.s)),
						x: Math.min(100, Math.max(0, hsx.x))
					};
				},
				fixRgb = function (rgb) {
					return {
						r: Math.min(255, Math.max(0, rgb.r)),
						g: Math.min(255, Math.max(0, rgb.g)),
						b: Math.min(255, Math.max(0, rgb.b))
					};
				},
				fixHex = function (hex) {
					var len = 6 - hex.length;
					if (len > 0) {
						var o = [];
						for (var i = 0; i < len; i++) {
							o.push('0');
						}
						o.push(hex);
						hex = o.join('');
					}
					return hex;
				},
				restoreOriginal = function () {
					var cal = $(this).parent();
					var col = cal.data('colpick').origColor;
					cal.data('colpick').color = col;
					fillRGBFields(col, cal.get(0));
					fillHexFields(col, cal.get(0));
					fillHSXFields(col, cal.get(0));
					setSelector(col, cal.get(0));
					setHue(col, cal.get(0));
					setNewColor(col, cal.get(0));
				};
			return {
				init: function (opt) {
					opt = $.extend({}, defaults, opt || {});
					//Set color
					if (typeof opt.color == 'string') {
						opt.color = opt.hsl ? hexToHsl(opt.color) : hexToHsb(opt.color);
					} else if (opt.color.r != undefined && opt.color.g != undefined && opt.color.b != undefined) {
						opt.color = opt.hsl ? rgbToHsl(opt.color) : rgbToHsb(opt.color);
					} else if (opt.color.h != undefined && opt.color.s != undefined && opt.color.b != undefined) {
						opt.color = opt.hsl ? fixHsl(opt.color) : fixHsb(opt.color);
					} else {
						return this;
					}

					//For each selected DOM element
					return this.each(function () {
						//If the element does not have an ID
						if (!$(this).data('colpickId')) {
							var options = $.extend({}, opt);
							options.origColor = opt.color;
							//Generate and assign a random ID
							var id = 'collorpicker_' + parseInt(Math.random() * 1000);
							$(this).data('colpickId', id);
							//Set the tpl's ID and get the HTML
							var cal = $(tpl).attr('id', id);
							//Add class according to layout
							cal.addClass('colpick_' + options.layout + (options.submit ? '' : ' colpick_' + options.layout + '_ns'));
							//Add class if the color scheme is not default
							if (options.colorScheme != 'light') cal.addClass('colpick_' + options.colorScheme);
							//Add class if HSL is enabled
							if (options.hsl) cal.addClass('colpick_hsl');
							//Setup submit button
							cal.find('div.colpick_submit').html(options.submitText).click(clickSubmit);
							//Setup input fields
							options.fields = cal.find('input').change(change).blur(blur).focus(focus);
							cal.find('div.colpick_field_arrs').mousedown(downIncrement).end().find('div.colpick_current_color').click(restoreOriginal);
							//Setup hue selector
							options.selector = cal.find('div.colpick_color').on('mousedown touchstart', downSelector);
							options.selectorIndic = options.selector.find('div.colpick_selector_outer');
							//Store parts of the plugin
							options.el = this;
							options.hue = cal.find('div.colpick_hue_arrs');
							huebar = options.hue.parent();
							//Paint the hue bar
							var UA = navigator.userAgent.toLowerCase();
							var isIE = navigator.appName === 'Microsoft Internet Explorer';
							var IEver = isIE ? parseFloat(UA.match(/msie ([0-9]{1,}[\.0-9]{0,})/)[1]) : 0;
							var ngIE = (isIE && IEver < 10);
							var stops = ['#ff0000', '#ff0080', '#ff00ff', '#8000ff', '#0000ff', '#0080ff', '#00ffff', '#00ff80', '#00ff00', '#80ff00', '#ffff00', '#ff8000', '#ff0000'];
							if (ngIE) {
								var i, div;
								for (i = 0; i <= 11; i++) {
									div = $('<div></div>').attr('style', 'height:8.333333%; filter:progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr=' + stops[i] + ', endColorstr=' + stops[i + 1] + '); -ms-filter: "progid:DXImageTransform.Microsoft.gradient(GradientType=0,startColorstr=' + stops[i] + ', endColorstr=' + stops[i + 1] + ')";');
									huebar.append(div);
								}
							} else {
								stopList = stops.join(',');
								huebar.attr('style', 'background:-webkit-linear-gradient(top center,' + stopList + '); background:-moz-linear-gradient(top center,' + stopList + '); background:linear-gradient(to bottom,' + stopList + '); ');
							}
							cal.find('div.colpick_hue').on('mousedown touchstart', downHue);
							options.newColor = cal.find('div.colpick_new_color');
							options.currentColor = cal.find('div.colpick_current_color');
							//Store options and fill with default color
							cal.data('colpick', options);
							fillRGBFields(options.color, cal.get(0));
							fillHSXFields(options.color, cal.get(0));
							fillHexFields(options.color, cal.get(0));
							setHue(options.color, cal.get(0));
							setSelector(options.color, cal.get(0));
							setCurrentColor(options.color, cal.get(0));
							setNewColor(options.color, cal.get(0));
							//Append to body if flat=false, else show in place
							if (options.flat) {
								cal.appendTo(this).show();
								cal.css({
									position: 'relative',
									display: 'block'
								});
							} else {
								cal.appendTo(document.body);
								$(this).on(options.showEvent, show);
								cal.css({
									position: 'absolute'
								});
							}
						}
					});
				},
				//Shows the picker
				showPicker: function () {
					return this.each(function () {
						if ($(this).data('colpickId')) {
							show.apply(this);
						}
					});
				},
				//Hides the picker
				hidePicker: function () {
					return this.each(function () {
						if ($(this).data('colpickId')) {
							$('#' + $(this).data('colpickId')).hide();
						}
					});
				},
				//Sets a color as new and current (default)
				setColor: function (col, setCurrent) {
					setCurrent = (typeof setCurrent === "undefined") ? 1 : setCurrent;
					if (typeof col == 'string') {
						col = hexToHsb(col);
					} else if (col.r != undefined && col.g != undefined && col.b != undefined) {
						col = rgbToHsb(col);
					} else if (col.h != undefined && col.s != undefined && col.b != undefined) {
						col = fixHsb(col);
					} else {
						return this;
					}
					return this.each(function () {
						if ($(this).data('colpickId')) {
							var cal = $('#' + $(this).data('colpickId'));
							cal.data('colpick').color = col;
							cal.data('colpick').origColor = col;
							fillRGBFields(col, cal.get(0));
							fillHSXFields(col, cal.get(0));
							fillHexFields(col, cal.get(0));
							setHue(col, cal.get(0));
							setSelector(col, cal.get(0));

							setNewColor(col, cal.get(0));
							cal.data('colpick').onChange.apply(cal.parent(), [
								col,
								cal.data('colpick').hsl ? hslToHex(col) : hsbToHex(col),
								cal.data('colpick').hsl ? hslToRgb(col) : hsbToRgb(col),
								cal.data('colpick').el,
								1
							]);
							if (setCurrent) {
								setCurrentColor(col, cal.get(0));
							}
						}
					});
				}
			};
		}();
		//Color space convertions
		var hexToRgb = function (hex) {
			var hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
			return {
				r: hex >> 16,
				g: (hex & 0x00FF00) >> 8,
				b: (hex & 0x0000FF)
			};
		};
		var hexToHsb = function (hex) {
			return rgbToHsb(hexToRgb(hex));
		};
		var hexToHsl = function (hex) {
			return rgbToHsl(hexToRgb(hex));
		};
		var rgbToHsb = function (rgb) {
			var hsb = {
				h: 0,
				s: 0,
				x: 0
			};
			var min = Math.min(rgb.r, rgb.g, rgb.b);
			var max = Math.max(rgb.r, rgb.g, rgb.b);
			var delta = max - min;
			hsb.x = max;
			hsb.s = max != 0 ? 255 * delta / max : 0;
			if (hsb.s != 0) {
				if (rgb.r == max) hsb.h = (rgb.g - rgb.b) / delta;
				else if (rgb.g == max) hsb.h = 2 + (rgb.b - rgb.r) / delta;
				else hsb.h = 4 + (rgb.r - rgb.g) / delta;
			} else hsb.h = -1;
			hsb.h *= 60;
			if (hsb.h < 0) hsb.h += 360;
			hsb.s *= 100 / 255;
			hsb.x *= 100 / 255;
			return hsb;
		};
		var rgbToHsl = function (rgb) {
			return hsbToHsl(rgbToHsb(rgb));
		};
		var hsbToHsl = function (hsb) {
			var hsl = {
				h: 0,
				s: 0,
				x: 0
			};
			hsl.h = hsb.h;
			hsl.x = hsb.x * (200 - hsb.s) / 200;
			hsl.s = hsb.x * hsb.s / (100 - Math.abs(2 * hsl.x - 100));
			return hsl;
		};
		var hslToHsb = function (hsl) {
			var hsb = {
				h: 0,
				s: 0,
				x: 0
			};
			hsb.h = hsl.h;
			hsb.x = (200 * hsl.x + hsl.s * (100 - Math.abs(2 * hsl.x - 100))) / 200
			hsb.s = 200 * (hsb.x - hsl.x) / hsb.x;
			return hsb;
		};
		var hsbToRgb = function (hsb) {
			var rgb = {};
			var h = hsb.h;
			var s = hsb.s * 255 / 100;
			var v = hsb.x * 255 / 100;
			if (s == 0) {
				rgb.r = rgb.g = rgb.b = v;
			} else {
				var t1 = v;
				var t2 = (255 - s) * v / 255;
				var t3 = (t1 - t2) * (h % 60) / 60;
				if (h == 360) h = 0;
				if (h < 60) {
					rgb.r = t1;
					rgb.b = t2;
					rgb.g = t2 + t3
				} else if (h < 120) {
					rgb.g = t1;
					rgb.b = t2;
					rgb.r = t1 - t3
				} else if (h < 180) {
					rgb.g = t1;
					rgb.r = t2;
					rgb.b = t2 + t3
				} else if (h < 240) {
					rgb.b = t1;
					rgb.r = t2;
					rgb.g = t1 - t3
				} else if (h < 300) {
					rgb.b = t1;
					rgb.g = t2;
					rgb.r = t2 + t3
				} else if (h < 360) {
					rgb.r = t1;
					rgb.g = t2;
					rgb.b = t1 - t3
				} else {
					rgb.r = 0;
					rgb.g = 0;
					rgb.b = 0
				}
			}
			return {
				r: Math.round(rgb.r),
				g: Math.round(rgb.g),
				b: Math.round(rgb.b)
			};
		};
		var hslToRgb = function (hsl) {
			return hsbToRgb(hslToHsb(hsl));
		};
		var rgbToHex = function (rgb) {
			var hex = [
				rgb.r.toString(16),
				rgb.g.toString(16),
				rgb.b.toString(16)
			];
			$.each(hex, function (nr, val) {
				if (val.length == 1) {
					hex[nr] = '0' + val;
				}
			});
			return hex.join('');
		};
		var hsbToHex = function (hsb) {
			return rgbToHex(hsbToRgb(hsb));
		};
		var hslToHex = function (hsl) {
			return hsbToHex(hslToHsb(hsl));
		};
		$.fn.extend({
			colpick: colpick.init,
			colpickHide: colpick.hidePicker,
			colpickShow: colpick.showPicker,
			colpickSetColor: colpick.setColor
		});
		$.extend({
			colpick: {
				rgbToHex: rgbToHex,
				rgbToHsb: rgbToHsb,
				rgbToHsl: rgbToHsl,
				hsbToHex: hsbToHex,
				hsbToRgb: hsbToRgb,
				hsbToHsl: hsbToHsl,
				hexToHsb: hexToHsb,
				hexToHsl: hexToHsl,
				hexToRgb: hexToRgb,
				hslToHsb: hslToHsb,
				hslToRgb: hslToRgb,
				hslToHex: hslToHex
			}
		});
	}

	// bubbleSlider插件
	(function () {
		! function (t) {
			var e;
			return e = function () {
				function e(e, i) {
					var s, o, r, l, n, h, u, a, b, m, d;
					this.element = e,
						// this.element.hide(), 
						this.min = null != (s = this.element.attr("min")) ? s : i.min,
						this.max = null != (o = this.element.attr("max")) ? o : i.max,
						this.step = null != (l = this.element.attr("step")) ? l : i.step,
						this.value = null != (n = this.element.attr("value")) ? n : (i.max - i.min) / 2 + i.min,
						this.decimals = null != (h = this.element.data("decimals")) ? h : i.decimals,
						this.prefix = null != (u = this.element.data("prefix")) ? u : i.prefix,
						this.postfix = null != (a = this.element.data("postfix")) ? a : i.postfix,
						this.color = null != (b = this.element.data("color")) ? b : i.color,
						this.bgColor = null != (m = this.element.data("bg-color")) ? m : i.bgColor,
						this.bubbleColor = null != (d = this.element.data("bubble-color")) ? d : i.bubbleColor,
						this.bubbleBgColor = null != (r = this.element.data("bubble-bg-color")) ? r : i.bubbleBgColor,
						this.min = parseFloat(this.removeCommas(this.min)),
						this.max = parseFloat(this.removeCommas(this.max)),
						this.step = parseFloat(this.removeCommas(this.step)),
						this.value = parseFloat(this.removeCommas(this.value)),
						this.decimals = parseFloat(this.removeCommas(this.decimals)),
						this.slider = t("<div>").addClass("bubble-slider-wrap").insertAfter(this.element),
						this.minus = t("<div><span>-</span></div>").addClass("bubble-slider-minus"),
						this.plus = t("<div><span>+</span></div>").addClass("bubble-slider-plus"),
						this.track = t("<div>").addClass("bubble-slider-track").appendTo(this.slider),
						this.thumb = t("<div>").addClass("bubble-slider-thumb").appendTo(this.track),
						this.bubble = t("<div><span>").addClass("bubble-slider-bubble").appendTo(this.thumb),
						this.bubbleArrow = t("<div>").addClass("bubble-slider-bubble-arrow").prependTo(this.bubble),
						this.color && (this.minus.css("color", this.color),
							this.plus.css("color", this.color),
							this.thumb.css("background", this.color)),
						this.bgColor && (this.minus.css("border-color", this.bgColor),
							this.plus.css("border-color", this.bgColor),
							this.track.css("background", this.bgColor)),
						this.bubbleColor && this.bubble.children("span").first().css("color", this.bubbleColor),
						this.bubbleBgColor && (this.bubbleArrow.css("background", this.bubbleBgColor),
							this.bubble.children("span").first().css("background", this.bubbleBgColor)),
						this.dragging = !1,
						this.limit = 1e3,
						this.thumbOffset = this.thumb.outerWidth() / 2,
						this.bubbleNumber = this.bubble.find("span").first(),
						this.setValue(this.value),
						this.positionThumb(this.value),
						this.thumb.css("-ms-touch-action", "none"),
						this.thumb.on("mousedown touchstart", function (t) {
							return function (e) {
								return t.dragging ? void 0 : (e.preventDefault(), t.dragging = !0)
							}
						}(this)), t("html").on("mousemove touchmove", function (t) {
							return function (e) {
								return t.dragging ? (e.preventDefault(), "touchmove" === e.type ? t.dragThumb(e.originalEvent.touches[
									0].pageX) : t.dragThumb(e.originalEvent.pageX)) : void 0
							}
						}(this)).on("mouseup touchend", function (t) {
							return function (e) {
								return t.dragging ? (e.preventDefault(), t.dragging = !1) : void 0
							}
						}(this)), this.minus.on("click", function (t) {
							return function (e) {
								var i;
								return e.preventDefault(), i = t.value - t.step, i = Math.max(t.min, i), t.setValue(i), t.positionThumb(
									i)
							}
						}(this)), this.plus.on("click", function (t) {
							return function (e) {
								var i;
								return e.preventDefault(), i = t.value + t.step, i = Math.min(t.max, i), t.setValue(i), t.positionThumb(
									i)
							}
						}(this)), t(window).on("resize onorientationchange", function (t) {
							return function () {
								return t.positionThumb(t.value)
							}
						}(this))
				}
				return e.prototype.dragThumb = function (t) {
					var e, i, s;
					return i = this.track.offset().left + this.thumbOffset, e = this.track.offset().left + this.track.outerWidth() -
						this.thumbOffset, s = Math.max(i, t), s = Math.min(e, s), this.setValue(this.calcValue()),
						this.thumb.offset({
							left: s - this.thumbOffset
						})
				}, e.prototype.calcValue = function () {
					var t;
					return t = this.normalize(this.thumb.position().left, 0, this.track.outerWidth() - 2 * this.thumbOffset),
						t * (this.max - this.min) + this.min
				}, e.prototype.setValue = function (t) {
					var e;
					return this.value = Math.round((t - this.min) / this.step) * this.step + this.min, this.element.val(
							this.value), e = this.prefix + this.addCommas(this.value.toFixed(this.decimals)) + this.postfix,
						this.bubbleNumber.text(e), this.element.attr("value", e)
				}, e.prototype.positionThumb = function (t) {
					var e;
					return e = this.normalize(t, this.min, this.max), this.thumb.offset({
						left: Math.round(e * (this.track.outerWidth() - 2 * this.thumbOffset) + this.track.offset().left)
					})
				}, e.prototype.normalize = function (t, e, i) {
					return (t - e) / (i - e)
				}, e.prototype.addCommas = function (t) {
					return t.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
				}, e.prototype.removeCommas = function (t) {
					return t.toString().replace(/,/g, "")
				}, e
			}(), t.fn.bubbleSlider = function (i) {
				var s, o;
				return s = {
					min: 0,
					max: 100,
					step: 1,
					value: 50,
					decimals: 0,
					prefix: "",
					postfix: "",
					color: "",
					bgColor: "",
					bubbleColor: "",
					bubbleBgColor: ""
				}, o = t.extend({}, s, t.fn.bubbleSlider.defaults, i), new e(t(this), o)
			}, t(function () {
				return t(".bubble-slider").each(function () {
					return t(this).bubbleSlider()
				})
			})
		}(this.jQuery)
	}).call(this);

})(jQuery)