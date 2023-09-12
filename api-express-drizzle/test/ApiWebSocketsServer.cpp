#include "ApiWebSocketsServer.h"
#include "SqlInterface.h"

#include <QNetworkInterface>
#include <QWebSocketServer>
#include <QWebSocket>
#include <QTimer>
#include <QJsonObject>
#include <QJsonArray>
#include <QJsonValue>
#include <iostream>

const QJsonDocument::JsonFormat format = QJsonDocument::Compact;


///////////////////////////////////////////////////////////////////////////////
//  CONSTRUCTEUR ET DESTRUCTEUR
//  ETHERNET LOCAL IP ADDRESS
//  URL
//
//  LISTEN
//  CLOSE
//  SLOT NEW CONNECTION
//  SLOT SOCKET DISCONNECTED
//  SLOT CHECK AND PING
//  SLOT PONG
//  RELEASE USER LOCKS
//  USER HAS LOCK
//
//  SLOT PROCESS MESSAGE
//  SEND ERROR MESSAGE
//  GET MESSAGE TYPE
//  PROCESS USER NAME NOTIFICATION
//  PROCESS LOCK REQUEST
//  PROCESS UNLOCK REQUEST
//  PROCESS ALL DATA REQUEST
//  PROCESS INSERT REQUEST
//  PROCESS UPDATE REQUEST
//  PROCESS DELETE REQUEST
///////////////////////////////////////////////////////////////////////////////


// CONSTRUCTEUR ET DESTRUCTEUR ////////////////////////////////////////////////
ApiWebSocketsServer::ApiWebSocketsServer(quint16 port) : QObject{}
{
	m_port = port;
	m_server = new QWebSocketServer{"WebApiServer",QWebSocketServer::NonSecureMode};
	m_pingTimer = new QTimer{this};
	m_pingTimer->start(dtPing*1000);

	QObject::connect(m_server,    SIGNAL(newConnection()), this, SLOT(slotNewConnection()));
	QObject::connect(m_pingTimer, SIGNAL(timeout()),       this, SLOT(slotCheckAndPing()));
}

ApiWebSocketsServer::~ApiWebSocketsServer()
{
	this->close();
}

// ETHERNET LOCAL IP ADDRESS //////////////////////////////////////////////////
QString ApiWebSocketsServer::ethernetLocalIpAddress(bool ipv6)
{
	// search for the first active ethernet network interface
	QList<QNetworkInterface> interfaces = QNetworkInterface::allInterfaces();
	auto isActiveEthernet = [] (const QNetworkInterface &ni) {return ni.type() == QNetworkInterface::Ethernet && (ni.flags() & QNetworkInterface::IsUp);};
	auto result1 = std::find_if(interfaces.begin(),interfaces.end(),isActiveEthernet);
	if (result1 == interfaces.end()) {return QString{};}
	
	// search for the first ip address with the right protocol
	QList<QNetworkAddressEntry> addressesEntries = result1->addressEntries();
	QAbstractSocket::NetworkLayerProtocol protocolToSearch = (ipv6 ? QAbstractSocket::IPv6Protocol : QAbstractSocket::IPv4Protocol);
	auto isIpVX = [protocolToSearch] (const QNetworkAddressEntry &nae) {return nae.ip().protocol() == protocolToSearch;};
	auto result2 = std::find_if(addressesEntries.begin(),addressesEntries.end(),isIpVX);
	if (result2 == addressesEntries.end()) {return QString{};}
	return result2->ip().toString();
}

// URL ////////////////////////////////////////////////////////////////////////
QString ApiWebSocketsServer::url() const
{
	return "ws://" + ethernetLocalIpAddress() + ":" + QString::number(m_port);
}






// LISTEN /////////////////////////////////////////////////////////////////////
bool ApiWebSocketsServer::listen(QString *errorMessage)
{
	// start the server
	if (!m_server->listen(QHostAddress::Any,m_port))
	{
		if (errorMessage) {*errorMessage = "Server failed to listen: " + m_server->errorString();}
		return false;
	}
	
	if (errorMessage) {*errorMessage = "";}
	return true;
}

