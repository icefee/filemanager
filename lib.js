$().ready(init);

var curPath = '',
_contextmenuElm /* 保存当前右键菜单选择的元素 */

function init() {
	listFiles()

	$('#upload-file input').on('change', function(e) {
		var file = e.target.files[0];
		var formData = new FormData();
		formData.append('file', file);
		formData.append('path', curPath);
		uploadFile(formData)
	});

	$('.newfolder').on('click', function(e) {
		var name = window.prompt('输入目录名称')
		if(name) {
			createFolder(name)
		}
	})

	$(document).on('click', '.files .dir', function(e) {
		var _path = $(this).data('dir');
		listFiles(_path);
	});

	$(document).on('contextmenu', '.files ul .item', function(e) {
		_contextmenuElm = $(this).find('.block');
		if(!$('.contextmenu').length) {
			renderContextmenu('dir');
		}
		var contextmenu = $('.contextmenu')
		contextmenu.css({
			left: e.pageX,
			top: e.pageY
		})
		contextmenu.show();
		return false;
	});

	$(document).on('click', '.contextmenu ul li a', function(e) {
		e.stopPropagation();
		var _oper_id = $(this).data('id')
		var _item_title = _contextmenuElm.siblings('p.title').text()
		var isDir = _contextmenuElm.hasClass('dir');
		var _path = isDir ? _contextmenuElm.data('dir') : curPath + '/' + _item_title
		if(_contextmenuElm) {
			if(_oper_id == 0) {
				_contextmenuElm.trigger('click')
			}
			else if(_oper_id == 1) {
				sync(function() {
					if(window.confirm('是否删除该项目?')) {
						deleteItem(_path)
					}
				})
			}
			else if(_oper_id == 2) {
				sync(function() {
					var _new_name = window.prompt('重命名', _item_title);
					if(_new_name) {
						renameItem(_new_name)
					}
				})
			}
		}
		hideContextmenu()
	});

	$(document).on('click', function(e) {
		hideContextmenu();
	});

	$(document).on('contextmenu', function(e) {
		hideContextmenu();
		return false;
	});
}

function renderContextmenu(type) {
	var menus = ['打开', '删除', '重命名', '属性'];
	var temp = '<div class="contextmenu"><ul>'
	for(var i = 0; i < menus.length; i ++) {
		temp += '<li><a data-id="' + i + '">' + menus[i] + '</a></li>'
	}
	temp += '</ul></div>'
	$(temp).appendTo($('body'))
}

function hideContextmenu() {
	$('.contextmenu').hide();
	_contextmenuElm = null;
}

var xhrOnProgress = function(fun) {
	xhrOnProgress.onprogress = fun; //绑定监听
    return function() {
    	var xhr = $.ajaxSettings.xhr();
    	if (typeof xhrOnProgress.onprogress !== 'function') return xhr;
    	if (xhrOnProgress.onprogress && xhr.upload) {
    		xhr.upload.onprogress = xhrOnProgress.onprogress;
    	}
    	return xhr;
    }
}

function uploadFile(data) {
	var _wrap = $('#upload-file'), _process = $('#upload-file .process'), _status = $('#upload-file .status')
	_wrap.addClass('uploading')
	_status.text('上传中...')
	var ops = {
		type: 'POST',
		url: '/?api=upload',
		contentType: false,
		processData: false,
		data: data,
		xhr: xhrOnProgress(function(e) {
			var percent = e.loaded / e.total;
			_process.width(percent * 100 + '%')
		}),
		success: function(data) {
			if(data.status == 1) {
				_wrap.removeClass('uploading')
				_status.text('上传文件')
				_process.width(0)
				listFiles(curPath)
			}
		},
		error: function(err) {
			console.log('error:' + err)
		}
	};
	$.ajax(ops)
}

function listFiles(path) {
	var path = path || ''
	var ops = {
		type: 'GET',
		url: '/?api=list&path=' + path,
		contentType: 'text/html',
		success: function(data) {
			if(data) {
				$('.files').html(data);
				curPath = path;
			}
		},
		error: function(err) {
			console.log('error:' + err)
		}
	}
	$.ajax(ops)
}

function createFolder(name) {
	var ops = {
		type: 'GET',
		url: '/?api=mkdir&path=' + curPath + '/' + name,
		contentType: 'application/json',
		success: function(data) {
			if(data.status == 0) {
				alert(data.message);
			}
			else listFiles(curPath)
		},
		error: function(err) {
			console.log(err)
		}
	}
	$.ajax(ops)
}


function deleteItem(path) {
	var path = path || ''
	var ops = {
		type: 'GET',
		url: '/?api=delete&path=' + path,
		contentType: 'application/json',
		success: function(data) {
			if(data.status == 0) {
				alert(data.message);
			}
			else listFiles(curPath)
		},
		error: function(err) {
			console.log('error:' + err)
		}
	}
	$.ajax(ops)
}


function renameItem(path) {
	console.log(path)
}

function sync(fun) {
	setTimeout(fun, 0)
}