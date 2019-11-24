var port = 5000;
var socket = io.connect('http://molodshev.com:' + port);

var login = 'user';
var activeRoom = null;
var inchat = false;
var unread = [];
var theme_ = 1;


socket.on("connectionResult", function(res, status){
	if(res){
		login = $("#login").val();
		$("#loginF").css({
			display : "none"
		});
		$("#mainTextArea").css({
			display : "none"
		});
		$("#messageInput").css({
			display : "none"
		});
		$("#tabs").css({
			display : "none"
		});
		$("#main").css({
			display : "block"
		});
		if(status!='admin'){
			$("#permanentChat").css({
				display : "none"
			});
		}
	}else
		alert("Попробуйте еще раз");
});
socket.on('sysMessage', function(msg){
	console.log("System message => " + msg); // Логгирование в консоль браузера
	$('textarea').val($('textarea').val() + "System message: " + msg +'\n'); // Добавляем в поле для текста сообщение типа (Ник : текст)
	Scroll();
});
socket.on('message', function(msg, name, room){
	$("#" + room + " textarea").val($("#" + room + " textarea").val() + name + ": " + msg + '\n');
		
	if(room!=activeRoom){
		unread[room]++;
		$("#" + room + " .unreadMs").text(unread[room]);
	}
	changeRoom(activeRoom);
	Scroll();
});
socket.on("connectedToRoom", function(room){
	if(!inchat){
		$("#mainTextArea").css({
			display : "inline-block"
		});
		$("#messageInput").css({
			display : "block"
		});
		$("#tabs").css({
			display : "block"
		});
		inchat=true;
	}
	console.log(room);
	activeRoom = room;
	console.log(activeRoom);
	unread.push(room);
	unread[room] = 0;
	$("#tabs").append("<div class='tab' id='" + room + "' onclick='changeRoom(\"" + room + "\")'><p>" + room + "</p><p class='unreadMs'></p><img src='img/close.svg' class='deleteTab' onclick='quitRoom(\"" + room + "\")'><textarea style='display: none'></textarea></div>");
	$(".tab").removeClass("activeTab");
	$("#" + room).addClass("activeTab");
});
socket.on("roomsList", function(list, numList){
	$("#rooms .room").remove();
	console.log(numList);
	$.each(list, function(index, value){
        $("#rooms").append("<div class='room' onclick='connectToRoom(\"" + value + "\")'><p>" + index + ". " + value + '\n' + "</p><p class='numInRoom'>(" + numList[index] + ")</p><img src='img/info.svg' class='infoTab' onclick='roomInfo(\"" + value + "\")'></div>");
    });
});
socket.on("usersList", function(list){
	$("#users .user").remove();
	$.each(list, function(index, value){
        $("#users").append("<div class='user'><p onclick='newPersonalChat(\"" + login + "\", \"" + value + "\")'>" + index + ". " + value + '\n' + "</p></div>");
    });
});
socket.on("usersInRoomList", function(usersInside){
	$("#usersInRoom .usersInRoom").remove();
	$.each(usersInside, function(index, value){
		$("#usersInRoom").append("<div class='usersInRoom'><p onclick='newPersonalChat(\"" + login + "\", \"" + value + "\")'>" + index + ". " + value + '\n' + "</p><img src='img/close.svg' class='deleteUser' onclick='deleteUser(\"" + login + "\", \"" + value + "\")'></div>");
	});
});
socket.on("kickedFrom", function(room){
	unread.splice(unread[unread.indexOf(room)], 1);
	$("#" + room).remove();
});
socket.on("roomInfoIn", function(roomInfo){
	$('#mainTextArea').val(roomInfo);
});

function changeRoom(room){
	activeRoom = room;
	$("#mainTextArea").val($("#" + room + " textarea").val());
	$("#" + room + " .unreadMs").text(null);
	unread[room]=0;
	$(".tab").removeClass("activeTab");
	$("#" + room).addClass("activeTab");
	socket.emit("getUsersInRoom", room);
};
function connectToRoom(room){
	var can = true;
	$.each($(".tab"), function(index, value){
		if(value.id==room){
			can = false;
			return;
		}
	});
	if(can){
		activeRoom = room;
		socket.emit("connectToChat", room);
		$("#mainTextArea").val($("#" + room + " textarea").val());
	}
};
function PressEnter(your_text, your_event, num) {
	if(your_text != "" && your_event.keyCode == 13){
		//var a = "Нажали Enter в поле номер "+num;
		//alert(a);
		if(num == 1){
			messageSend();
		}
		else if(num == 2){
			newChat("temporary");
		}
		else if(num == 3){
			newChat("permanent");
		}
	}	   
};

function messageSend(){
	var message = $("#messageField").val();
	socket.emit("messageSend", message, activeRoom, login);
	$("#messageField").val(null);
};
function newChat(type){
	if(type=="temporary"){
		var newChatName = $("#newChatName").val();
		$("#newChatName").val(null);
	}else{
		var newChatName = $("#newParmamentChatName").val();
		$("#newParmamentChatName").val(null);
	}
	var shortInfo = prompt("Enter welcome text", "Welcome to my chat");
	var fullInfo = prompt("Enter info about chat", "My chat");
	if((shortInfo==null)||(fullInfo==null))
		return 0;
	socket.emit("newChat", newChatName, type, shortInfo, fullInfo);
};
function newPersonalChat(from, to){
	var can = true;
	var newPchat = from+to;
	var search = to+from;
	if(from==to)
		can=false;
	unread.forEach(function(item, i, arr) {
		if(search==item){
			can=false;
		}
		if(newPchat==item){
			can=false;
		}
	});
	if(can)
		socket.emit("newPersonalChat", from, to);
};
function loginToSys(){
	var logInfo = {
  		login: $("#login").val(),
  		password: $("#password").val()
	};
	var lijson = JSON.stringify(logInfo);
	socket.emit('request', lijson);
}
function roomInfo(room){
	socket.emit("getRoomInfo", room);
}
function quitRoom(room){
	socket.emit("leaveRoom", room);
	unread.splice(unread[unread.indexOf(room)], 1);
	$("#" + room).remove();
}
window.onbeforeunload = function (e){
	socket.emit("disconnected", login);
};
/*Новое Полиночки*/
function changeusers(u){
	if(u==1){
		$("#users").css({
			display : "none"
		});
		$("#usersInRoom").css({
			display : "inline-block"
		});
	}
	if(u==2){
		$("#usersInRoom").css({
			display : "none"
		});
		$("#users").css({
			display : "inline-block"
		});
	}
};

function theme(){
	if(theme_ == 1){
		$("body").css({
			background : "white"
		});
		console.log(theme_);
		theme_ = 2;
	}
	else if(theme_ == 2){
		$("body").css({
			background : "rgb(52, 56, 61)"
		});
		console.log(theme_);
		theme_ = 1;
	}
};


function Scroll(){
	var block = document.getElementById("mainTextArea");
	block.scrollTop = block.scrollHeight;
  };	

function deleteUser(sender, kick){
	socket.emit("kickUser", sender, kick, activeRoom);
};

function infoTab(sender, kick){
	socket.emit("kickUser", sender, kick, activeRoom);
};

/*Новое Полиночки*/


//dbg
/*$(document).ready(function(){
	var logInfo = {
  		login: "user",
  		password: ""
	};
	var lijson = JSON.stringify(logInfo);
	socket.emit('request', lijson);
});*/