// CLOSE //////////////////////////////////////////////////////////////////////
void ApiWebSocketsServer::close()
{
	m_server->close();
}

// SLOT NEW CONNECTION ////////////////////////////////////////////////////////
void ApiWebSocketsServer::slotNewConnection()
{
	QWebSocket *socket = m_server->nextPendingConnection();
	QObject::connect(socket, SIGNAL(textMessageReceived(QString)), this, SLOT(slotProcessMessage(QString)));
	QObject::connect(socket, SIGNAL(disconnected()),               this, SLOT(slotSocketDisconnected()));
	QObject::connect(socket, SIGNAL(pong(quint64,QByteArray)),     this, SLOT(slotPong(quint64,QByteArray)));
	m_clients.push_back(User{"Anonymous",socket,{},{},false});

	std::cout << "one connection (now " << m_clients.size() << " clients connected)" << std::endl;

	// we send all the data to this client so that it inits with it
	this->processAllDataRequest(socket);
}

// SLOT SOCKET DISCONNECTED ///////////////////////////////////////////////////
void ApiWebSocketsServer::slotSocketDisconnected()
{
	QWebSocket *socket = qobject_cast<QWebSocket*>(sender());
	if (!socket) {return;}

	auto socketMatches = [socket] (const User &u) {return (u.socket == socket);};
	auto userIt = std::find_if(m_clients.begin(),m_clients.end(),socketMatches);
	if (userIt != m_clients.end()) {m_clients.erase(userIt);}

	this->releaseUserLocks(socket);
	socket->abort();
	socket->deleteLater();
	std::cout << "one disconnection (now " << m_clients.size() << " clients connected)" << std::endl;
}

// SLOT PING ALL CLIENTS //////////////////////////////////////////////////////
void ApiWebSocketsServer::slotCheckAndPing()
{
	int nbConnectionsLost = 0;
	for (User &u : m_clients)
	{
		QDateTime cdt = QDateTime::currentDateTime();

		// check ping pong
		if (u.firstPing.isValid() && u.firstPing.secsTo(cdt) > dtPingFirstCheck)
		{
			bool checkFailed1 = u.lastPong.secsTo(cdt) > dtPingThrFailure;
			bool checkFailed2 = (!u.lastPong.isValid() && u.firstPing.secsTo(cdt) > dtPingThrFailure);
			if (checkFailed1 || checkFailed2)
			{
				QObject::disconnect(u.socket, SIGNAL(textMessageReceived(QString)), this, SLOT(slotProcessMessage(QString)));
				QObject::disconnect(u.socket, SIGNAL(disconnected()),               this, SLOT(slotSocketDisconnected()));
				QObject::disconnect(u.socket, SIGNAL(pong(quint64,QByteArray)),     this, SLOT(slotPong(quint64,QByteArray)));
				u.lost = true;

				this->releaseUserLocks(u.socket);
				u.socket->abort();
				u.socket->deleteLater();
				nbConnectionsLost++;
				continue;
			}
		}

		// ping it
		u.socket->ping();
		if (u.firstPing.isNull()) {u.firstPing = cdt;}
	}

	// remove the lost connections
	if (nbConnectionsLost > 0)
	{
		auto isLost = [] (const User &u) {return u.lost;};
		auto it = std::remove_if(m_clients.begin(),m_clients.end(),isLost);
		m_clients.erase(it,m_clients.end());
		std::cout << nbConnectionsLost << " connection(s) lost (now " << m_clients.size() << " clients connected)" << std::endl;
	}
}

// SLOT PONG //////////////////////////////////////////////////////////////////
void ApiWebSocketsServer::slotPong(quint64 elapsedTime, const QByteArray &payload)
{
	Q_UNUSED(elapsedTime)
	Q_UNUSED(payload)
	
	QWebSocket *socket = qobject_cast<QWebSocket*>(sender());
	if (!socket) {return;}

	auto socketMatches = [socket] (const User &u) {return (u.socket == socket);};
	auto userIt = std::find_if(m_clients.begin(),m_clients.end(),socketMatches);
	if (userIt != m_clients.end()) {userIt->lastPong = QDateTime::currentDateTime();}
}

