var express = require('express'); // Подключаем express
var app = express();
var server = require('http').Server(app); // Подключаем http через app
var io = require('socket.io')(server); // Подключаем socket.io и указываем на сервер
var log4js = require('log4js'); // Подключаем наш логгер
var logger = log4js.getLogger(); // Подключаем с модуля log4js сам логгер

var port = 5000; // Можно любой другой порт

var rooms = [], users = [], sockets = [], roomMembers = [], numRooms = [];

logger.debug('Script has been started...'); // Логгируем.


const mysql = require("mysql2");
  
const connection = mysql.createConnection({
  host: "localhost",
  user: "u0534789_midas",
  database: "u0534789_chat",
  password: "Mymilan1"
});
connection.connect(function(err){
    if (err) {
      return console.error("Ошибка: " + err.message);
    }
    else{
      console.log("Подключение к серверу MySQL успешно установлено");
    }
});
connection.query("SELECT * FROM users",
	function(err, results, fields) {
	    console.log(err);
	    console.log(results[1].login); // собственно данные
	    console.log(fields); // мета-данные полей 
});

connection.query("SELECT * FROM chats",
	function(err, results, fields){
		if(err!=null)
			console.log(err);
		results.forEach(function(item, i, arr) {
			rooms.push(item.name);
			roomMembers[item.name] = new Array();
			numRooms.push(0);
		});
});


server.listen(port); // Теперь мы можем подключиться к нашему серверу через localhost:3000 при запущенном скрипте

app.use(express.static(__dirname + '/public')); // Отправляет "статические" файлы из папки public при коннекте // __dirname - путь по которому лежит chat.js

io.on('connection', function (socket) { // Создаем обработчик события 'connection' которое создает io.connect(port); с аргументом socket
  //var name = 'U' + (socket.id).toString().substr(1,4); // Создаем никнейм нашему клиенту. В начале буква 'U' дальше берем 3 символа ID (сокета) после первого символа, и все это клеим с помощью '+'
  //socket.broadcast.emit('newUser', name); // Отсылает событие 'newUser' всем подключенным, кроме текущего. На клиенте навешаем обработчик на 'newUser' (Отправляет клиентам событие о подключении нового юзера)
  //socket.emit('userName', name); // Отправляем текущему клиенту событие 'userName' с его ником (name) (Отправляем клиенту его юзернейм)
  //logger.info(name + ' connected to chat!'); // Логгирование

	socket.on('request', function(req){ // Обработчик на событие 'message' и аргументом (msg) из переменной message
	    logger.warn('-----------'); // Logging
	    var data = JSON.parse(req);
	    var has = false;
	    users.forEach(function(item, i, arr){
	    	if(item==data.login)
	    		return false;
	    });
		connection.query("SELECT * FROM users", function(err, results, fields){
			var id;
			if(err!=null){
				console.log(err);
				return false;
			}
			results.forEach(function(item, i, arr) {

				if((item.login==data.login)&&(item.password==data.password)){
					has=true;
					id = i;
				}
			});
			if(has){
		    	console.log("User " + data.login + " connected");
		    	socket.emit("connectionResult", true, results[id].status);
		    	socket.emit("roomsList", rooms, numRooms);
		    	users.push(data.login);
		    	sockets.push(socket);
		    	socket.emit("usersList", users);
		    	//socket.broadcast.emit("newUser", data.login);
		    	socket.broadcast.emit("usersList", users);
		    	/*socket.join("someRoom");
		    	socket.join("someRoom2");
		    	//io.to("someRoom").emit("sysMessage", "someRoom");
		    	//io.to("someRoom2").emit("sysMessage", "someRoom2");
		    	socket.emit("connectedToRoom", "someRoom");
		    	socket.emit("connectedToRoom", "someRoom2");
		    	io.to("someRoom").emit("message", "Hi", "Sys", "someRoom");
		    	io.to("someRoom2").emit("message", "Hi", "Sys", "someRoom2");*/
		    	
		    	//socket.emit("roomsList", Object.keys(socket.rooms));
		    }else{
		    	console.log("User " + data.login + " connection error");
		    	socket.emit("connectionResult", false, 0);
		    }
		});
	    
	    //logger.warn('User: ' + name + ' | Message: ' + msg);
	    //logger.warn('====> Sending message to other chaters...');
	    //io.sockets.emit('messageToClients', msg, name); // Отправляем всем сокетам событие 'messageToClients' и отправляем туда же два аргумента (текст, имя юзера)

  	});
	socket.on("newChat", function(newChatName, type, shortInfo, fullInfo){
		var can = true;
		rooms.forEach(function(item, i, arr) {
			if(newChatName==item){
				can=false;
			}
		});
		if(can){
			socket.join(newChatName);
			socket.emit("connectedToRoom", newChatName);
			rooms.push(newChatName);
			roomMembers[newChatName] = new Array();
			roomMembers[newChatName].push(users[sockets.indexOf(socket)]);
			numRooms.push(1);
			socket.emit("roomsList", rooms, numRooms);
			socket.broadcast.emit("roomsList", rooms, numRooms);
			connection.query("SELECT * FROM users WHERE login='" + users[sockets.indexOf(socket)] + "'", function(err, results, fields){
				if(err!=null){
					console.log(err);
				}
				var id = results[0].id;
				fullInfo = "Room name: " + newChatName + "\nRoom creator: " + users[sockets.indexOf(socket)] + "\n" + fullInfo;
				socket.emit("message", shortInfo, users[sockets.indexOf(socket)], newChatName);
				connection.query("INSERT INTO chats(name, creatorId, chatType, fullInfo, shortInfo) VALUES('" + newChatName + "', '" + id + "' ,'" + type + "', '" + fullInfo + "', '" + shortInfo + "')",
					function(err, results, fields){
						if(err!=null){
							console.log(err);
						}
				});
			})
			
		}
	});
	socket.on("newPersonalChat", function(from, to){
		var newPchat = from+to;
		socket.join(newPchat);
		sockets[users.indexOf(to)].join(newPchat);
		socket.emit("connectedToRoom", newPchat);
		sockets[users.indexOf(to)].emit("connectedToRoom", newPchat);
		io.to(newPchat).emit("message", " opened a personal chat", from, newPchat);