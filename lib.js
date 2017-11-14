$().ready(init);

var curPath = ''

function init() {
	listFiles()

	$('#upload-file input').on('change', function(e) {
		var file = e.target.files[0];
		var formData = new FormData();
		formData.append('file', file);
		formData.append('path', curPath);
		uploadFile(formData)
	});

	$(document).on('click', '.files .dir', function(e) {
		var _path = $(this).data('dir');
		listFiles(_path);
	})
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