// RELEASE USER LOCKS /////////////////////////////////////////////////////////
void ApiWebSocketsServer::releaseUserLocks(QWebSocket *socket)
{
	// release the locks from this socket
	// remark: "erase_if" comes only with C++20
	for (auto it=m_lockers.begin(); it != m_lockers.end(); )
	{
		if (it->second.socket == socket) {it = m_lockers.erase(it);}
		else {++it;}
	}
}

// USER HAS LOCK ON ///////////////////////////////////////////////////////////
bool ApiWebSocketsServer::userHasLock(int id, QWebSocket *socket)
{
	if (m_lockers.count(id) == 0) {return false;}
	return (m_lockers[id].socket == socket);
}






// SLOT PROCESS MESSAGE ///////////////////////////////////////////////////////
void ApiWebSocketsServer::slotProcessMessage(const QString &msg)
{
	QWebSocket *socket = qobject_cast<QWebSocket*>(sender());
	if (!socket)
	{
		std::cout << "----------- ERROR -----------" << std::endl;
		std::cout << "Failed to identify the sender" << std::endl << std::endl;
	}
	
	// checks on the message
	QJsonDocument jsonDoc = QJsonDocument::fromJson(msg.toUtf8());
	MsgType msgType = ApiWebSocketsServer::getMessageType(jsonDoc);
	if (msgType == MsgType::Invalid)
	{
		ApiWebSocketsServer::sendErrorMessage(socket,msg,"Invalid input data");
		std::cout << "----------- ERROR -----------" << std::endl;
		std::cout << "Invalid input data" << std::endl << std::endl;
		return;
	}

	QJsonObject object = jsonDoc.object();
	
	if (msgType == MsgType::UserName)            {this->processUserNameNotification(object,socket);}
	else if (msgType == MsgType::LockRequest)    {this->processLockRequest(object,socket);}
	else if (msgType == MsgType::UnlockRequest)  {this->processUnlockRequest(object,socket);}
	else if (msgType == MsgType::AllDataRequest) {this->processAllDataRequest(socket);}
	else if (msgType == MsgType::InsertRequest)  {this->processInsertRequest(object,socket);}
	else if (msgType == MsgType::UpdateRequest)  {this->processUpdateRequest(object,socket);}
	else if (msgType == MsgType::DeleteRequest)  {this->processDeleteRequest(object,socket);}
}

/*
the original messages should be like this:
{
	"userName": "myPseudo"
}
{
	"rqtType": "(un)lock",
	"rqtData": 2
}
{
	"rqtType": "getData",
	"rqtData": null
}
{
	"rqtType": "insert",
	"rqtData": {
		"description": "blabla",
		"number": 3
	}
}
{
	"rqtType": "update",
	"rqtData": {
		"id": 1,
		"description": "blabla",
		"number": 3
	}
}
{
	"rqtType": "delete",
	"rqtData": 1
}
*/

// SEND ERROR MESSAGE /////////////////////////////////////////////////////////
void ApiWebSocketsServer::sendErrorMessage(QWebSocket *socket, const QString &originalMsg, const QString &errorMessage)
{
	if (!socket) {return;}
	QJsonObject obj{{"originalMsg",originalMsg},{"errorMsg",errorMessage}};
	socket->sendTextMessage(QJsonDocument{obj}.toJson(format));
}

