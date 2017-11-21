const http = require('http')
const fs = require('fs')
const url = require('url')
const path = require('path')
const util = require('util')
const query = require('querystring')
const opn = require('opn')
const base64Img = require('base64-img')
const formidable = require('formidable')

var styleSheet = `<style type="text/css">
* {
	padding: 0;
	margin: 0;
}
.header {
	padding: 25px;
	border-bottom: 1px solid #efefef;
}
.header h4 {
	font-size: 20px;
	font-weight: normal;
}
.tool-bar ul, .files ul {
	display: flex;
	padding: 10px;
}
.tool-bar {
	border-bottom: 1px solid #efefef;
}
.tool-bar ul li {
	list-style-type: none;
	margin: 5px 10px;
}
.btn {
	display: block;
	position: relative;
	text-decoration: none;
	border: 1px solid orange;
	color: orange;
	border-radius: 3px;
	padding: 8px 12px;
	font-size: 13px;
	transition: all .4s ease-in-out;
}
.btn:hover {
	color: #fff;
	background: orange;
}
.files ul {
	flex-wrap: wrap;
}
.files ul li {
	list-style-type: none;
	margin: 5px;
	padding: 8px;
	border: 1px solid transparent;
	transition: all .4s ease-in-out;
}
.files ul li:hover {
	background: rgba(255, 165, 0, .2);
}
.block {
	width: 80px;
	height: 80px;
	background-image: url('${imgToBase64("default.png")}');
	background-repeat: no-repeat;
	background-position: center;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}
.block img {
	max-width: 100%;
}
.jpg, .jpeg, .gif, .png {
	background-image: none;
}
.dir {
	background-image: url('${imgToBase64("dir.png")}');
}
.back {
	background-image: url('${imgToBase64("back.png")}');
	background-size: 40px auto;
}
.zip {
	background-image: url('${imgToBase64("zip.png")}');
}
.apk {
	background-image: url('${imgToBase64("apk.png")}');
}
.rar {
	background-image: url('${imgToBase64("zip.png")}');
}
.exe {
	background-image: url('${imgToBase64("exe.png")}');
}
.json {
	background-image: url('${imgToBase64("code.png")}');
}
.title {
	font-size: 12px;
	text-align: center;
	width: 80px;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
.upload {
	position: absolute;
	width: 100%;
	height: 100%;
	left: 0;
	top: 0;
	opacity: 0;
	cursor: pointer;
}
.uploading .upload {
	display: none;
}
.uploading .process {
	display: block;
	position: absolute;
	left: 0;
	top: 0;
	width: 0;
	height: 100%;
	background: rgba(255, 165, 0, .2);
	transition: all .4s ease-in-out;
}
.uploading:hover {
	color: orange;
	background: unset;
}
.contextmenu {
	display: none;
	position: fixed;
	width: 120px;
	background: #fff;
	box-shadow:2px 2px 15px rgba(0, 0, 0, .2);
}
.contextmenu ul li {
	font-size: 13px;
	list-style-type: none;
}
.contextmenu ul li a{
	display: block;
	text-indent: 15px;
	line-height: 30px;
	cursor: pointer;
}
.contextmenu ul li:hover {
	background: #eee;
}
</style>`;

var header = `<div class="header"><h4>All Files</h4></div>
<div class="tool-bar">
<ul>
<li>
<a class="btn" id="upload-file"><span class="status">上传文件</span><input type="file" class="upload" title="上传文件" /><span class="process"></span></a>
</li>
<li>
<a class="btn newfolder" href="javascript:">新建文件夹</a>
</li>
</ul>
</div>`;

var js = `<script src="https://cdn.bootcss.com/jquery/3.2.1/jquery.min.js"></script>
<script type="text/javascript">${fs.readFileSync('./lib.js')}</script>`

