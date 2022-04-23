import DOMPurify from "dompurify";

export default class Chat {
    constructor() {
        // the openYet property is useful to establish a connection to the server only when the chat is first opened
        this.openedYet = false;
        this.chatWrapper = document.querySelector('#chat-wrapper');
        this.openIcon = document.querySelector('.header-chat-icon');
        this.injectHTML();
        this.chatLog = document.querySelector('#chat');
        this.chatField = document.querySelector('#chatField');
        this.chatForm = document.querySelector('#chatForm');
        this.closeIcon = document.querySelector('.chat-title-bar-close');
        this.events();
    }

    // Events
    events() {
        // We use arrow function because they do not modify the .this keywork
        this.openIcon.addEventListener('click', () => this.showChat());
        this.closeIcon.addEventListener('click', () => this.hideChat());
        this.chatForm.addEventListener('submit', (e) => {
            e.preventDefault()
            this.sendMessageToServer();
        })
    }

    // Methods
    showChat() {
        // this will be false only when the chat is first opened
        if(!this.openedYet) {
            this.openConnection();
        }
        this.openedYet = true;
        this.chatWrapper.classList.add('chat--visible');
        this.chatField.focus();
    }

    hideChat() {
        this.chatWrapper.classList.remove('chat--visible');
    }

    sendMessageToServer() {
        // this.socket is equal to io() because the openConnection() method
        
        // send the message data to the server
        this.socket.emit('chatMessageFromBrowser', {message: this.chatField.value});

        // set up the view for our own message
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
        <div class="chat-self">
            <div class="chat-message">
                <div class="chat-message-inner">
                    ${this.chatField.value}
                </div>
            </div>
            <img class="chat-avatar avatar-tiny" src="${this.avatar}">
        </div>
        `));

        // set scroll position to its exact scroll high value, in other words, scroll automatically to the bottom
        this.chatLog.scrollTop = this.chatLog.scrollHeight
        this.chatField.value = '';
        this.chatField.focus();
    }

    openConnection() {
        // Emit an event with a bit of data to the server
        this.socket = io();

        // grab the principal user data to use it on sendMessageToServer()
        this.socket.on('welcome', data => {
            this.username = data.username;
            this.avatar = data.avatar;
        })

        this.socket.on('chatMessageFromServer', (data) => {
            this.displayMessageFromServer(data);
        })
    }

    displayMessageFromServer(data) {
        this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
        <div class="chat-other">
            <a href="/profile/${data.username}"><img class="avatar-tiny" src="${data.avatar}"></a>
            <div class="chat-message"><div class="chat-message-inner">
                <a href="/profile/${data.username}"><strong>${data.username}:</strong></a>
                ${data.message}
            </div></div>
        </div>
        `
        ));

        // set scroll position to its exact scroll high value, in other words, scroll automatically to the bottom
        this.chatLog.scrollTop = this.chatLog.scrollHeight
    }

    injectHTML() {
        this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>

        <form id="chatForm" class="chat-form border-top">
            <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        `
    }
}