// GET MESSAGE TYPE ///////////////////////////////////////////////////////////
MsgType ApiWebSocketsServer::getMessageType(const QJsonDocument &doc)
{
	if (!doc.isObject()) {return MsgType::Invalid;}
	
	QJsonObject obj = doc.object();
	if (obj.contains("userName") && obj["userName"].isString()) {return MsgType::UserName;}
	if (!obj.contains("rqtType") || !obj.contains("rqtData")) {return MsgType::Invalid;}
	if (!obj["rqtType"].isString()) {return MsgType::Invalid;}

	QString rqtType = obj["rqtType"].toString();
	const QJsonValue &rqtData = obj["rqtData"];

	if (rqtType == "lock" && rqtData.isDouble()) {return MsgType::LockRequest;}
	if (rqtType == "unlock" && rqtData.isDouble()) {return MsgType::UnlockRequest;}
	if (rqtType == "getData") {return MsgType::AllDataRequest;}

	if (rqtType == "insert")
	{
		if (!rqtData.isObject()) {return MsgType::Invalid;}
		QJsonObject rdo = rqtData.toObject();

		if (!rdo.contains("description") || !rdo.contains("number")) {return MsgType::Invalid;}
		if (!rdo["description"].isString() || !rdo["number"].isDouble()) {return MsgType::Invalid;}
		return MsgType::InsertRequest;
	}

	if (rqtType == "update")
	{
		if (!rqtData.isObject()) {return MsgType::Invalid;}
		QJsonObject rdo = rqtData.toObject();

		if (!rdo.contains("id") || !rdo.contains("description") || !rdo.contains("number")) {return MsgType::Invalid;}
		if (!rdo["id"].isDouble() || !rdo["description"].isString() || !rdo["number"].isDouble()) {return MsgType::Invalid;}
		return MsgType::UpdateRequest;
	}

	if (rqtType == "delete")
	{
		if (!rqtData.isDouble()) {return MsgType::Invalid;}
		return MsgType::DeleteRequest;
	}

	return MsgType::Invalid;
}

// PROCESS USER NAME NOTIFICATION /////////////////////////////////////////////
void ApiWebSocketsServer::processUserNameNotification(const QJsonObject &obj, QWebSocket *socket)
{
	// This type of message is sent by the client just after the connection.
	// It allows the association of the socket with a user name.
	QString userName = obj["userName"].toString();
	auto socketMatches = [socket] (const User &u) {return (u.socket == socket);};
	auto userIt = std::find_if(m_clients.begin(),m_clients.end(),socketMatches);
	if (userIt != m_clients.end()) {userIt->name = userName;}
}

// PROCESS LOCK REQUEST ///////////////////////////////////////////////////////
void ApiWebSocketsServer::processLockRequest(const QJsonObject &obj, QWebSocket *socket)
{
	int id = obj["rqtData"].toInt();
	if (m_lockers.count(id) > 0)
	{
		QString errorMessage = "The id #" + QString::number(id) + " is already locked by " + m_lockers[id].name;
		QJsonObject answer{{"type","lock"},{"id",id},{"status","failure"},{"msg",errorMessage}};
		socket->sendTextMessage(QJsonDocument{answer}.toJson(format));
		return;
	}
	
	auto socketMatches = [socket] (const User &u) {return (u.socket == socket);};
	auto userIt = std::find_if(m_clients.begin(),m_clients.end(),socketMatches);
	if (userIt == m_clients.end()) {return;}

	m_lockers[id] = UserShort{userIt->name,userIt->socket};
	QJsonObject answer{{"type","lock"},{"id",id},{"status","success"}};
	socket->sendTextMessage(QJsonDocument{answer}.toJson(format));
}

// PROCESS UNLOCK REQUEST /////////////////////////////////////////////////////
void ApiWebSocketsServer::processUnlockRequest(const QJsonObject &obj, QWebSocket *socket)
{
	int id = obj["rqtData"].toInt();
	if (m_lockers.count(id) == 0)
	{
		QString errorMessage = "The id #" + QString::number(id) + " is not locked";
		QJsonObject answer{{"type","unlock"},{"id",id},{"status","failure"},{"msg",errorMessage}};
		socket->sendTextMessage(QJsonDocument{answer}.toJson(format));
		return;
	}

	if (m_lockers[id].socket != socket)
	{
		QString errorMessage = "The id #" + QString::number(id) + " is not locked from this connection";
		QJsonObject answer{{"type","unlock"},{"id",id},{"status","failure"},{"msg",errorMessage}};
		socket->sendTextMessage(QJsonDocument{answer}.toJson(format));
		return;
	}

	m_lockers.erase(id);
	QJsonObject answer{{"type","unlock"},{"id",id},{"status","success"}};
	socket->sendTextMessage(QJsonDocument{answer}.toJson(format));
}