var server = http.createServer((request, response) => {

	let _req_url = url.parse(request.url);
	let paras = query.parse(_req_url.query);
	let api_id = paras.api;

	let mime;
	/*
	mime type
	*/

	let _res_body= '';
	/*
	response body
	*/

	let managerRoot = __dirname + '/root'


	if(api_id == 'upload') {
		if(request.method == 'GET') {
			_res_body = 'no supported method.'
			response.writeHead(200, {
				'Content-Type': 'text/html'
			});
			response.write(`no supported method.`, 'utf8');
			response.end();
		}
		else {
			let statusCode = 0;
			var form = new formidable.IncomingForm();
			form.parse(request, (err, fields, files) => {
				if(err) throw err;
				else statusCode = 1;
			});
			let _query = {}
			form.on('field', (name, value) => {
				_query.path = value
			});
			form.on('file', (name, file) => {
				if(file) {
					statusCode = 1;
					let steam = fs.createReadStream(file.path);
					let destination = fs.createWriteStream(managerRoot + _query.path + '/' + file.name);
					steam.pipe(destination, () => {
						fs.unlinkSync(file.path);
					});
				}
				response.writeHead(200, {
					'Content-Type': 'application/json'
				});
				response.write(`{"status": ${statusCode}}`);
				response.end();
			})
		}
	}
	else if(api_id == 'list') {
		let _query_path = paras.path ? paras.path : ''
		let _path = managerRoot + _query_path;
		files = fs.readdirSync(_path);
		var output = {};
		output.relativePath = _query_path;
		output._fileList = [];
		files.forEach((file, index) => {
			let curPath = _path + '/' + file;
			let item_obj = {};
			item_obj.path = curPath;
			item_obj.isDir = fs.statSync(curPath).isDirectory();
			item_obj.name = file;
			var ext = path.extname(curPath).toLowerCase();
			item_obj.ext = ext ? ext.slice(1) : ''
			output._fileList.push(item_obj)
		});
		response.writeHead(200, {
			'Content-Type': 'text/html'
		});
		response.write(render(output), 'utf8')
		response.end();
	}
	else if(api_id == 'mkdir') {
		let _query_path = paras.path ? paras.path : ''
		let _path = managerRoot + _query_path;
		let statusCode = 0, message;
		if(_path) {
			if(!fs.existsSync(_path)) {
				fs.mkdirSync(_path);
				statusCode = 1;
				message = '创建成功'
			}
			else {
				message = '目录已存在,无法创建'
			}
		}
		response.writeHead(200, {
			'Content-Type': 'application/json'
		});
		response.write(`{"status": ${statusCode}, "message": "${message}"}`, 'utf8')
		response.end();
	}
	else if(api_id == 'delete') {
		let _query_path = paras.path ? paras.path : ''
		let _path = managerRoot + _query_path;
		let statusCode = 0, message;
		function deletePath(path) {
			var files = fs.readdirSync(path);
			// if(files.length == 0) {
			// 	fs.rmdirSync(path);
			// 	return;
			// }
			files.forEach((file, index) => {
				var curPath = path + '/' + file;
				if(fs.statSync(curPath).isDirectory()) {
					deletePath(curPath)
				}
				else {
					fs.unlinkSync(curPath);
				}
			});
			fs.rmdirSync(path);
		}
		if(fs.existsSync(_path)) {
			if(fs.statSync(_path).isDirectory()) {
				deletePath(_path)
			}
			else {
				fs.unlinkSync(_path);
			}
			statusCode = 1
			message = '删除成功'
		}
		else message = '路径不存在'
		response.writeHead(200, {
			'Content-Type': 'application/json'
		});
		response.write(`{"status": ${statusCode}, "message": "${message}"}`, 'utf8')
		response.end();
	}
	else {
		_res_body = `<!DOCTYPE html><html>
		<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0" />
		<meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
		<meta http-equiv="x-ua-compatible" content="IE=edge" />
		<title>File Manger</title>${styleSheet}</head><body>${header}<div class="files"></div>${js}</body></html>`
		response.writeHead(200, {
			'Content-Type': 'text/html'
		});
		response.write(_res_body, 'utf8')
		response.end();
	}
});
server.listen(1250);
opn('http://localhost:1250')
console.log('server run at port:1250')


function render(json) {
	let _list = json._fileList || [];
	let html = '<ul>'
	if(json.relativePath) {
		let _arr = json.relativePath.split('/');
		let _up_dir = _arr.slice(0, _arr.length - 1).join('/')
		html += `<li><div class="block dir back" data-dir="${_up_dir}"></div><p class="title" title="上一级">上一级</p></li>`
	}
	for(let i in _list) {
		let item = _list[i];
		html += '<li class="item">'
		if(item.isDir) {
			html += `<div class="block dir" data-dir="${json.relativePath + '/' + item.name}">`
		}
		else {
			html += `<div class="block ${item.ext}">`
		}
		html += `${isImg(item.path)}</div><p class="title" title="${item.name}">${item.name}</p></li>`
	}
	return html + '</ul>'
}

function isImg(url) {
	var ext = path.extname(url).toLowerCase();
	let imgReg = /\.(png|jpe?g|gif|svg)(\?.*)?$/;
	if(imgReg.test(ext)) {
		return `<img src="${base64Img.base64Sync(url)}" />`;
	}
	else return ''
}

function imgToBase64(img) {
	return base64Img.base64Sync(__dirname + '\\assets\\icons\\' + img);
}