// PROCESS ALL DATA REQUEST ///////////////////////////////////////////////////
void ApiWebSocketsServer::processAllDataRequest(QWebSocket *socket)
{
	// This type of message is sent by the client just after the connection.
	// The client will use the answer to init its data
	
	QString errorMessage;
	std::vector<Entry> entries = SqlInterface::getEntries(&errorMessage);
	if (errorMessage != "")
	{
		ApiWebSocketsServer::sendErrorMessage(socket,"getAllData request",errorMessage);
		return;
	}

	QJsonArray array;
	for (const Entry &e : entries) {array.push_back(e.toJsonObject());}
	socket->sendTextMessage(QJsonDocument{array}.toJson(format));
}

// PROCESS INSERT REQUEST /////////////////////////////////////////////////////
void ApiWebSocketsServer::processInsertRequest(const QJsonObject &obj, QWebSocket *socket)
{
	// extract the data from the message
	QString desc = obj["rqtData"].toObject().value("description").toString();
	int number = obj["rqtData"].toObject().value("number").toDouble();

	// insert it into the database
	QString errorMessage;
	Entry e = SqlInterface::insertEntry(desc,number,&errorMessage);
	if (e.id == 0 || errorMessage != "")
	{
		ApiWebSocketsServer::sendErrorMessage(socket,"insert request",errorMessage);
		return;
	}

	// notify all the users
	QJsonObject answerObj{{"type","insert"},{"entry",e.toJsonObject()}};
	QString answer = QJsonDocument{answerObj}.toJson(format);
	for (const User &u : m_clients) {u.socket->sendTextMessage(answer);}
}

// PROCESS UPDATE REQUEST /////////////////////////////////////////////////////
void ApiWebSocketsServer::processUpdateRequest(const QJsonObject &obj, QWebSocket *socket)
{
	// get the data from the message
	int id = obj["rqtData"].toObject().value("id").toDouble();
	QString desc = obj["rqtData"].toObject().value("description").toString();
	int number = obj["rqtData"].toObject().value("number").toDouble();

	// check the user has a lock on it
	if (!this->userHasLock(id,socket))
	{
		QString errorMessage = "You need to lock this entry to update it";
		ApiWebSocketsServer::sendErrorMessage(socket,"update request",errorMessage);
		return;
	}

	// update the entry in the database
	QString errorMessage;
	Entry e = SqlInterface::updateEntry(id,desc,number,&errorMessage);
	if (e.id == 0 || errorMessage != "")
	{
		ApiWebSocketsServer::sendErrorMessage(socket,"update request",errorMessage);
		return;
	}

	// notify all the users
	QJsonObject answerObj{{"type","update"},{"entry",e.toJsonObject()}};
	QString answer = QJsonDocument{answerObj}.toJson(format);
	for (const User &u : m_clients) {u.socket->sendTextMessage(answer);}
}

// PROCESS DELETE REQUEST /////////////////////////////////////////////////////
void ApiWebSocketsServer::processDeleteRequest(const QJsonObject &obj, QWebSocket *socket)
{
	int id = obj["rqtData"].toDouble();

	// check the user has a lock on it
	if (!this->userHasLock(id,socket))
	{
		QString errorMessage = "You need to lock this entry to delete it";
		ApiWebSocketsServer::sendErrorMessage(socket,"delete request",errorMessage);
		return;
	}

	// delete it
	QString errorMessage;
	if (!SqlInterface::deleteEntry(id,&errorMessage))
	{
		ApiWebSocketsServer::sendErrorMessage(socket,"delete request",errorMessage);
		return;
	}

	// delete the lock
	m_lockers.erase(id);

	// notify all the users
	QJsonObject answerObj{{"type","delete"},{"id",id}};
	QString answer = QJsonDocument{answerObj}.toJson(format);
	for (const User &u : m_clients) {u.socket->sendTextMessage(answer);}
}

